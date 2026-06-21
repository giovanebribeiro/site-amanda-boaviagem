import Image from "next/image";
import type { Book } from "@/types";

interface BookCardProps {
  book: Book;
}

export default function BookCard({ book }: BookCardProps) {
  const { title, description, image, linkAmazon, linkUiclap } = book;

  return (
    <article className="flex flex-col bg-background rounded-2xl shadow-md overflow-hidden border border-foreground/10 hover:shadow-lg transition-shadow">
      {/* Capa */}
      <div className="relative h-72 w-full bg-foreground/5">
        <Image
          src={image}
          alt={title}
          fill
          className="object-contain p-4"
        />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col flex-1 p-6 gap-4">
        <h3 className="font-serif text-lg font-semibold text-foreground leading-snug">
          {title}
        </h3>
        <p className="font-sans text-sm text-foreground/60 leading-relaxed line-clamp-4 flex-1">
          {description}
        </p>

        {/* Botões de compra */}
        <div className="flex flex-wrap gap-3 pt-2">
          {linkAmazon && (
            <a
              href={linkAmazon}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-sans text-sm font-medium px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Amazon
            </a>
          )}
          {linkUiclap && (
            <a
              href={linkUiclap}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center font-sans text-sm font-medium px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Uiclap
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
