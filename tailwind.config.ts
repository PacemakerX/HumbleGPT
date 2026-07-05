import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        linkedin: {
          400: '#4cb3ff',
          500: '#0a66c2',
          600: '#075cab',
        },
      },
      boxShadow: {
        glow: '0 0 45px rgba(10, 102, 194, 0.28)',
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        reveal: 'reveal 520ms ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
