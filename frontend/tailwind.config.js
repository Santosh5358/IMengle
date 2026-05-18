/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Using CSS Custom Properties ────────────────────
        surface: {
          DEFAULT: 'var(--surface)',
          dim: 'var(--surface-dim)',
          bright: 'var(--surface-bright)',
          'container-lowest': 'var(--surface-container-lowest)',
          'container-low': 'var(--surface-container-low)',
          'container': 'var(--surface-container)',
          'container-high': 'var(--surface-container-high)',
          'container-highest': 'var(--surface-container-highest)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: '#e9ddff',
          'fixed-dim': '#d0bcff',
        },
        'on-primary': {
          DEFAULT: 'var(--on-primary)',
          container: 'var(--on-primary-container)',
          fixed: '#23005c',
          'fixed-variant': '#5516be',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          fixed: '#a2eeff',
          'fixed-dim': '#2fd9f4',
        },
        'on-secondary': {
          DEFAULT: 'var(--on-secondary)',
          container: 'var(--on-secondary-container)',
          fixed: '#001f25',
          'fixed-variant': '#004e5a',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          fixed: '#ffd8e7',
          'fixed-dim': '#ffafd3',
        },
        error: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        // ─── Neon Accents ────────────────────────────
        neon: {
          cyan: '#00dbe9',
          magenta: '#ebb2ff',
          violet: '#d0bcff',
          pink: '#ffafd3',
          lime: '#a3e635',
        },
      },
      fontFamily: {
        display: ['Montserrat', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['56px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 219, 233, 0.3)',
        'neon-violet': '0 0 20px rgba(208, 188, 255, 0.3)',
        'neon-magenta': '0 0 20px rgba(235, 178, 255, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
      backdropBlur: {
        'glass': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-reverse': 'spin-reverse 6s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px rgba(0, 219, 233, 0.2)' },
          to: { boxShadow: '0 0 30px rgba(0, 219, 233, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
