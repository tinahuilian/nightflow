/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // NightFlow 深夜配色
        night: {
          50:  '#e8e8f0',
          100: '#c5c5d8',
          200: '#9999bb',
          300: '#6d6d9e',
          400: '#4a4a88',
          500: '#2d2d6b',
          600: '#1e1e4a',
          700: '#1a1a3e',
          800: '#141428',
          900: '#0f0f1a',
          950: '#0a0a12',
        },
        purple: {
          dream: '#6366f1',
          soft:  '#8b5cf6',
          mist:  '#a78bfa',
        },
        blue: {
          night: '#1a1a2e',
          deep:  '#16213e',
          calm:  '#0f3460',
        },
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'breathe-slow': 'breathe 8s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 12s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.15)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.9' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
