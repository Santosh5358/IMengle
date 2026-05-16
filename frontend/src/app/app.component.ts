import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';

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
export class AppComponent {}
