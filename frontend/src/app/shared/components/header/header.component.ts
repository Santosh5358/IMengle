import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <header class="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/" class="flex items-center gap-2 group">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-surface text-xl">videocam</span>
            </div>
            <span class="font-display font-bold text-lg tracking-tight text-on-surface group-hover:text-neon-cyan transition-colors">
              IMegle
            </span>
          </a>

          <!-- Center: Online Count -->
          <div class="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/50 border border-outline-variant/20">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-label-sm text-on-surface-variant font-display">
              {{ socketService.onlineCount() | number }} online
            </span>
          </div>

          <!-- Right: Actions -->
          <div class="flex items-center gap-3">
            @if (authService.isAuthenticated()) {
              <!-- User Menu -->
              <div class="flex items-center gap-2">
                <span class="text-label-sm text-on-surface-variant font-display hidden sm:block">
                  {{ authService.currentUser()?.username }}
                </span>
                <button (click)="authService.logout()"
                        class="w-9 h-9 rounded-lg bg-surface-container-high/50 border border-outline-variant/20
                               flex items-center justify-center hover:bg-error/20 hover:border-error/30 transition-all">
                  <span class="material-symbols-outlined text-on-surface-variant text-lg">logout</span>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  constructor(
    public authService: AuthService,
    public socketService: SocketService,
  ) {}
}
