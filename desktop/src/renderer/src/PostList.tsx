import type { PostDraft, PostEntry } from "../../common/types";

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : "sem data";
}

interface Props {
  posts: readonly PostEntry[];
  onEdit: (draft: PostDraft) => void;
  onCreate: () => void;
}

export function PostList({ posts, onEdit, onCreate }: Props) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onCreate}
        className="rounded border border-indigo-600 px-3 py-1 text-indigo-700"
      >
        Novo post
      </button>
      {posts.length === 0 && (
        <p className="text-gray-600">Nenhum post encontrado.</p>
      )}
      <ul className="space-y-3">
        {posts.map((entry) =>
          entry.status === "valid" ? (
            <li key={entry.slug} className="rounded border border-gray-300 p-4">
              <h3 className="text-lg font-semibold">{entry.post.title}</h3>
              <p className="text-sm text-gray-600">
                {formatDate(entry.post.date)}
                {entry.post.inPreparation &&
                  " · Em preparação (não aparece no site)"}
              </p>
              <button
                type="button"
                aria-label={`Editar post ${entry.post.title}`}
                onClick={() => onEdit(entry.post)}
              >
                Editar
              </button>
            </li>
          ) : (
            <li
              key={entry.slug}
              className="rounded border border-red-400 bg-red-50 p-4"
            >
              <h3 className="text-lg font-semibold">{entry.slug}</h3>
              <p className="text-sm text-red-700">
                Este post tem um problema e não pode ser editado aqui:{" "}
                {entry.error}
              </p>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
