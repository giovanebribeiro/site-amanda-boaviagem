import type { BookEntry } from "../../common/types";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function BookList({ books }: { books: readonly BookEntry[] }) {
  if (books.length === 0) {
    return <p className="text-gray-600">Nenhum livro encontrado.</p>;
  }
  return (
    <ul className="space-y-3">
      {books.map((entry) =>
        entry.status === "valid" ? (
          <li key={entry.slug} className="rounded border border-gray-300 p-4">
            <h3 className="text-lg font-semibold">{entry.book.title}</h3>
            <p className="text-sm text-gray-600">
              Lançamento: {formatDate(entry.book.releaseDate)}
            </p>
          </li>
        ) : (
          <li
            key={entry.slug}
            className="rounded border border-red-400 bg-red-50 p-4"
          >
            <h3 className="text-lg font-semibold">{entry.slug}</h3>
            <p className="text-sm text-red-700">
              Este livro tem um problema e não pode ser publicado: {entry.error}
            </p>
          </li>
        ),
      )}
    </ul>
  );
}
