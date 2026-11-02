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
        'vy-cream': '#F3E7D8',          // Secondary Cream
        'vy-card-bg': '#FAF5ED',        // Card Background
        'vy-text': '#30231F',           // Primary Text (Deep Espresso)
        'vy-text-muted': '#7A6E69',     // Muted Text
        'vy-border-light': '#E5DACD',   // Elegant border
        'vy-sand': '#DFD3C3',

        // ── Extended & Legacy Compatibility ────────────────────
        'vy-black': '#1E1614',
        'vy-dark': '#FAF5ED',
        'vy-card': '#FAF5ED',
        'vy-border': '#D8CBBF',
        'vy-grey': '#A5A79B',
        'vy-light': '#E8D2B5',
        'vy-white': '#FFFFFF',
        'vy-accent': '#590907',
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
