import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    // Set initial theme on first load
    this.applyTheme(this.theme());

    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      localStorage.setItem('theme', t);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }

  private loadTheme(): Theme {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  }
}
