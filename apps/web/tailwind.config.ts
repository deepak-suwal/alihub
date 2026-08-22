import type { Config } from "tailwindcss";

/**
 * Alihub storefront — "Modernist" design system.
 *
 * Ported from the design's styles.css, which is the source of truth. The
 * system is Swiss/editorial: a warm off-white ground, near-black ink, one
 * vivid accent, Archivo at 800 for every heading, and — the signature —
 * zero border radius anywhere. Structure is carried by rules (2px for major
 * divisions, 1px within a block), never by rounded cards or soft shadows.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ground: "#f3f2f2", // --color-bg
        surface: "#eae9e9", // --color-surface
        ink: "#201e1d", // --color-text
        divider: "rgb(32 30 29 / 0.4)", // --color-divider
        accent: {
          DEFAULT: "#ec3013",
          100: "#fff2ef",
          200: "#ffe0d9",
          300: "#ffc4b8",
          400: "#ff9783",
          500: "#ff563c",
          600: "#dd2b0f",
          700: "#ae1800",
          800: "#7c1405",
          900: "#4d170e",
        },
        accent2: {
          DEFAULT: "#e15b47",
          100: "#fff2ef",
          200: "#ffe0da",
          300: "#ffc4b9",
          400: "#ff9784",
          500: "#ef6853",
          600: "#c94b39",
          700: "#9e3526",
          800: "#71261b",
          900: "#471d16",
        },
        neutral: {
          100: "#f8f4f4",
          200: "#eae7e7",
          300: "#d7d3d3",
          400: "#bab6b6",
          500: "#9b9797",
          600: "#7d7979",
          700: "#605d5d",
          800: "#444141",
          900: "#2d2b2b",
        },
      },
      fontFamily: {
        sans: ["var(--font-archivo)", "system-ui", "sans-serif"],
      },
      // The system is hard-edged: every radius token is 0.
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "9999px", // kept for genuine circles (radio dots, avatars)
      },
      boxShadow: {
        sm: "0 1px 2px rgb(45 43 43 / 0.14)",
        md: "0 3px 10px rgb(45 43 43 / 0.16)",
        lg: "0 12px 32px rgb(45 43 43 / 0.22)",
      },
      maxWidth: {
        content: "1440px",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
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
