import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ReviewCard from "@/components/ui/ReviewCard";
import Countdown from "@/components/ui/Countdown";
import { getBooksSortedByDate, getBookBySlug } from "@/lib/books";
import type { Book } from "@/types";

interface BookPageProps {
  book: Book;
}

export default function BookPage({
  book,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{book.title} | Amanda Boaviagem</title>
        <meta name="description" content={book.slogan} />
      </Head>

      <Header />

      <main className="min-h-screen bg-background text-foreground pt-16">
        <article className="max-w-5xl mx-auto px-4 py-20">
          {/* Cabeçalho: capa + título + slogan */}
          <div className="flex flex-col md:flex-row gap-12 mb-16">
            {/* Capa */}
            <div className="flex-shrink-0 flex justify-center">
              <div className="relative w-56 h-80 md:w-64 md:h-96 rounded-xl overflow-hidden shadow-2xl">
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-contain bg-foreground/5 p-3"
                  priority
                />
              </div>
            </div>

            {/* Metadados */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {book.title}
              </h1>

              <p className="font-sans text-lg text-primary font-medium italic">
                {book.slogan}
              </p>

              <Countdown
                releaseDate={book.releaseDate}
                linkAmazon={book.linkAmazon}
                linkUiclap={book.linkUiclap}
              />
            </div>
          </div>

          {/* Sinopse */}
          <section className="mb-16">
            <h2 className="font-serif text-2xl font-bold text-foreground mb-6">
              Sinopse
            </h2>
            <p className="font-sans text-foreground/70 leading-relaxed text-base">
              {book.description}
            </p>
          </section>

          {/* Reviews */}
          {book.reviews.length > 0 && (
            <section className="mb-16">
              <h2 className="font-serif text-2xl font-bold text-foreground mb-8">
                O que os leitores dizem
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {book.reviews.map((review, index) => (
                  <ReviewCard key={index} review={review} />
                ))}
              </div>
            </section>
          )}

          {/* Navegação */}
          <div className="pt-8 border-t border-foreground/10">
            <Link
              href="/#livros"
              className="font-sans text-sm text-primary hover:underline"
            >
              &larr; Ver todos os livros
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const books = getBooksSortedByDate();
  const paths = books.map((book) => ({ params: { slug: book.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const book = getBookBySlug(slug);

  if (!book) {
    return { notFound: true };
  }

  return { props: { book } };
};
