import type { Config } from "tailwindcss";

/**
 * Alihub storefront design system.
 *
 * Two families drive everything: a warm terracotta `brand` (the buying
 * action — CTAs, prices, focus) and a cool `ink` neutral (text, surfaces,
 * borders). Tokens are exposed as CSS variables in globals.css so the same
 * scale can theme future dark mode without touching component classes.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf4f1",
          100: "#fae6de",
          200: "#f3c8b7",
          300: "#eaa387",
          400: "#df7854",
          500: "#c85a34",
          600: "#b5502b", // legacy accent — the anchor of the scale
          700: "#963f22",
          800: "#79341f",
          900: "#642e1e",
        },
        ink: {
          50: "#f7f9fb",
          100: "#eef2f5",
          200: "#d8e0e8",
          300: "#b6c3d1",
          400: "#8598ac",
          500: "#5f7289",
          600: "#52698a",
          700: "#3b4d67",
          800: "#26344a",
          900: "#14243a", // legacy ink
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 36, 58, 0.04), 0 1px 3px rgba(20, 36, 58, 0.06)",
        "card-hover": "0 6px 16px -4px rgba(20, 36, 58, 0.12), 0 2px 6px rgba(20, 36, 58, 0.06)",
        pop: "0 12px 32px -8px rgba(20, 36, 58, 0.18)",
      },
      maxWidth: {
        content: "1180px",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s infinite",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
