/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#006a60",   // teal700 — brand primary
          dark:    "#003d37",   // teal900
          light:   "#00a896",   // teal500
          ultra:   "#eef9f6",   // teal50
          mid:     "#7fd4c6",   // teal300
        },
        brand: {
          900: "#003d37",
          700: "#006a60",
          500: "#00a896",
          300: "#7fd4c6",
          100: "#cdeee7",
          50:  "#eef9f6",
        },
        gold: {
          700: "#b8842a",
          500: "#e0a84a",
          100: "#faecd0",
        },
        ink: {
          DEFAULT: "#0e1a18",
          80:      "#2a3532",
          60:      "#55605c",
          40:      "#8a938f",
          20:      "#c9cfcc",
          10:      "#e6eae7",
        },
        paper:    "#f7f9f6",
        secondary:    "#0ea5e9",
        accent:       "#e0a84a",
        "light-bg":   "#f7f9f6",
        "dark-bg":    "#060f0e",
        "dark-card":  "#0d1a18",
        "dark-border":"#1a2e2b",
        "dark-text":  "#f0f7f5",
        "dark-muted": "#8a9e9b",
      },
      fontFamily: {
        sans:    ["IBM Plex Sans Arabic", "IBM Plex Sans", "Cairo", "sans-serif"],
        cairo:   ["IBM Plex Sans Arabic", "Cairo", "sans-serif"],
        poppins: ["IBM Plex Sans", "Poppins", "sans-serif"],
      },
      borderRadius: {
        "sm":  "8px",
        "md":  "12px",
        "lg":  "16px",
        "xl":  "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      boxShadow: {
        "xs":  "0 1px 2px rgba(0,106,96,0.04)",
        "sm":  "0 2px 8px rgba(0,106,96,0.07), 0 1px 2px rgba(0,0,0,0.04)",
        "md":  "0 4px 16px rgba(0,106,96,0.09), 0 2px 4px rgba(0,0,0,0.04)",
        "lg":  "0 8px 32px rgba(0,106,96,0.11), 0 4px 8px rgba(0,0,0,0.06)",
        "xl":  "0 16px 48px rgba(0,106,96,0.13), 0 8px 16px rgba(0,0,0,0.08)",
        "glow":"0 0 24px rgba(0,168,150,0.28)",
        "brand":"0 8px 24px rgba(0,106,96,0.22)",
      },
      transitionTimingFunction: {
        "spring":      "cubic-bezier(0.22, 1, 0.36, 1)",
        "smooth":      "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-in":       "fadeIn 280ms cubic-bezier(0.4,0,0.2,1) forwards",
        "slide-up":      "slideUp 420ms cubic-bezier(0.22,1,0.36,1) forwards",
        "zoom-in":       "zoomIn 150ms cubic-bezier(0.4,0,0.2,1) forwards",
        "sheet-up":      "sheetUp 420ms cubic-bezier(0.22,1,0.36,1) forwards",
        "bounce-subtle": "bounceSubtle 2s infinite",
        "shimmer":       "shimmer 1.4s ease-in-out infinite",
        "card-in":       "cardEntrance 280ms cubic-bezier(0.22,1,0.36,1) forwards",
      },
      keyframes: {
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:      { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        zoomIn:       { "0%": { transform: "scale(0.94)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        sheetUp:      { "0%": { transform: "translateY(100%)", opacity: "0.6" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        bounceSubtle: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        shimmer:      { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        cardEntrance: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    }
  },
  plugins: [],
}

      fontFamily: {
        sans:    ["IBM Plex Sans Arabic", "IBM Plex Sans", "Cairo", "sans-serif"],
        cairo:   ["IBM Plex Sans Arabic", "Cairo", "sans-serif"],
        poppins: ["IBM Plex Sans", "Poppins", "sans-serif"],
      },
      borderRadius: {
        "sm":  "8px",
        "md":  "12px",
        "lg":  "16px",
        "xl":  "20px",
        "2xl": "24px",
        "3xl": "28px",
      },
      boxShadow: {
        "xs":  "0 1px 2px rgba(15,118,110,0.04)",
        "sm":  "0 2px 8px rgba(15,118,110,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "md":  "0 4px 16px rgba(15,118,110,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        "lg":  "0 8px 32px rgba(15,118,110,0.10), 0 4px 8px rgba(0,0,0,0.06)",
        "xl":  "0 16px 48px rgba(15,118,110,0.12), 0 8px 16px rgba(0,0,0,0.08)",
        "glow":"0 0 20px rgba(13,148,136,0.25)",
      },
      transitionTimingFunction: {
        "spring":      "cubic-bezier(0.22, 1, 0.36, 1)",
        "smooth":      "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce-soft": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      animation: {
        "fade-in":       "fadeIn 280ms cubic-bezier(0.4,0,0.2,1) forwards",
        "slide-up":      "slideUp 420ms cubic-bezier(0.22,1,0.36,1) forwards",
        "zoom-in":       "zoomIn 150ms cubic-bezier(0.4,0,0.2,1) forwards",
        "sheet-up":      "sheetUp 420ms cubic-bezier(0.22,1,0.36,1) forwards",
        "bounce-subtle": "bounceSubtle 2s infinite",
        "shimmer":       "shimmer 1.4s ease-in-out infinite",
        "card-in":       "cardEntrance 280ms cubic-bezier(0.22,1,0.36,1) forwards",
      },
      keyframes: {
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:      { "0%": { transform: "translateY(16px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        zoomIn:       { "0%": { transform: "scale(0.94)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        sheetUp:      { "0%": { transform: "translateY(100%)", opacity: "0.6" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        bounceSubtle: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-4px)" } },
        shimmer:      { "0%": { backgroundPosition: "-400px 0" }, "100%": { backgroundPosition: "400px 0" } },
        cardEntrance: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    }
  },
  plugins: [],
}
