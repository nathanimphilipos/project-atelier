import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#f4f7f7",
        foreground: "#1a1a2e",
        navy: "#003070",
        cta: "#1a7a00",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a2e",
        },
        primary: {
          DEFAULT: "#003070",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#eef3f3",
          foreground: "#003070",
        },
        accent: {
          DEFAULT: "#1a7a00",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f0f3f3",
          foreground: "#64748b",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        border: "#e2e8f0",
        input: "#e2e8f0",
        ring: "#003070",
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.875rem",
        md: "0.625rem",
        sm: "0.375rem",
      },
      boxShadow: {
        "card": "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)",
        "elevated": "0 8px 24px -4px rgb(0 0 0 / 0.08), 0 2px 8px -2px rgb(0 0 0 / 0.04)",
      },
      fontSize: {
        "page-title": ["1.625rem", { lineHeight: "2rem", fontWeight: "700", letterSpacing: "-0.02em" }],
        "section-title": ["1rem", { lineHeight: "1.5rem", fontWeight: "600", letterSpacing: "-0.01em" }],
        "stat": ["1.875rem", { lineHeight: "2.25rem", fontWeight: "700", letterSpacing: "-0.02em" }],
      },
      keyframes: {
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
      },
      animation: {
        "skeleton": "skeleton-pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
