import { useState } from "react";
import { findMissing } from "../../common/book-draft";
import type { BookDraft } from "../../common/types";

export type SaveOutcome =
  | { ok: true; slug: string; versionCreated: boolean }
  | { ok: false; error: string };

interface Props {
  initial: BookDraft;
  covers: readonly string[];
  onSave: (draft: BookDraft) => Promise<SaveOutcome>;
  onClose: () => void;
}

const FIELD = "mt-1 w-full rounded border border-gray-300 p-2";

function replaceAt<T>(items: readonly T[], index: number, next: T): T[] {
  return items.map((item, i) => (i === index ? next : item));
}

function removeAt<T>(items: readonly T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

export function BookForm({ initial, covers, onSave, onClose }: Props) {
  const [draft, setDraft] = useState<BookDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const missing = findMissing(draft);
  const coverOptions =
    covers.includes(draft.image) || !draft.image
      ? covers
      : [draft.image, ...covers];

  const update = (changes: Partial<BookDraft>): void =>
    setDraft((current) => ({ ...current, ...changes }));

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setNotice(null);
    const outcome = await onSave(draft);
    setSaving(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    update({ slug: outcome.slug });
    setNotice(
      outcome.versionCreated
        ? "Versão salva neste computador. O site ainda não foi atualizado."
        : "Nada mudou desde a última versão salva.",
    );
  };

  return (
    <section aria-label="Editar livro" className="space-y-4">
      <h2 className="text-xl font-semibold">
        {draft.slug ? "Editar livro" : "Novo livro"}
      </h2>

      <label className="block">
        Título
        <input
          className={FIELD}
          value={draft.title}
          onChange={(event) => update({ title: event.target.value })}
        />
      </label>
      <label className="block">
        Data de lançamento
        <input
          type="date"
          className={FIELD}
          value={draft.releaseDate}
          onChange={(event) => update({ releaseDate: event.target.value })}
        />
      </label>
      <label className="block">
        Capa
        <select
          className={FIELD}
          value={draft.image}
          onChange={(event) => update({ image: event.target.value })}
        >
          <option value="">Escolha uma capa</option>
          {coverOptions.map((cover) => (
            <option key={cover} value={cover}>
              {cover}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        Slogan
        <input
          className={FIELD}
          value={draft.slogan}
          onChange={(event) => update({ slogan: event.target.value })}
        />
      </label>
      <label className="block">
        Sinopse
        <textarea
          rows={8}
          className={FIELD}
          value={draft.synopsis}
          onChange={(event) => update({ synopsis: event.target.value })}
        />
      </label>

      <fieldset className="space-y-2">
        <legend className="font-semibold">Links de compra</legend>
        {draft.links.map((link, index) => (
          <div key={index} className="flex flex-wrap items-end gap-2">
            <label>
              <span className="sr-only">Rótulo do link {index + 1}</span>
              <input
                aria-label={`Rótulo do link ${index + 1}`}
                placeholder="Rótulo (ex.: Amazon)"
                className={FIELD}
                value={link.label}
                onChange={(event) =>
                  update({
                    links: replaceAt(draft.links, index, {
                      ...link,
                      label: event.target.value,
                    }),
                  })
                }
              />
            </label>
            <input
              aria-label={`Endereço do link ${index + 1}`}
              placeholder="https://"
              className={FIELD}
              value={link.url}
              onChange={(event) =>
                update({
                  links: replaceAt(draft.links, index, {
                    ...link,
                    url: event.target.value,
                  }),
                })
              }
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={link.primary === true}
                onChange={(event) =>
                  update({
                    links: replaceAt(draft.links, index, {
                      ...link,
                      primary: event.target.checked,
                    }),
                  })
                }
              />
              Principal
            </label>
            <button
              type="button"
              aria-label={`Remover link de compra ${index + 1}`}
              onClick={() => update({ links: removeAt(draft.links, index) })}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            update({ links: [...draft.links, { label: "", url: "" }] })
          }
        >
          Adicionar link de compra
        </button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="font-semibold">Resenhas</legend>
        {draft.reviews.map((review, index) => (
          <div key={index} className="space-y-1">
            <input
              aria-label={`Autor da resenha ${index + 1}`}
              placeholder="Autor"
              className={FIELD}
              value={review.author}
              onChange={(event) =>
                update({
                  reviews: replaceAt(draft.reviews, index, {
                    ...review,
                    author: event.target.value,
                  }),
                })
              }
            />
            <textarea
              aria-label={`Texto da resenha ${index + 1}`}
              placeholder="Texto"
              className={FIELD}
              value={review.text}
              onChange={(event) =>
                update({
                  reviews: replaceAt(draft.reviews, index, {
                    ...review,
                    text: event.target.value,
                  }),
                })
              }
            />
            <button
              type="button"
              aria-label={`Remover resenha ${index + 1}`}
              onClick={() =>
                update({ reviews: removeAt(draft.reviews, index) })
              }
            >
              Remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            update({ reviews: [...draft.reviews, { author: "", text: "" }] })
          }
        >
          Adicionar resenha
        </button>
      </fieldset>

      {missing.length > 0 && (
        <div className="rounded border border-amber-400 bg-amber-50 p-3">
          <p>Você pode salvar assim, mas ainda falta para publicar:</p>
          <ul aria-label="O que falta" className="list-disc pl-5">
            {missing.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded bg-indigo-600 px-4 py-2 text-white"
        >
          Salvar
        </button>
        <button type="button" onClick={onClose}>
          Voltar à lista
        </button>
      </div>
    </section>
  );
}
