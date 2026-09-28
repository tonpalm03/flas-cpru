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
        background: "#F8FAFC",
        surface: "#FFFFFF",
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
          DEFAULT: "#1E40AF", // Clean 5% University Blue
        },
        faculty: {
          accent: "#2563EB",
          dark: "#0F172A",
          muted: "#64748B",
          border: "#E2E8F0",
          card: "#FFFFFF",
        }
      },
      fontFamily: {
        sans: [
          "var(--font-prompt)",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        sarabun: ["var(--font-sarabun)", "sans-serif"],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'float': '0 10px 25px -5px rgba(30, 64, 175, 0.08), 0 8px 10px -6px rgba(30, 64, 175, 0.04)',
      }
    },
  },
  plugins: [],
};
export default config;
