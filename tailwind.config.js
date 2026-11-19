/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: {
          950: '#060d1a',
          900: '#0a1424',
          850: '#0e1a2e',
          800: '#13233c',
          700: '#1b3052',
          600: '#27406b',
        },
        accent: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        safe: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        warn: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
        high: {
          400: '#fb923c',
          500: '#f97316',
        },
        crit: {
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(56,189,248,0.18), 0 8px 30px rgba(8,16,32,0.55)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 10px 30px rgba(0,0,0,0.35)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        pulseSoft: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};
