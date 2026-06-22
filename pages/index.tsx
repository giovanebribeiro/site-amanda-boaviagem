import Head from "next/head";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import About from "@/components/sections/About";
import Books from "@/components/sections/Books";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";

// SSR desabilitado — Header usa useRouter (client-only hook)
const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
// SSR desabilitado — UltimoLancamento contém Countdown com useEffect/useState
const UltimoLancamento = dynamic(
  () => import("@/components/sections/UltimoLancamento"),
  { ssr: false }
);

export default function Home() {
  return (
    <>
      <Head>
        <title>Amanda Boaviagem | Escritora da Esperança</title>
        <meta
          name="description"
          content="Site oficial de Amanda Boaviagem, escritora da esperança."
        />
      </Head>
      <Header />
      <main className="bg-background text-foreground">
        <Hero id="inicio" />
        <UltimoLancamento />
        <Books id="livros" />
        <About id="sobre" />
        <Contact id="contato" />
      </main>
      <Footer />
    </>
  );
}
