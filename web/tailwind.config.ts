import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15141f',
        brand: '#6355d8',
        plum: '#4f3394',
        coral: '#ff7460',
        mint: '#45c8a5',
        sun: '#ffc34d',
        cream: '#fff8ed',
        
        // Premium UI new colors
        'warm-white': '#fdfbf7',
        'soft-cream': '#f9f6ef',
        'gold-accent': '#d4af37',
        'gold-light': '#f3e5ab',
        'deep-navy': '#0a1128',
        'rich-purple-black': '#120d1e',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Playfair Display', 'Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 14px 38px rgba(21, 20, 31, 0.09)',
        premium: '0 24px 72px rgba(21, 20, 31, 0.16)',
        'glow-gold': '0 0 15px rgba(212, 175, 55, 0.4)',
      },
      backgroundImage: {
        'celebration-light': 'linear-gradient(135deg, #fdfbf7 0%, #f9f6ef 50%, #f3e5ab 100%)',
        'celebration-dark': 'linear-gradient(135deg, #0a1128 0%, #120d1e 50%, #1a1625 100%)',
      }
    },
  },
  plugins: [],
} satisfies Config
