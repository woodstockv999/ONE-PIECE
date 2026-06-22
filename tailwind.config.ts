import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 麦わら帽子を想起させる落ち着いた赤系アクセント
        straw: {
          50: "#fdf3f2",
          100: "#fbe3e1",
          200: "#f6c8c4",
          300: "#eea29b",
          400: "#e2706a",
          500: "#d24b44",
          600: "#bd352f",
          700: "#9e2925",
          800: "#832623",
          900: "#6e2522",
        },
      },
    },
  },
  plugins: [],
};

export default config;
