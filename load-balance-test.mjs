#!/usr/bin/env node

/**
 * Single-file load balancing test.
 *
 * How to use:
 * 1) Edit CONFIG below (URL, requests, concurrency)
 * 2) Run: node load-balance-test.mjs
 */

const CONFIG = {
  url: 'https://imengle.onrender.com/api/health',
  requests: 2000,
  concurrency: 20,
  timeoutMs: 10000,
  method: 'GET',
  body: null,
  headers: {
    // Example:
    // Authorization: 'Bearer <token>'
  },
};

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

function fingerprintFromHeaders(headers) {
  const keys = [
    'x-instance-id',
    'x-served-by',
    'x-render-instance-id',
    'x-backend-server',
  ];

  for (const key of keys) {
    const value = headers.get(key);
    if (value) return `${key}=${value}`;
  }

  return null;
}

function fingerprintFromBody(text, contentType) {
  if (!contentType || !contentType.includes('application/json')) return null;
  try {
    const parsed = JSON.parse(text);
    const data = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    const keys = ['instanceId', 'hostname', 'serverId', 'pod'];
    for (const key of keys) {
      const value = data?.[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return `body.${key}=${String(value).trim()}`;
      }
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

async function main() {
  const { url, requests, concurrency, timeoutMs, method, body, headers } = CONFIG;

  if (!url || requests <= 0 || concurrency <= 0) {
    throw new Error('Invalid CONFIG. Set url, requests > 0, concurrency > 0.');
  }

  let next = 0;
  const latencies = [];
  const statusCounts = new Map();
  const instanceCounts = new Map();
  let networkErrors = 0;

  const started = Date.now();

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= requests) return;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const startNs = process.hrtime.bigint();

      try {
        const response = await fetch(url, {
          method,
          headers: {
            ...headers,
            ...(body ? { 'content-type': 'application/json' } : {}),
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        const endNs = process.hrtime.bigint();
        const ms = Number(endNs - startNs) / 1_000_000;
        latencies.push(ms);

        const status = String(response.status);
        statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);

        let fp = fingerprintFromHeaders(response.headers);
        if (!fp) {
          const text = await response.text();
          fp = fingerprintFromBody(text, response.headers.get('content-type') || '');
        }
        const instance = fp || 'unknown-instance';
        instanceCounts.set(instance, (instanceCounts.get(instance) ?? 0) + 1);
      } catch {
        networkErrors += 1;
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, requests) }, () => worker());
  await Promise.all(workers);

  const totalMs = Math.max(1, Date.now() - started);
  const sorted = [...latencies].sort((a, b) => a - b);
  const success = latencies.length;
  const completed = success + networkErrors;
  const avg = success ? sorted.reduce((s, v) => s + v, 0) / success : 0;

  console.log('=== Single File LB Test ===');
  console.log(`URL: ${url}`);
  console.log(`Requests: ${requests}`);
  console.log(`Concurrency: ${Math.min(concurrency, requests)}`);
  console.log(`Duration: ${totalMs} ms`);
  console.log(`Throughput: ${((completed * 1000) / totalMs).toFixed(2)} req/s`);
  console.log('');

  console.log('Latency:');
  console.log(`  min: ${(sorted[0] ?? 0).toFixed(2)} ms`);
  console.log(`  avg: ${avg.toFixed(2)} ms`);
  console.log(`  p50: ${percentile(sorted, 50).toFixed(2)} ms`);
  console.log(`  p90: ${percentile(sorted, 90).toFixed(2)} ms`);
  console.log(`  p99: ${percentile(sorted, 99).toFixed(2)} ms`);
  console.log(`  max: ${(sorted[sorted.length - 1] ?? 0).toFixed(2)} ms`);
  console.log('');

  console.log('Status counts:');
  for (const [status, count] of [...statusCounts.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  ${status}: ${count}`);
  }
  console.log(`  network-errors: ${networkErrors}`);
  console.log('');

  console.log('Instance distribution:');
  for (const [instance, count] of [...instanceCounts.entries()].sort((a, b) => b[1] - a[1])) {
    const pct = success ? (count * 100) / success : 0;
    console.log(`  ${instance}: ${count} (${pct.toFixed(2)}%)`);
  }

  if (instanceCounts.size === 1 && instanceCounts.has('unknown-instance')) {
    console.log('');
    console.log('Tip: Add X-Instance-Id header or instanceId in /api/health response to verify real load-balancing split.');
  }
}

main().catch((err) => {
  console.error('Test failed:', err?.message || err);
  process.exit(1);
});
