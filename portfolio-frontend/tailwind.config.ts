import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#edf8ff",
          100: "#d7efff",
          200: "#b3e0ff",
          500: "#1d8cf8",
          600: "#116ed7",
          700: "#0e57ab",
          900: "#11253d",
        },
        ink: "#102033",
        sand: "#fbf4e8",
        mist: "#f4f8fc",
        night: "#0f1724",
        glow: "#fff5dd",
      },
      boxShadow: {
        soft: "0 20px 40px rgba(15, 23, 36, 0.09)",
        float: "0 28px 60px rgba(17, 37, 61, 0.16)",
      },
      borderRadius: {
        card: "1.75rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
