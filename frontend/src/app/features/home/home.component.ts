import { Component, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="min-h-screen pt-16 relative overflow-hidden">
      <!-- Background Gradient Blobs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full
                     bg-gradient-to-br from-neon-cyan/10 to-transparent blur-3xl animate-pulse-slow"></div>
        <div class="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full
                     bg-gradient-to-br from-primary/10 to-transparent blur-3xl animate-pulse-slow"
             style="animation-delay: 1.5s;"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full
                     bg-gradient-to-br from-neon-magenta/5 to-transparent blur-3xl animate-float"></div>
      </div>

      <!-- Hero Section -->
      <section class="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
        <!-- Badge -->
        <div class="animate-fadeInUp mb-8 px-4 py-2 rounded-full glass neon-border-cyan">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-label-sm text-neon-cyan font-display">
              {{ socketService.onlineCount() | number }} people online now
            </span>
          </div>
        </div>

        <!-- Title -->
        <h1 class="animate-fadeInUp font-display font-extrabold text-4xl sm:text-5xl md:text-display-lg
                    text-on-surface leading-tight max-w-4xl" style="animation-delay: 0.1s;">
          Spontaneous Connections
          <br>
          <span class="bg-gradient-to-r from-neon-cyan via-primary to-neon-magenta bg-clip-text text-transparent">
            in the Digital Universe
          </span>
        </h1>

        <!-- Subtitle -->
        <p class="animate-fadeInUp mt-6 text-body-lg text-on-surface-variant max-w-2xl" style="animation-delay: 0.2s;">
          Meet new people from around the world through instant random video chat.
          One click, one connection, infinite possibilities.
        </p>

        <!-- Start Button -->
        <div class="animate-fadeInUp mt-10 flex flex-col sm:flex-row gap-4" style="animation-delay: 0.3s;">
          @if (!authService.isAuthenticated()) {
            <button (click)="startAnonymous()"
                    [disabled]="isLoading()"
                    class="btn-primary text-lg px-10 py-4 neon-glow-cyan">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">videocam</span>
                {{ isLoading() ? 'Connecting...' : 'Start Chatting' }}
              </span>
            </button>

            <button (click)="showLogin.set(true)"
                    class="btn-ghost text-lg px-10 py-4">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">login</span>
                Sign In
              </span>
            </button>
          } @else {
            <button (click)="enterChatRoom()"
                    class="btn-primary text-lg px-10 py-4 neon-glow-cyan">
              <span class="flex items-center gap-2">
                <span class="material-symbols-outlined">videocam</span>
                Enter Chat Room
              </span>
            </button>
          }
        </div>

        <!-- Feature Cards -->
        <div class="animate-fadeInUp mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full" style="animation-delay: 0.5s;">
          <div class="glass p-6 text-center group hover:neon-border-cyan transition-all duration-300">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-neon-cyan/10 flex items-center justify-center
                        group-hover:shadow-neon-cyan transition-all">
              <span class="material-symbols-outlined text-neon-cyan text-2xl">bolt</span>
            </div>
            <h3 class="font-display font-semibold text-on-surface mb-2">Instant Match</h3>
            <p class="text-body-md text-on-surface-variant">Connect with a random stranger in seconds</p>
          </div>

          <div class="glass p-6 text-center group hover:neon-border-violet transition-all duration-300">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center
                        group-hover:shadow-neon-violet transition-all">
              <span class="material-symbols-outlined text-primary text-2xl">shield</span>
            </div>
            <h3 class="font-display font-semibold text-on-surface mb-2">Safety First</h3>
            <p class="text-body-md text-on-surface-variant">Report & block with AI-powered moderation</p>
          </div>

          <div class="glass p-6 text-center group hover:neon-border-violet transition-all duration-300">
            <div class="w-12 h-12 mx-auto mb-4 rounded-xl bg-neon-magenta/10 flex items-center justify-center
                        group-hover:shadow-neon-magenta transition-all">
              <span class="material-symbols-outlined text-neon-magenta text-2xl">hd</span>
            </div>
            <h3 class="font-display font-semibold text-on-surface mb-2">HD Video</h3>
            <p class="text-body-md text-on-surface-variant">Crystal clear video & audio quality</p>
          </div>
        </div>
      </section>

      <!-- Login Modal -->
      @if (showLogin()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
             (click)="showLogin.set(false)">
          <div class="glass-strong p-8 rounded-2xl max-w-md w-full mx-4 animate-scaleIn neon-border-cyan"
               (click)="$event.stopPropagation()">
            <h2 class="font-display font-bold text-headline-md text-on-surface mb-6">Welcome Back</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-label-md text-on-surface-variant mb-2 font-display">Username</label>
                <input [(ngModel)]="loginUsername" type="text" placeholder="Enter username"
                       class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                              text-on-surface placeholder:text-outline focus:outline-none focus:border-neon-cyan/50
                              focus:shadow-neon-cyan/20 transition-all">
              </div>
              <div>
                <label class="block text-label-md text-on-surface-variant mb-2 font-display">Password</label>
                <input [(ngModel)]="loginPassword" type="password" placeholder="Enter password"
                       class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                              text-on-surface placeholder:text-outline focus:outline-none focus:border-neon-cyan/50
                              focus:shadow-neon-cyan/20 transition-all">
              </div>

              @if (loginError()) {
                <p class="text-error text-label-sm">{{ loginError() }}</p>
              }

              <button (click)="handleLogin()" [disabled]="isLoading()"
                      class="btn-primary w-full py-3">
                {{ isLoading() ? 'Signing in...' : 'Sign In' }}
              </button>

              <p class="text-center text-label-sm text-on-surface-variant">
                No account?
                <button (click)="showLogin.set(false); showRegister.set(true)"
                        class="text-neon-cyan hover:underline">Register</button>
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Register Modal -->
      @if (showRegister()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
             (click)="showRegister.set(false)">
          <div class="glass-strong p-8 rounded-2xl max-w-md w-full mx-4 animate-scaleIn neon-border-violet"
               (click)="$event.stopPropagation()">
            <h2 class="font-display font-bold text-headline-md text-on-surface mb-6">Create Account</h2>

            <div class="space-y-4">
              <div>
                <label class="block text-label-md text-on-surface-variant mb-2 font-display">Username</label>
                <input [(ngModel)]="regUsername" type="text" placeholder="Choose a username"
                       class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                              text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 transition-all">
              </div>
              <div>
                <label class="block text-label-md text-on-surface-variant mb-2 font-display">Password</label>
                <input [(ngModel)]="regPassword" type="password" placeholder="Create a password"
                       class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                              text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 transition-all">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-label-md text-on-surface-variant mb-2 font-display">Gender</label>
                  <select [(ngModel)]="regGender"
                          class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                                 text-on-surface focus:outline-none focus:border-primary/50 transition-all">
                    <option value="">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label class="block text-label-md text-on-surface-variant mb-2 font-display">Country</label>
                  <input [(ngModel)]="regCountry" type="text" placeholder="e.g. US" maxlength="3"
                         class="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-outline-variant/30
                                text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/50 transition-all">
                </div>
              </div>

              @if (loginError()) {
                <p class="text-error text-label-sm">{{ loginError() }}</p>
              }

              <button (click)="handleRegister()" [disabled]="isLoading()"
                      class="btn-primary w-full py-3">
                {{ isLoading() ? 'Creating...' : 'Create Account' }}
              </button>

              <p class="text-center text-label-sm text-on-surface-variant">
                Have an account?
                <button (click)="showRegister.set(false); showLogin.set(true)"
                        class="text-neon-cyan hover:underline">Sign In</button>
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class HomeComponent {
  showLogin = signal(false);
  showRegister = signal(false);
  isLoading = signal(false);
  loginError = signal('');

  loginUsername = '';
  loginPassword = '';
  regUsername = '';
  regPassword = '';
  regGender = '';
  regCountry = '';

  constructor(
    public authService: AuthService,
    public socketService: SocketService,
    private router: Router,
  ) {
    this.socketService.connect();
  }

  startAnonymous(): void {
    this.isLoading.set(true);
    this.authService.createAnonymousSession().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.socketService.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginError.set('Failed to create session. Please try again.');
      }
    });
  }

  handleLogin(): void {
    if (!this.loginUsername || !this.loginPassword) {
      this.loginError.set('Please fill in all fields');
      return;
    }
    this.isLoading.set(true);
    this.loginError.set('');
    this.authService.login(this.loginUsername, this.loginPassword).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showLogin.set(false);
        this.socketService.connect();
        const user = this.authService.currentUser();
        this.router.navigate([user?.role === 'ADMIN' ? '/admin' : '/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginError.set(err.error?.message || 'Invalid credentials');
      }
    });
  }

  handleRegister(): void {
    if (!this.regUsername || !this.regPassword) {
      this.loginError.set('Username and password are required');
      return;
    }
    this.isLoading.set(true);
    this.loginError.set('');
    this.authService.register(this.regUsername, this.regPassword, this.regCountry, this.regGender).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showRegister.set(false);
        this.socketService.connect();
        this.router.navigate(['/chat']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginError.set(err.error?.message || 'Registration failed');
      }
    });
  }

  enterChatRoom(): void {
    this.socketService.connect();
    this.router.navigate(['/chat']);
  }
}
