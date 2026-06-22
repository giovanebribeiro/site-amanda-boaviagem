import Image from "next/image";
import Link from "next/link";
import Countdown from "@/components/ui/Countdown";
import { getLatestBook } from "@/lib/books";

export default function UltimoLancamento() {
  const book = getLatestBook();

  if (!book) return null;

  return (
    <section className="py-20 px-4 bg-foreground/[0.03] border-b border-foreground/10">
      <div className="max-w-6xl mx-auto">
        <p className="font-sans text-xs uppercase tracking-widest text-primary text-center mb-12">
          Último Lançamento
        </p>

        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Capa */}
          <div className="flex-shrink-0">
            <Link href={`/livros/${book.slug}`}>
              <div className="relative w-56 h-80 md:w-64 md:h-96 rounded-xl overflow-hidden shadow-2xl hover:shadow-primary/20 transition-shadow">
                <Image
                  src={book.image}
                  alt={book.title}
                  fill
                  className="object-contain bg-foreground/5 p-3"
                  priority
                />
              </div>
            </Link>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground leading-tight">
              {book.title}
            </h2>

            <p className="font-sans text-lg text-primary font-medium italic">
              {book.slogan}
            </p>

            <p className="font-sans text-foreground/70 leading-relaxed line-clamp-4">
              {book.description}
            </p>

            <div className="flex justify-center md:justify-start">
              <Countdown
                releaseDate={book.releaseDate}
                linkAmazon={book.linkAmazon}
                linkUiclap={book.linkUiclap}
              />
            </div>

            <Link
              href={`/livros/${book.slug}`}
              className="inline-block font-sans text-sm text-primary hover:underline"
            >
              Saber mais &rarr;
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
