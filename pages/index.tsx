import Head from "next/head";
import type { GetStaticProps } from "next";
import dynamic from "next/dynamic";
import Footer from "@/components/layout/Footer";
import About from "@/components/sections/About";
import Books from "@/components/sections/Books";
import Contact from "@/components/sections/Contact";
import Hero from "@/components/sections/Hero";
import { getAboutData } from "@/lib/about";
import { getBooksSortedByDate } from "@/lib/books";
import { getContactData } from "@/lib/contact";
import type { AboutData, Book, ContactData } from "@/types";

// SSR desabilitado — Header usa useRouter (client-only hook)
const Header = dynamic(() => import("@/components/layout/Header"), { ssr: false });
// SSR desabilitado — UltimoLancamento contém Countdown com useEffect/useState
const UltimoLancamento = dynamic(
  () => import("@/components/sections/UltimoLancamento"),
  { ssr: false }
);

interface HomeProps {
  books: Book[];
  about: AboutData;
  contact: ContactData;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: {
    books: getBooksSortedByDate(),
    about: getAboutData(),
    contact: getContactData(),
  },
});

export default function Home({ books, about, contact }: HomeProps) {
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
        <UltimoLancamento book={books[0] ?? null} />
        <Books id="livros" books={books} />
        <About id="sobre" about={about} />
        <Contact id="contato" contact={contact} />
      </main>
      <Footer contact={contact} />
    </>
  );
}
