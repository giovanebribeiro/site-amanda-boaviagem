import { useEffect, useState } from "react";
import { emptyDraft } from "../../common/book-draft";
import type {
  BookDraft,
  BookEntry,
  Identity,
  OpenRepositoryResult,
} from "../../common/types";
import { BookForm, type SaveOutcome } from "./BookForm";
import { BookList } from "./BookList";
import { IdentityForm } from "./IdentityForm";

type Screen = { name: "list" } | { name: "form"; draft: BookDraft };

const OPEN_FAILED = "Algo deu errado ao abrir a pasta. Tente de novo.";
const SAVE_FAILED = "Algo deu errado ao salvar. Tente de novo.";
const IDENTITY_FAILED = "Algo deu errado ao guardar seus dados. Tente de novo.";

export function App() {
  const [identity, setIdentity] = useState<Identity | null | undefined>(
    undefined,
  );
  const [result, setResult] = useState<OpenRepositoryResult | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [covers, setCovers] = useState<readonly string[]>([]);

  useEffect(() => {
    window.api
      .getIdentity()
      .then(setIdentity)
      .catch((error: unknown) => {
        console.error("getIdentity failed", error);
        setIdentity(null);
      });
  }, []);

  const handleIdentity = async (input: Identity): Promise<string | null> => {
    try {
      const saved = await window.api.setIdentity(input);
      if (!saved.ok) return saved.error;
      setIdentity(saved.identity);
      return null;
    } catch (error) {
      console.error("setIdentity failed", error);
      return IDENTITY_FAILED;
    }
  };

  const handleOpen = async (): Promise<void> => {
    try {
      const opened = await window.api.openRepository();
      if (opened === null) return;
      setResult(opened);
      setScreen({ name: "list" });
      if (opened.ok) {
        setCovers(await window.api.listCovers().catch(() => []));
      }
    } catch (error) {
      console.error("openRepository failed", error);
      setResult({ ok: false, error: OPEN_FAILED });
    }
  };

  const handleSave = async (draft: BookDraft): Promise<SaveOutcome> => {
    try {
      const saved = await window.api.saveBook(draft);
      if (!saved.ok) return saved;
      setResult({ ok: true, books: saved.books });
      return saved;
    } catch (error) {
      console.error("saveBook failed", error);
      return { ok: false, error: SAVE_FAILED };
    }
  };

  if (identity === undefined) return null;
  if (identity === null) return <IdentityForm onSubmit={handleIdentity} />;

  const books: readonly BookEntry[] = result?.ok ? result.books : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Gestão do site</h1>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded bg-indigo-600 px-4 py-2 text-white"
      >
        Abrir pasta do site
      </button>
      {result?.ok === false && (
        <p role="alert" className="text-red-700">
          {result.error}
        </p>
      )}
      {result?.ok === true && screen.name === "list" && (
        <section aria-label="Livros">
          <h2 className="mb-3 text-xl font-semibold">Livros</h2>
          <BookList
            books={books}
            onEdit={(draft) => setScreen({ name: "form", draft })}
            onCreate={() => setScreen({ name: "form", draft: emptyDraft() })}
          />
        </section>
      )}
      {result?.ok === true && screen.name === "form" && (
        <BookForm
          initial={screen.draft}
          covers={covers}
          onSave={handleSave}
          onClose={() => setScreen({ name: "list" })}
        />
      )}
    </main>
  );
}
