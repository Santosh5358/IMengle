import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    // Apply theme immediately, synchronously, before Angular renders
    const initialTheme = this.loadTheme();
    this.applyTheme(initialTheme);

    // Then set up the reactive effect for future changes
    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      localStorage.setItem('theme', t);
    });
  }

  toggle(): void {
    const newTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(newTheme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    // Force a synchronous update
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }

  private loadTheme(): Theme {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'dark';
  }
}
