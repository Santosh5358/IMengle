import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="min-h-screen bg-surface text-on-surface font-body">
      <app-header />
      <main>
        <router-outlet />
      </main>
    </div>
  `,
})
export class AppComponent {
  constructor() {
    // Inject ThemeService to ensure it's initialized and sets up the theme on app startup
    inject(ThemeService);
  }
}
