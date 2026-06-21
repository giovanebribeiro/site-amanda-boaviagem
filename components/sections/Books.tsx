import BookCard from "@/components/ui/BookCard";
import DataStore from "@/public/data/DataStore";

interface BooksProps {
  id: string;
}

export default function Books({ id }: BooksProps) {
  const { items } = DataStore;

  return (
    <section id={id} className="py-24 px-4 bg-background">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-4">
          Livros
        </h2>
        <p className="font-sans text-center text-foreground/60 mb-16 max-w-xl mx-auto">
          Conheça as obras de Amanda Boaviagem e encontre sua próxima leitura.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {items.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </section>
  );
}
