import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { environment } from '@env/environment';

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  activeSocketConnections: number;
  activeSessions: number;
  pendingReports: number;
  bannedUsers: number;
  totalSessionsToday: number;
}

interface UserDTO {
  id: string;
  username: string;
  country: string;
  gender: string;
  role: string;
  isBanned: boolean;
  lastActive: string;
  createdAt: string;
}

interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
}

interface ReportDTO {
  id: string;
  _id?: string;
  reporterId: string;
  reporterUsername: string;
  reportedId: string;
  reportedUsername: string;
  sessionId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
}

interface DirectCallAccessDTO {
  userId: string;
  username: string;
  enabled: boolean;
  allowedUsernames: string[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DecimalPipe, DatePipe],
  template: `
    <div class="min-h-screen pt-16 flex">
      <!-- Sidebar -->
      <aside class="hidden md:flex flex-col w-64 bg-surface-container/60 backdrop-blur-md border-r border-outline-variant/20 p-4">
        <h2 class="font-display font-bold text-lg text-on-surface mb-6 flex items-center gap-2">
          <span class="material-symbols-outlined text-neon-cyan">admin_panel_settings</span>
          Admin Console
        </h2>

        <nav class="space-y-1">
          @for (item of navItems; track item.id) {
            <button (click)="activeTab.set(item.id)"
                    class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    [class]="activeTab() === item.id
                      ? 'bg-neon-cyan/10 text-neon-cyan neon-border-cyan'
                      : 'text-on-surface-variant hover:bg-surface-container-high/50'">
              <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
              <span class="font-display text-label-md">{{ item.label }}</span>
            </button>
          }
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 p-4 md:p-8 overflow-auto">
        @if (activeTab() === 'dashboard') {
          <!-- Stats Grid -->
          <h1 class="font-display font-bold text-headline-lg text-on-surface mb-6">Dashboard</h1>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            @for (stat of statCards(); track stat.label) {
              <div class="glass p-6 hover:neon-border-cyan transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                  <span class="material-symbols-outlined text-2xl" [style.color]="stat.color">{{ stat.icon }}</span>
                  <span class="text-label-sm text-on-surface-variant font-display">{{ stat.label }}</span>
                </div>
                <div class="font-display font-bold text-3xl text-on-surface">{{ stat.value | number }}</div>
              </div>
            }
          </div>

          <!-- System Health -->
          <div class="glass p-6 mb-8">
            <h3 class="font-display font-semibold text-lg text-on-surface mb-4">System Health</h3>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="text-center">
                <div class="text-2xl font-bold text-green-400">99.9%</div>
                <div class="text-label-sm text-on-surface-variant">Uptime</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-neon-cyan">12ms</div>
                <div class="text-label-sm text-on-surface-variant">Avg Latency</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-primary">{{ stats()?.activeSessions || 0 }}</div>
                <div class="text-label-sm text-on-surface-variant">Active Calls</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-neon-magenta">{{ stats()?.totalSessionsToday || 0 }}</div>
                <div class="text-label-sm text-on-surface-variant">Sessions Today</div>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'users') {
          <h1 class="font-display font-bold text-headline-lg text-on-surface mb-6">Users</h1>

          @if (users().length === 0) {
            <div class="glass p-6 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl mb-2">group_off</span>
              <p>No users found yet.</p>
            </div>
          } @else {
            <div class="glass overflow-hidden">
              <table class="w-full">
                <thead>
                  <tr class="border-b border-outline-variant/20">
                    <th class="text-left px-6 py-4 text-label-md text-on-surface-variant font-display">Username</th>
                    <th class="text-left px-6 py-4 text-label-md text-on-surface-variant font-display hidden md:table-cell">Country</th>
                    <th class="text-left px-6 py-4 text-label-md text-on-surface-variant font-display hidden md:table-cell">Role</th>
                    <th class="text-left px-6 py-4 text-label-md text-on-surface-variant font-display">Status</th>
                    <th class="text-right px-6 py-4 text-label-md text-on-surface-variant font-display">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users(); track user.id) {
                    <tr class="border-b border-outline-variant/10 hover:bg-surface-container-high/30 transition-colors">
                      <td class="px-6 py-4 text-on-surface">{{ user.username }}</td>
                      <td class="px-6 py-4 text-on-surface-variant hidden md:table-cell">{{ user.country || '—' }}</td>
                      <td class="px-6 py-4 hidden md:table-cell">
                        <span class="px-2 py-1 rounded-md text-label-sm font-display"
                              [class]="user.role === 'ADMIN' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant'">
                          {{ user.role }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="flex items-center gap-1.5">
                          <span class="w-2 h-2 rounded-full" [class]="user.isBanned ? 'bg-error' : 'bg-green-400'"></span>
                          <span class="text-label-sm" [class]="user.isBanned ? 'text-error' : 'text-green-400'">
                            {{ user.isBanned ? 'Banned' : 'Active' }}
                          </span>
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        @if (user.isBanned) {
                          <button (click)="unbanUser(user.id)"
                                  class="px-3 py-1.5 rounded-lg text-label-sm font-display bg-green-400/10 text-green-400
                                         hover:bg-green-400/20 transition-all">
                            Unban
                          </button>
                        } @else {
                          <button (click)="banUser(user.id)"
                                  class="px-3 py-1.5 rounded-lg text-label-sm font-display bg-error/10 text-error
                                         hover:bg-error/20 transition-all">
                            Ban
                          </button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }

        @if (activeTab() === 'reports') {
          <h1 class="font-display font-bold text-headline-lg text-on-surface mb-6">
            Pending Reports
            <span class="ml-2 text-label-md text-neon-cyan">({{ stats()?.pendingReports || 0 }})</span>
          </h1>

          @if (reports().length === 0) {
            <div class="glass p-6 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl mb-2">gavel</span>
              <p>No reports available right now.</p>
              <p class="text-label-sm mt-2">When users submit reports, they will show up in this section.</p>
            </div>
          } @else {
            <div class="space-y-4">
              @for (report of reports(); track getReportId(report)) {
                <div class="glass p-5">
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <div class="flex items-center gap-2 mb-2">
                        <span class="material-symbols-outlined text-error">flag</span>
                        <span class="font-display text-label-md text-on-surface">{{ report.reason }}</span>
                        <span class="px-2 py-0.5 rounded-md text-label-sm bg-error/10 text-error">{{ report.status }}</span>
                      </div>
                      <p class="text-body-md text-on-surface-variant mb-2">{{ report.description || 'No additional details provided.' }}</p>
                      <div class="text-label-sm text-on-surface-variant">
                        Reporter: {{ report.reporterUsername || report.reporterId }} • Reported: {{ report.reportedUsername || report.reportedId }}
                      </div>
                      <div class="text-label-sm text-on-surface-variant">
                        Session: {{ report.sessionId || 'N/A' }}
                      </div>
                      <div class="text-label-sm text-on-surface-variant">
                        Reported At: {{ report.createdAt ? (report.createdAt | date:'yyyy-MM-dd HH:mm') : 'N/A' }}
                      </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                      <button (click)="resolveReport(getReportId(report), 'RESOLVED')"
                              class="px-3 py-1.5 rounded-lg text-label-sm font-display bg-green-400/10 text-green-400 hover:bg-green-400/20 transition-all">
                        Resolve
                      </button>
                      <button (click)="resolveReport(getReportId(report), 'BANNED')"
                              class="px-3 py-1.5 rounded-lg text-label-sm font-display bg-error/10 text-error hover:bg-error/20 transition-all">
                        Ban User
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        }

        @if (activeTab() === 'settings') {
          <h1 class="font-display font-bold text-headline-lg text-on-surface mb-6">Settings</h1>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="glass p-6">
              <h3 class="font-display font-semibold text-lg text-on-surface mb-2">Platform Defaults</h3>
              <p class="text-on-surface-variant text-body-md mb-4">
                Configure moderation and matchmaking defaults for all users.
              </p>
              <div class="space-y-3 text-on-surface-variant text-body-md">
                <div class="flex items-center justify-between">
                  <span>Auto-moderation</span>
                  <span class="text-neon-cyan">Enabled</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Match timeout</span>
                  <span>12 sec</span>
                </div>
                <div class="flex items-center justify-between">
                  <span>Max report retries</span>
                  <span>3</span>
                </div>
              </div>
            </div>

            <div class="glass p-6">
              <h3 class="font-display font-semibold text-lg text-on-surface mb-2">Admin Access</h3>
              <p class="text-on-surface-variant text-body-md mb-4">
                Review current admin-level capabilities.
              </p>
              <ul class="space-y-2 text-on-surface-variant text-body-md">
                <li>• Ban/unban users</li>
                <li>• View live usage stats</li>
                <li>• Monitor pending reports</li>
              </ul>
            </div>

            <div class="glass p-6 lg:col-span-2">
              <h3 class="font-display font-semibold text-lg text-on-surface mb-2">Direct Call Access Management</h3>
              <p class="text-on-surface-variant text-body-md mb-4">
                Grant direct call feature to selected users and define whom they can call.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 mb-6">
                <div>
                  <label class="block text-label-sm text-on-surface-variant mb-1">Username</label>
                  <input #directCallUsername
                         type="text"
                         placeholder="e.g. santosh"
                         class="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-neon-cyan/50" />
                </div>

                <div class="flex items-end">
                  <label class="inline-flex items-center gap-2 text-on-surface-variant">
                    <input #directCallEnabled
                           type="checkbox"
                           class="w-4 h-4 accent-cyan-400" />
                    Enable
                  </label>
                </div>

                <div class="md:col-span-2">
                  <label class="block text-label-sm text-on-surface-variant mb-1">Allowed Usernames (comma-separated)</label>
                  <input #allowedUsernames
                         type="text"
                         placeholder="e.g. Ashish, user2"
                         class="w-full px-3 py-2 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface focus:outline-none focus:border-neon-cyan/50" />
                </div>

                <div class="md:col-span-2">
                  <button (click)="saveDirectCallAccess(directCallUsername.value, directCallEnabled.checked, allowedUsernames.value)"
                          class="px-4 py-2 rounded-lg bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/30 transition-all">
                    Save Direct Call Access
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                @for (entry of directCallAccessList(); track entry.userId) {
                  <div class="rounded-lg border border-outline-variant/20 p-3 bg-surface-container-low/40">
                    <div class="text-on-surface font-display">{{ entry.username }}</div>
                    <div class="text-label-sm text-on-surface-variant">
                      Enabled: {{ entry.enabled ? 'Yes' : 'No' }}
                    </div>
                    <div class="text-label-sm text-on-surface-variant">
                      Allowed: {{ entry.allowedUsernames.length ? entry.allowedUsernames.join(', ') : 'None' }}
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  activeTab = signal('dashboard');
  stats = signal<DashboardStats | null>(null);
  users = signal<UserDTO[]>([]);
  reports = signal<ReportDTO[]>([]);
  directCallAccessList = signal<DirectCallAccessDTO[]>([]);

  navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'users', label: 'Users', icon: 'group' },
    { id: 'reports', label: 'Reports', icon: 'flag' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  statCards = signal<{ label: string; value: number; icon: string; color: string }[]>([]);

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadUsers();
    this.loadReports();
    this.loadDirectCallAccess();
  }

  loadDashboard(): void {
    this.http.get<{ data: DashboardStats }>(`${environment.apiUrl}/admin/dashboard`).subscribe(res => {
      this.stats.set(res.data);
      this.statCards.set([
        { label: 'Registered Accounts', value: res.data.totalUsers, icon: 'group', color: '#00dbe9' },
        { label: 'Online Users', value: res.data.onlineUsers, icon: 'wifi', color: '#4ade80' },
        { label: 'Active Socket Connections', value: res.data.activeSocketConnections, icon: 'wifi_protected_setup', color: '#7c3aed' },
        { label: 'Active Sessions', value: res.data.activeSessions, icon: 'call', color: '#d0bcff' },
        { label: 'Pending Reports', value: res.data.pendingReports, icon: 'flag', color: '#ffb4ab' },
        { label: 'Banned Users', value: res.data.bannedUsers, icon: 'block', color: '#ff6b6b' },
        { label: 'Sessions Today', value: res.data.totalSessionsToday, icon: 'today', color: '#ebb2ff' },
      ]);
    });
  }

  loadUsers(): void {
    this.http.get<{ data: ApiPage<UserDTO> }>(`${environment.apiUrl}/admin/users`).subscribe(res => {
      this.users.set(res.data.content);
    });
  }

  loadReports(): void {
    this.http.get<{ data: ApiPage<ReportDTO> }>(`${environment.apiUrl}/admin/reports`).subscribe(res => {
      const normalized = (res.data.content || []).map(report => ({
        ...report,
        id: report.id || report._id || '',
      }));
      this.reports.set(normalized);
    });
  }

  getReportId(report: ReportDTO): string {
    return report.id || report._id || '';
  }

  resolveReport(reportId: string, action: 'RESOLVED' | 'BANNED'): void {
    if (!reportId) {
      console.error('Cannot resolve report: missing report ID');
      return;
    }
    this.http.post(`${environment.apiUrl}/admin/reports/${reportId}/resolve?action=${action}`, {}).subscribe(() => {
      this.loadReports();
      this.loadDashboard();
      if (action === 'BANNED') this.loadUsers();
    });
  }

  banUser(userId: string): void {
    const reason = prompt('Enter ban reason:');
    if (!reason) return;
    this.http.post(`${environment.apiUrl}/admin/ban/${userId}?reason=${encodeURIComponent(reason)}`, {}).subscribe(() => {
      this.loadUsers();
      this.loadDashboard();
    });
  }

  unbanUser(userId: string): void {
    this.http.post(`${environment.apiUrl}/admin/unban/${userId}`, {}).subscribe(() => {
      this.loadUsers();
      this.loadDashboard();
    });
  }

  loadDirectCallAccess(): void {
    this.http.get<{ data: DirectCallAccessDTO[] }>(`${environment.apiUrl}/admin/direct-call/access`).subscribe({
      next: (res) => this.directCallAccessList.set(res.data || []),
      error: () => this.directCallAccessList.set([]),
    });
  }

  saveDirectCallAccess(username: string, enabled: boolean, allowedRaw: string): void {
    const normalizedUsername = (username || '').trim();
    if (!normalizedUsername) {
      alert('Please enter a username.');
      return;
    }

    const allowedUsernames = (allowedRaw || '')
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

    this.http.post(`${environment.apiUrl}/admin/direct-call/access`, {
      username: normalizedUsername,
      enabled,
      allowedUsernames,
    }).subscribe({
      next: () => {
        this.loadDirectCallAccess();
        this.loadUsers();
        alert('Direct call access updated.');
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to update direct call access.';
        alert(message);
      },
    });
  }
}
