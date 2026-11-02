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
        // ธีมเดียวกับระบบแผน (plan-web/src/index.css) ไล่จากสีโลโก้คณะ: หน้าเว็บทั้งระบบใช้คลาส blue-* / slate-*
        // จึงเปลี่ยนสองชุดนี้ที่นี่ที่เดียว — blue = เขียวอมฟ้าของคณะ, slate = เทาอมเขียว
        blue: {
          50: "#eef8f7",
          100: "#e2f3f1",
          200: "#c3e4e1",
          300: "#95cfca",
          400: "#5fb3ad",
          500: "#2f9e9a",
          600: "#1a8a8c",
          700: "#11787c",
          800: "#0f7176",
          900: "#0e6b70",
          950: "#0a4a4f",
        },
        slate: {
          50: "#f3f8f8",
          100: "#e9f1f1",
          200: "#dfebea",
          300: "#c3d6d5",
          400: "#8fa6a7",
          500: "#6b8486",
          600: "#577073",
          700: "#3d5659",
          800: "#253f44",
          900: "#143036",
          950: "#0b1f23",
        },
        background: "#f3f8f8",
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
          "var(--font-ui)",
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
