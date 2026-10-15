import { useState } from "react";
import type { OpenRepositoryResult } from "../../common/types";
import { BookList } from "./BookList";

export function App() {
  const [result, setResult] = useState<OpenRepositoryResult | null>(null);

  const handleOpen = async (): Promise<void> => {
    try {
      const opened = await window.api.openRepository();
      if (opened !== null) setResult(opened);
    } catch (error) {
      console.error("openRepository failed", error);
      setResult({
        ok: false,
        error: "Algo deu errado ao abrir a pasta. Tente de novo.",
      });
    }
  };

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
      {result?.ok === true && (
        <section aria-label="Livros">
          <h2 className="mb-3 text-xl font-semibold">Livros</h2>
          <BookList books={result.books} />
        </section>
      )}
    </main>
  );
}
