import type { BookDraft, BookEntry } from "../../common/types";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function draftOf(entry: BookEntry): BookDraft | null {
  if (entry.status === "valid") return entry.book;
  return entry.draft ?? null;
}

interface Props {
  books: readonly BookEntry[];
  onEdit: (draft: BookDraft) => void;
  onCreate: () => void;
}

export function BookList({ books, onEdit, onCreate }: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCreate}
        className="rounded border border-indigo-600 px-3 py-1 text-indigo-700"
      >
        Novo livro
      </button>
      {books.length === 0 && (
        <p className="text-gray-600">Nenhum livro encontrado.</p>
      )}
      <ul className="space-y-3">
        {books.map((entry) => {
          const draft = draftOf(entry);
          const title =
            entry.status === "valid" ? entry.book.title : entry.slug;
          return entry.status === "valid" ? (
            <li key={entry.slug} className="rounded border border-gray-300 p-4">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-gray-600">
                Lançamento: {formatDate(entry.book.releaseDate)}
              </p>
              {draft && (
                <button
                  type="button"
                  onClick={() => onEdit(draft)}
                  aria-label={`Editar ${title}`}
                >
                  Editar
                </button>
              )}
            </li>
          ) : (
            <li
              key={entry.slug}
              className="rounded border border-red-400 bg-red-50 p-4"
            >
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-red-700">
                Este livro tem um problema e não pode ser publicado:{" "}
                {entry.error}
              </p>
              {draft && (
                <button
                  type="button"
                  onClick={() => onEdit(draft)}
                  aria-label={`Editar ${title}`}
                >
                  Editar
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
