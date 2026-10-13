import { heroui } from "@heroui/theme/plugin";

export default heroui({
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
});
