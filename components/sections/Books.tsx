import BookCover from "@/components/ui/BookCover";
import { getBooksSortedByDate } from "@/lib/books";

interface BooksProps {
  id: string;
}

export default function Books({ id }: BooksProps) {
  const books = getBooksSortedByDate();

  return (
    <section id={id} className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
          Livros
        </h2>
        <p className="font-sans text-center text-foreground/60 mb-16 max-w-xl mx-auto">
          Clique na capa para conhecer cada obra de Amanda Boaviagem.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <BookCover key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
}
