import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#E0F0F0",
        foreground: "#1a1a2e",
        navy: "#003070",
        cta: "#207000",
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a2e",
        },
        primary: {
          DEFAULT: "#003070",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#E0F0F0",
          foreground: "#003070",
        },
        accent: {
          DEFAULT: "#207000",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f0f4f4",
          foreground: "#6b7280",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
        border: "#d1d5db",
        input: "#d1d5db",
        ring: "#003070",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
