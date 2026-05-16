import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { environment } from '@env/environment';

interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
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

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [DecimalPipe],
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

        @if (activeTab() === 'reports') {
          <h1 class="font-display font-bold text-headline-lg text-on-surface mb-6">
            Pending Reports
            <span class="ml-2 text-label-md text-neon-cyan">({{ stats()?.pendingReports || 0 }})</span>
          </h1>

          <div class="space-y-4">
            <div class="glass p-6 text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl mb-2">gavel</span>
              <p>Reports will appear here when users submit them.</p>
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
  }

  loadDashboard(): void {
    this.http.get<{ data: DashboardStats }>(`${environment.apiUrl}/admin/dashboard`).subscribe(res => {
      this.stats.set(res.data);
      this.statCards.set([
        { label: 'Total Users', value: res.data.totalUsers, icon: 'group', color: '#00dbe9' },
        { label: 'Online Now', value: res.data.onlineUsers, icon: 'wifi', color: '#4ade80' },
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
}
