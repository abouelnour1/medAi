
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts}",
    "./utils/**/*.{js,ts}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: { 
          DEFAULT: '#14b8a6', 
          light: '#5eead4', 
          dark: '#0f766e' 
        },
        secondary: '#0d9488',
        accent: '#f59e0b',
        // الألوان الأساسية التي يعتمد عليها تصميم الواجهة
        'light-bg': '#f8fafc',
        'dark-bg': '#0f172a',
        'light-card': '#ffffff',
        'dark-card': '#1e293b',
        'light-text': '#0f172a',
        'dark-text': '#f8fafc',
        'light-text-secondary': '#64748b',
        'dark-text-secondary': '#94a3b8'
      },
      fontFamily: {
        sans: ['Cairo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        cairo: ['Cairo', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'zoom-in': 'zoomIn 0.2s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-subtle': 'bounceSubtle 2s infinite'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        zoomIn: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        bounceSubtle: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } }
      }
    }
  },
  plugins: [],
}
