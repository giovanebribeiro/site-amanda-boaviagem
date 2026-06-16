import type { Config } from "tailwindcss";
import { heroui } from "@heroui/theme/plugin";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  plugins: [
    require("@tailwindcss/typography"),
    heroui({
      themes: {
        light: {
          colors: {
            background: "#FAFAF7",
            foreground: "#1A1A2E",
            primary: { DEFAULT: "#2D638E", foreground: "#FAFAF7" },
            secondary: { DEFAULT: "#CC5378", foreground: "#FAFAF7" },
          },
        },
        dark: {
          colors: {
            background: "#0F1923",
            foreground: "#E8EEF2",
            primary: { DEFAULT: "#5B9EC9", foreground: "#0F1923" },
            secondary: { DEFAULT: "#E07A9B", foreground: "#0F1923" },
          },
        },
      },
    }),
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Lato", '"Open Sans"', "sans-serif"],
      },
    },
  },
};

export default config;
