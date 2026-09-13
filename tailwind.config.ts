import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        surface: "#F8FAFC",
        border: "#E2E8F0",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          foreground: "#FFFFFF",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        warning: {
          bg: "#FEF3C7",
          text: "#D97706",
          border: "#FDE68A",
        },
      },
      borderRadius: {
        card: "8px",
        input: "6px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
