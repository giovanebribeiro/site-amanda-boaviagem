import Head from "next/head";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";

// SSR desabilitado — Header usa useRouter (client-only hook)
const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });

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
      <main className="min-h-screen bg-background text-foreground pt-16">
        {/* Seções serão adicionadas na Phase 2 */}
      </main>
      <Footer />
    </>
  );
}
