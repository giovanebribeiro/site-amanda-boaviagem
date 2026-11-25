import { useRef, useState } from "react";
import { applyFormat, type FormatKind } from "../../common/markdown-format";
import { findMissingPost } from "../../common/post-draft";
import type {
  ImportPostImageResult,
  PostDraft,
  PostImageInput,
} from "../../common/types";

export type PostSaveResult =
  | { ok: true; slug: string; versionCreated: boolean }
  | { ok: false; error: string };

interface Props {
  initial: PostDraft;
  onSave: (draft: PostDraft) => Promise<PostSaveResult>;
  onImportImage: (
    input: PostImageInput,
  ) => Promise<ImportPostImageResult | null>;
  onClose: () => void;
}

const IMPORT_IMAGE_FAILED =
  "Algo deu errado ao inserir a imagem. Tente de novo.";
const FIELD = "mt-1 w-full rounded border border-gray-300 p-2";

const TOOLBAR: readonly { kind: FormatKind; label: string }[] = [
  { kind: "bold", label: "Negrito" },
  { kind: "italic", label: "Itálico" },
  { kind: "heading", label: "Título de seção" },
  { kind: "list", label: "Lista" },
  { kind: "quote", label: "Citação" },
  { kind: "link", label: "Link" },
];

export function PostForm({ initial, onSave, onImportImage, onClose }: Props) {
  const [draft, setDraft] = useState<PostDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [imageAlt, setImageAlt] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageWarning, setImageWarning] = useState<string | null>(null);

  const missing = findMissingPost(draft);
  const update = (changes: Partial<PostDraft>): void =>
    setDraft((current) => ({ ...current, ...changes }));

  const format = (kind: FormatKind): void => {
    const area = bodyRef.current;
    if (area === null) return;
    const result = applyFormat(
      draft.body,
      area.selectionStart,
      area.selectionEnd,
      kind,
    );
    update({ body: result.text });
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const insertAt = (markdown: string, at: number, end: number): void => {
    const inserted = `\n\n${markdown}\n\n`;
    // Functional update: the author may have kept typing while the picker was open.
    setDraft((current) => ({
      ...current,
      body: current.body.slice(0, at) + inserted + current.body.slice(end),
    }));
    requestAnimationFrame(() => {
      bodyRef.current?.focus();
      bodyRef.current?.setSelectionRange(
        at + inserted.length,
        at + inserted.length,
      );
    });
  };

  const handleChooseImage = async (): Promise<void> => {
    if (imageAlt === null) return;
    if (!imageAlt.trim()) {
      setImageError(
        "Descreva a imagem no campo Texto alternativo antes de escolher o arquivo.",
      );
      return;
    }
    setImageError(null);
    setImageWarning(null);
    const at = bodyRef.current?.selectionStart ?? draft.body.length;
    const end = bodyRef.current?.selectionEnd ?? at;
    let result: ImportPostImageResult | null;
    try {
      result = await onImportImage({
        slug: draft.slug,
        title: draft.title,
        alt: imageAlt,
      });
    } catch (failure) {
      console.error("importPostImage failed", failure);
      result = { ok: false, error: IMPORT_IMAGE_FAILED };
    }
    if (result === null) return;
    if (!result.ok) {
      setImageError(result.error);
      return;
    }
    insertAt(result.markdown, at, end);
    setImageWarning(result.warning ?? null);
    setImageAlt(null);
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    setNotice(null);
    let outcome: PostSaveResult;
    try {
      outcome = await onSave(draft);
    } catch (failure) {
      console.error("savePost failed", failure);
      outcome = {
        ok: false,
        error: "Algo deu errado ao salvar o post. Tente de novo.",
      };
    } finally {
      setSaving(false);
    }
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
    <section aria-label="Editar post" className="space-y-4">
      <h2 className="text-xl font-semibold">
        {draft.slug ? "Editar post" : "Novo post"}
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
        Data
        <input
          type="date"
          className={FIELD}
          value={draft.date}
          onChange={(event) => update({ date: event.target.value })}
        />
      </label>
      <label className="block">
        Resumo
        <textarea
          rows={3}
          className={FIELD}
          value={draft.excerpt}
          onChange={(event) => update({ excerpt: event.target.value })}
        />
      </label>

      <div
        role="toolbar"
        aria-label="Formatação"
        className="flex flex-wrap gap-2"
      >
        {TOOLBAR.map(({ kind, label }) => (
          <button
            key={kind}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => format(kind)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            setImageAlt((current) => (current === null ? "" : null))
          }
        >
          Inserir imagem
        </button>
      </div>
      {imageAlt !== null && (
        <div className="space-y-2 rounded border border-gray-300 p-3">
          <label className="block">
            Texto alternativo
            <input
              className={FIELD}
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
            />
          </label>
          <p className="text-sm text-gray-600">
            Descreva o que aparece na imagem. É obrigatório.
          </p>
          {imageError && (
            <p role="alert" className="text-red-700">
              {imageError}
            </p>
          )}
          <button type="button" onClick={handleChooseImage}>
            Escolher imagem
          </button>
        </div>
      )}
      {imageWarning && <p className="text-amber-700">{imageWarning}</p>}
      <label className="block">
        Texto
        <textarea
          ref={bodyRef}
          rows={16}
          className={`${FIELD} font-mono`}
          value={draft.body}
          onChange={(event) => update({ body: event.target.value })}
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={draft.inPreparation}
          onChange={(event) => update({ inPreparation: event.target.checked })}
        />
        Em preparação (não aparece no site)
      </label>

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
