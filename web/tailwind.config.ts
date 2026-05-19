import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15141f',
        brand: '#7d72de',
        plum: '#4f3394',
        coral: '#ff7460',
        mint: '#45c8a5',
        sun: '#ffc34d',
        cream: '#fff8ed',
      },
      boxShadow: {
        soft: '0 14px 38px rgba(21, 20, 31, 0.09)',
        premium: '0 24px 72px rgba(21, 20, 31, 0.16)',
      },
    },
  },
  plugins: [],
} satisfies Config
