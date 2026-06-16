import type { AppProps } from "next/app";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light">
      <HeroUIProvider>
        <Component {...pageProps} />
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
