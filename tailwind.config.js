/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0d9488',
          dark: '#0f766e',
          light: '#2dd4bf',
        },
        secondary: '#0ea5e9',
        accent: '#f59e0b',
        'light-bg': '#f8fafc',
        'dark-bg': '#020617', 
        'dark-card': '#0f172a', 
        'dark-border': '#1e293b',
        'dark-text': '#f8fafc',
        'dark-muted': '#94a3b8',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'bounce-subtle': 'bounceSubtle 2s infinite',
        'zoom-in': 'zoomIn 0.2s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(15px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceSubtle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
        zoomIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } }
      }
    },
  },
  plugins: [],
}
