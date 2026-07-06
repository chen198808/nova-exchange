/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
    extend: {
      colors: {
        background: {
          DEFAULT: "#0B0E14",
          lighter: "#111827",
          card: "#161B22",
          hover: "#1C232C",
        },
        border: {
          DEFAULT: "#21262D",
          light: "#30363D",
        },
        primary: {
          DEFAULT: "#3B82F6",
          hover: "#2563EB",
          light: "#60A5FA",
          dark: "#1D4ED8",
        },
        success: {
          DEFAULT: "#10B981",
          hover: "#059669",
          light: "#34D399",
        },
        danger: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          light: "#F87171",
        },
        warning: {
          DEFAULT: "#F59E0B",
          hover: "#D97706",
          light: "#FBBF24",
        },
        text: {
          primary: "#F0F6FC",
          secondary: "#8B949E",
          tertiary: "#6E7681",
          muted: "#484F58",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "monospace"],
      },
      animation: {
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "glow-green": "glowGreen 2s ease-in-out infinite",
        "glow-red": "glowRed 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glowGreen: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(16, 185, 129, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(16, 185, 129, 0.6)" },
        },
        glowRed: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(239, 68, 68, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(239, 68, 68, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};
