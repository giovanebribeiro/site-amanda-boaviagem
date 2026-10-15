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
import { getSiteData } from "@/lib/site";
import type { AboutData, Book, ContactData, SiteData } from "@/types";

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
  site: SiteData;
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => ({
  props: {
    books: getBooksSortedByDate(),
    about: getAboutData(),
    contact: getContactData(),
    site: getSiteData(),
  },
});

export default function Home({ books, about, contact, site }: HomeProps) {
  return (
    <>
      <Head>
        <title>{`Amanda Boaviagem | ${site.slogan}`}</title>
        <meta
          name="description"
          content={`Site oficial de Amanda Boaviagem, ${site.slogan.toLowerCase()}.`}
        />
      </Head>
      <Header slogan={site.slogan} />
      <main className="bg-background text-foreground">
        <Hero id="inicio" site={site} />
        <UltimoLancamento book={books[0] ?? null} site={site} />
        <Books id="livros" books={books} site={site} />
        <About id="sobre" about={about} site={site} />
        <Contact id="contato" contact={contact} site={site} />
      </main>
      <Footer contact={contact} slogan={site.slogan} />
    </>
  );
}
