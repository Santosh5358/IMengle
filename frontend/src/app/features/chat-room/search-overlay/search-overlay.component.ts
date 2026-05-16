import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-search-overlay',
  standalone: true,
  template: `
    <div class="absolute inset-0 z-20 flex items-center justify-center bg-surface/90 backdrop-blur-xl mt-16">
      <div class="flex flex-col items-center text-center animate-fadeInUp">
        <!-- Animated Rings -->
        <div class="relative w-52 h-52 mb-8">
          <!-- Outer Ring -->
          <div class="absolute inset-0 rounded-full border-2 border-neon-cyan/30 animate-spin-slow"></div>
          <!-- Middle Ring -->
          <div class="absolute inset-4 rounded-full border-2 border-primary/30 animate-spin-reverse"></div>
          <!-- Inner Ring -->
          <div class="absolute inset-8 rounded-full border border-neon-magenta/20 animate-spin-slow" style="animation-duration: 12s;"></div>

          <!-- Orbiting Dots -->
          <div class="absolute inset-0 animate-spin-slow">
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-neon-cyan shadow-neon-cyan"></div>
          </div>
          <div class="absolute inset-4 animate-spin-reverse">
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-neon-violet"></div>
          </div>

          <!-- Center Avatar -->
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="w-20 h-20 rounded-full bg-surface-container-high border-2 border-neon-cyan/50
                        flex items-center justify-center neon-glow-cyan">
              <span class="material-symbols-outlined text-4xl text-neon-cyan">person_search</span>
            </div>
          </div>

          <!-- Sweep Line -->
          <div class="absolute inset-0 animate-spin" style="animation-duration: 2s;">
            <div class="absolute top-1/2 left-1/2 w-1/2 h-0.5
                        bg-gradient-to-r from-neon-cyan/50 to-transparent origin-left"></div>
          </div>
        </div>

        <!-- Status Text -->
        <h2 class="font-display font-bold text-headline-md text-on-surface mb-2">
          Finding someone special...
        </h2>
        <p class="text-body-md text-on-surface-variant mb-2">
          Scanning the constellation for your next connection
        </p>

        <!-- Queue Stats -->
        <div class="flex gap-6 mt-4 mb-8">
          <div class="glass px-4 py-2 rounded-xl text-center">
            <div class="text-label-sm text-on-surface-variant font-display">QUEUE</div>
            <div class="text-lg font-bold text-neon-cyan">{{ queuePosition }}</div>
          </div>
          <div class="glass px-4 py-2 rounded-xl text-center">
            <div class="text-label-sm text-on-surface-variant font-display">SCOPE</div>
            <div class="text-lg font-bold text-primary">WORLDWIDE</div>
          </div>
        </div>

        <!-- Cancel Button -->
        <button (click)="cancel.emit()" class="btn-ghost px-8">
          <span class="flex items-center gap-2">
            <span class="material-symbols-outlined">close</span>
            Cancel Search
          </span>
        </button>
      </div>
    </div>
  `,
})
export class SearchOverlayComponent {
  @Input() queuePosition = 0;
  @Output() cancel = new EventEmitter<void>();
}
