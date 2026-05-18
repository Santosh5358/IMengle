#!/usr/bin/env node

/**
 * Load-balancing checker for HTTP endpoints.
 *
 * Usage:
 *   node scripts/check-load-balancing.mjs --url http://localhost:8080/api/health --requests 500 --concurrency 25
 *
 * Optional:
 *   --method GET|POST|PUT|DELETE
 *   --body '{"foo":"bar"}'
 *   --header 'Authorization: Bearer ...' (repeatable)
 *   --timeout 10000
 *   --insecure true  (allow self-signed TLS)
 */

import process from 'node:process';

function parseArgs(argv) {
  const args = {
    url: '',
    requests: 200,
    concurrency: 20,
    method: 'GET',
    body: undefined,
    headers: {},
    timeout: 10000,
    insecure: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];

    if (k === '--url' && v) {
      args.url = v;
      i++;
    } else if (k === '--requests' && v) {
      args.requests = Number(v);
      i++;
    } else if (k === '--concurrency' && v) {
      args.concurrency = Number(v);
      i++;
    } else if (k === '--method' && v) {
      args.method = v.toUpperCase();
      i++;
    } else if (k === '--body' && v) {
      args.body = v;
      i++;
    } else if (k === '--header' && v) {
      const idx = v.indexOf(':');
      if (idx > 0) {
        const name = v.slice(0, idx).trim();
        const value = v.slice(idx + 1).trim();
        args.headers[name] = value;
      }
      i++;
    } else if (k === '--timeout' && v) {
      args.timeout = Number(v);
      i++;
    } else if (k === '--insecure' && v) {
      args.insecure = v.toLowerCase() === 'true';
      i++;
    }
  }

  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

function getHeadersFingerprint(headers) {
  const candidates = [
    'x-instance-id',
    'x-served-by',
    'x-backend-server',
    'x-render-instance-id',
    'x-render-routing',
    'x-amzn-trace-id',
    'x-vercel-id',
    'cf-ray',
    'server',
    'via',
  ];

  for (const key of candidates) {
    const val = headers.get(key);
    if (val) {
      return `${key}=${val}`;
    }
  }

  return null;
}

function getBodyFingerprint(text, contentType) {
  if (!contentType || !contentType.toLowerCase().includes('application/json')) {
    return null;
  }

  try {
    const obj = JSON.parse(text);
    const flat = obj?.data && typeof obj.data === 'object' ? obj.data : obj;
    const candidates = ['instanceId', 'instance', 'hostname', 'pod', 'node', 'serverId'];

    for (const key of candidates) {
      const val = flat?.[key];
      if (val !== undefined && val !== null && String(val).trim()) {
        return `body.${key}=${String(val).trim()}`;
      }
    }
  } catch {
    // Ignore invalid JSON.
  }

  return null;
}

function printUsage() {
  console.log('Usage:');
  console.log('  node scripts/check-load-balancing.mjs --url <endpoint> [--requests 200] [--concurrency 20]');
  console.log('');
  console.log('Example:');
  console.log('  node scripts/check-load-balancing.mjs --url http://localhost:8080/api/health --requests 500 --concurrency 25');
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.url || !Number.isFinite(args.requests) || !Number.isFinite(args.concurrency)) {
    printUsage();
    process.exit(1);
  }

  if (args.insecure) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }

  const startedAt = Date.now();
  const latencies = [];
  const statusCounts = new Map();
  const fingerprints = new Map();
  let networkErrors = 0;

  let nextIndex = 0;

  async function runOne(id) {
    while (true) {
      const current = nextIndex;
      nextIndex += 1;
      if (current >= args.requests) break;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), args.timeout);

      const reqStart = process.hrtime.bigint();

      try {
        const res = await fetch(args.url, {
          method: args.method,
          headers: {
            ...args.headers,
            ...(args.body ? { 'content-type': 'application/json' } : {}),
          },
          body: args.body,
          signal: controller.signal,
        });

        const reqEnd = process.hrtime.bigint();
        const ms = Number(reqEnd - reqStart) / 1_000_000;
        latencies.push(ms);

        const statusKey = String(res.status);
        statusCounts.set(statusKey, (statusCounts.get(statusKey) ?? 0) + 1);

        let fp = getHeadersFingerprint(res.headers);
        if (!fp) {
          const text = await res.text();
          fp = getBodyFingerprint(text, res.headers.get('content-type'));
        }

        const finalFp = fp ?? 'unknown-instance';
        fingerprints.set(finalFp, (fingerprints.get(finalFp) ?? 0) + 1);
      } catch {
        networkErrors += 1;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const workers = [];
  const workerCount = Math.max(1, Math.min(args.concurrency, args.requests));
  for (let i = 0; i < workerCount; i++) {
    workers.push(runOne(i));
  }

  await Promise.all(workers);

  const endedAt = Date.now();
  const durationMs = Math.max(1, endedAt - startedAt);

  const sortedLatency = [...latencies].sort((a, b) => a - b);
  const successCount = latencies.length;
  const totalCompleted = successCount + networkErrors;

  const min = sortedLatency[0] ?? 0;
  const max = sortedLatency[sortedLatency.length - 1] ?? 0;
  const avg = sortedLatency.length > 0
    ? sortedLatency.reduce((s, x) => s + x, 0) / sortedLatency.length
    : 0;

  console.log('=== Load Balancing Check Report ===');
  console.log(`Target: ${args.url}`);
  console.log(`Requests configured: ${args.requests}`);
  console.log(`Concurrency: ${workerCount}`);
  console.log(`Duration: ${durationMs} ms`);
  console.log(`Throughput: ${((totalCompleted * 1000) / durationMs).toFixed(2)} req/s`);
  console.log('');

  console.log('Latency (successful requests):');
  console.log(`  min: ${min.toFixed(2)} ms`);
  console.log(`  avg: ${avg.toFixed(2)} ms`);
  console.log(`  p50: ${percentile(sortedLatency, 50).toFixed(2)} ms`);
  console.log(`  p90: ${percentile(sortedLatency, 90).toFixed(2)} ms`);
  console.log(`  p99: ${percentile(sortedLatency, 99).toFixed(2)} ms`);
  console.log(`  max: ${max.toFixed(2)} ms`);
  console.log('');

  console.log('Status distribution:');
  const statusRows = [...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]));
  for (const [status, count] of statusRows) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`  network-errors: ${networkErrors}`);
  console.log('');

  console.log('Instance distribution (best-effort fingerprint):');
  const fpRows = [...fingerprints.entries()].sort((a, b) => b[1] - a[1]);
  for (const [fp, count] of fpRows) {
    const pct = (count * 100) / Math.max(1, successCount);
    console.log(`  ${fp}: ${count} (${pct.toFixed(2)}%)`);
  }

  if (fpRows.length === 1 && fpRows[0][0] === 'unknown-instance') {
    console.log('');
    console.log('Note: Could not detect per-instance identity from headers/body.');
    console.log('Add an instance id header (e.g., X-Instance-Id) or field in /api/health to verify true LB distribution.');
  }
}

main().catch((err) => {
  console.error('Failed to run load-balancing check:', err?.message || err);
  process.exit(1);
});
