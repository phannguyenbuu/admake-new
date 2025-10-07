// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./**/*.{js,ts,jsx,tsx,mdx}", // quét toàn bộ file src
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#E6FAFA",
          100: "#CCF5F5",
          200: "#99EBEB",
          300: "#66E0E0",
          400: "#33D6D6",
          500: "#00B4B6", // màu chính
          600: "#00999A",
          700: "#007F80",
          800: "#006566",
          900: "#004C4C",
        },
      },
    },
  },
} satisfies Config;
