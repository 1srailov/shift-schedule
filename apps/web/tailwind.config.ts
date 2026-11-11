import type { Config } from "tailwindcss";

/**
 * Design tokens taken 1:1 from the Figma file (Copy as code → CSS, all layers).
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "sans-serif"],
      },
      colors: {
        surface: "#F2F3F7", // page, sidebar, inputs, template cards
        line: "#DEDEE3",
        ink: "#101012",
        muted: "#737378",
        hint: "#93939C",
        stripe: "#F8F8F9",
        dark: { DEFAULT: "#3C3C43", chip: "#595961" },
        // Button states from the "Кнопки" component (Default / Hover / Active / Disable)
        primary: {
          DEFAULT: "#5B7DEC",
          hover: "#1C4AE5",
          active: "#163BB7",
          soft: "#E8EDFC",
          "soft-hover": "#D2DBFA",
          "soft-active": "#BBC9F7",
          text: "#1C4AE5",
        },
        gray: { DEFAULT: "#F2F3F7", hover: "#E7E8EE", active: "#CDCDD6", disabled: "#C1C1C3" },
        sel: { bg: "#EBEFFD", line: "#5B7DEC" },
        cover: { ok: "#EBEFFD", "ok-text": "#1C4AE5", none: "#FBE5E5", "none-text": "#DC2626" },
        tpl: {
          blue: "#E8EDFC",
          "blue-text": "#5B7DEC",
          "blue-line": "#BBC9F7",
          violet: "#E9DEFF",
          "violet-text": "#8040FF",
          "violet-line": "#C8ADFF",
          teal: "#E0F8F7",
          "teal-text": "#00C7BE",
          "teal-line": "#B2EEEB",
        },
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        xl: ["20px", "24px"],
        "2xl": ["32px", "32px"],
      },
      borderRadius: { sm: "4px", DEFAULT: "8px", md: "10px", lg: "12px", xl: "20px" },
      boxShadow: {
        pop: "0 8px 24px rgba(16,16,18,0.12), 0 1px 3px rgba(16,16,18,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
