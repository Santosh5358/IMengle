/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Celestial Neon Theme ────────────────────
        surface: {
          DEFAULT: '#11131d',
          dim: '#11131d',
          bright: '#373844',
          'container-lowest': '#0c0e18',
          'container-low': '#191b26',
          'container': '#1d1f2a',
          'container-high': '#282934',
          'container-highest': '#32343f',
        },
        'on-surface': {
          DEFAULT: '#e1e1f0',
          variant: '#cbc3d7',
        },
        primary: {
          DEFAULT: '#d0bcff',
          container: '#a078ff',
          fixed: '#e9ddff',
          'fixed-dim': '#d0bcff',
        },
        'on-primary': {
          DEFAULT: '#3c0091',
          container: '#340080',
          fixed: '#23005c',
          'fixed-variant': '#5516be',
        },
        secondary: {
          DEFAULT: '#5de6ff',
          container: '#00cbe6',
          fixed: '#a2eeff',
          'fixed-dim': '#2fd9f4',
        },
        'on-secondary': {
          DEFAULT: '#00363e',
          container: '#00515d',
          fixed: '#001f25',
          'fixed-variant': '#004e5a',
        },
        tertiary: {
          DEFAULT: '#ffafd3',
          container: '#e364a7',
          fixed: '#ffd8e7',
          'fixed-dim': '#ffafd3',
        },
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        outline: {
          DEFAULT: '#958ea0',
          variant: '#494454',
        },
        // ─── Neon Accents ────────────────────────────
        neon: {
          cyan: '#00dbe9',
          magenta: '#ebb2ff',
          violet: '#d0bcff',
          pink: '#ffafd3',
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
