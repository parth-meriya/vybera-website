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
        // ── Official Brand Palette ─────────────────────────────
        'vy-beige': '#E8D2B5',          // Warm Cream Beige
        'vy-sage': '#A5A79B',           // Muted Sage Grey
        'vy-burgundy': '#590907',       // Deep Burgundy (Primary CTA & Sale)
        'vy-burgundy-hover': '#430605',
        'vy-burgundy-light': '#7A1310',
        'vy-cream': '#F3E7D8',          // Secondary Background
        'vy-card-bg': '#FAF5ED',        // Card Background
        
        // ── Text Tokens ────────────────────────────────────────
        'vy-text': '#30231F',           // Primary Dark Text
        'vy-text-secondary': '#75665C', // Secondary Dark Text
        'vy-text-muted': '#75665C',     // Muted Text
        'vy-text-light': '#FAF5ED',     // Primary Light Text (on dark surfaces)
        'vy-text-light-secondary': '#D4BEA5', // Secondary Light Text (on dark surfaces)
        
        // ── Dark Surface Tokens ────────────────────────────────
        'vy-dark-bg': '#241916',        // Dark Background (intentional dark sections)
        'vy-dark-card': '#30231F',      // Dark Card
        
        'vy-border-light': '#D4BEA5',   // Border
        'vy-border': '#D4BEA5',
        'vy-sand': '#DFD3C3',

        // ── Extended & Legacy Compatibility ────────────────────
        'vy-black': '#241916',
        'vy-dark': '#FAF5ED',
        'vy-card': '#FAF5ED',
        'vy-grey': '#75665C',
        'vy-light': '#E8D2B5',
        'vy-white': '#FFFFFF',
        'vy-accent': '#590907',

        // ── Admin Theme Colors ─────────────────────────────────
        'admin-burgundy': '#590907',
        'admin-bg': '#F3E7D8',
        'admin-card': '#FAF5ED',
        'admin-sidebar': '#E8D2B5',
        'admin-text': '#30231F',
        'admin-text-secondary': '#75665C',
        'admin-border': '#D4BEA5',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards',
        'slide-up': 'slideUp 0.7s ease forwards',
        'marquee': 'marquee 22s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(89,9,7,0.15)' },
          '50%': { boxShadow: '0 0 20px rgba(89,9,7,0.35)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
