/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Space Grotesk', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        'vy-black': '#111111',
        'vy-dark': '#1C2A21',
        'vy-card': '#111111',
        'vy-border': '#55785F',
        'vy-grey': '#C5C1B5',
        'vy-light': '#D9C7A6',
        'vy-white': '#F2EFE6',
        'vy-accent': '#B78E5C',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.7s ease forwards',
        'marquee': 'marquee 20s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255,255,255,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(255,255,255,0.3)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
