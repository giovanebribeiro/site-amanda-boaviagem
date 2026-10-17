import { useEffect, useState } from "react";
import type { SingleFileKind } from "@shared/content-schema";
import {
  SINGLE_FILE_KINDS,
  SINGLE_FILE_TITLES,
} from "../../common/single-file";
import { emptyDraft } from "../../common/book-draft";
import { emptyPostDraft } from "../../common/post-draft";
import type {
  BookDraft,
  BookEntry,
  Identity,
  CoverTarget,
  ImportCoverResult,
  ImportPostImageResult,
  PostImageInput,
  OpenRepositoryResult,
  PostDraft,
  PostEntry,
  SiteUpdate,
} from "../../common/types";
import { BookForm, type SaveOutcome } from "./BookForm";
import { BookList } from "./BookList";
import { PostForm, type PostSaveResult } from "./PostForm";
import { PostList } from "./PostList";
import { HistoryScreen } from "./HistoryScreen";
import { IdentityForm } from "./IdentityForm";
import { SignInPanel } from "./SignInPanel";
import { SingleFileForm } from "./SingleFileForm";

type Screen =
  | { name: "list" }
  | { name: "form"; draft: BookDraft }
  | { name: "post"; draft: PostDraft }
  | { name: "single"; kind: SingleFileKind }
  | { name: "history" };

const OPEN_FAILED = "Algo deu errado ao abrir a pasta. Tente de novo.";
const IMPORT_COVER_FAILED =
  "Algo deu errado ao importar a capa. Tente de novo.";
const IMPORT_POST_IMAGE_FAILED =
  "Algo deu errado ao inserir a imagem. Tente de novo.";
const SAVE_FAILED = "Algo deu errado ao salvar. Tente de novo.";
const SAVE_POST_FAILED = "Algo deu errado ao salvar o post. Tente de novo.";
const SITE_OPEN_FAILED = "Algo deu errado ao baixar o site. Tente de novo.";
const SIGN_IN_FAILED = "Algo deu errado ao entrar no GitHub. Tente de novo.";
const IDENTITY_FAILED = "Algo deu errado ao guardar seus dados. Tente de novo.";

const UPDATE_NOTICES: Partial<Record<SiteUpdate, string>> = {
  offline:
    "Sem internet: mostrando a cópia do site que está neste computador. Você pode continuar editando e salvando.",
  "kept-draft":
    "Você tem um Rascunho em andamento, então o site não foi atualizado agora.",
  diverged:
    "O site no ar mudou desde a sua última Publicação. Isso será resolvido quando você publicar.",
};

type SiteState =
  | { name: "checking" }
  | { name: "sign-in"; notice: string | null }
  | { name: "opening" }
  | { name: "failed"; error: string }
  | { name: "ready"; notice: string | null };

export function App() {
  const [identity, setIdentity] = useState<Identity | null | undefined>(
    undefined,
  );
  const [result, setResult] = useState<OpenRepositoryResult | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "list" });
  const [posts, setPosts] = useState<readonly PostEntry[]>([]);
  const [covers, setCovers] = useState<readonly string[]>([]);
  const [site, setSite] = useState<SiteState>({ name: "checking" });

  const openSite = async (): Promise<void> => {
    setSite({ name: "opening" });
    try {
      const opened = await window.api.openSite();
      if (!opened.ok) {
        setSite(
          opened.needsSignIn
            ? { name: "sign-in", notice: opened.error }
            : { name: "failed", error: opened.error },
        );
        return;
      }
      setResult({ ok: true, books: opened.books });
      setScreen({ name: "list" });
      setCovers(await window.api.listCovers().catch(() => []));
      const listed = await window.api.listPosts().catch(() => null);
      setPosts(listed?.ok ? listed.posts : []);
      setSite({ name: "ready", notice: UPDATE_NOTICES[opened.update] ?? null });
    } catch (error) {
      console.error("openSite failed", error);
      setSite({ name: "failed", error: SITE_OPEN_FAILED });
    }
  };

  const handleSignIn = async (): Promise<string | null> => {
    try {
      const signedIn = await window.api.signIn();
      if (!signedIn.ok) return signedIn.error;
      void openSite();
      return null;
    } catch (error) {
      console.error("signIn failed", error);
      return SIGN_IN_FAILED;
    }
  };

  useEffect(() => {
    window.api
      .siteStatus()
      .then((status) => {
        if (status.signedIn) void openSite();
        else setSite({ name: "sign-in", notice: null });
      })
      .catch((error: unknown) => {
        console.error("siteStatus failed", error);
        setSite({ name: "sign-in", notice: null });
      });
    // Runs once on start-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const listed = await window.api.listPosts().catch(() => null);
        setPosts(listed?.ok ? listed.posts : []);
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

  const handleSavePost = async (draft: PostDraft): Promise<PostSaveResult> => {
    try {
      const saved = await window.api.savePost(draft);
      if (!saved.ok) return saved;
      setPosts(saved.posts);
      return saved;
    } catch (error) {
      console.error("savePost failed", error);
      return { ok: false, error: SAVE_POST_FAILED };
    }
  };

  const handleImportCover = async (
    target: CoverTarget,
  ): Promise<ImportCoverResult | null> => {
    try {
      const imported = await window.api.importCover(target);
      if (imported === null) return null;
      if (imported.ok) {
        setCovers(await window.api.listCovers().catch(() => covers));
      }
      return imported;
    } catch (error) {
      console.error("importCover failed", error);
      return { ok: false, error: IMPORT_COVER_FAILED };
    }
  };

  const handleImportPostImage = async (
    input: PostImageInput,
  ): Promise<ImportPostImageResult | null> => {
    try {
      return await window.api.importPostImage(input);
    } catch (error) {
      console.error("importPostImage failed", error);
      return { ok: false, error: IMPORT_POST_IMAGE_FAILED };
    }
  };

  if (identity === undefined) return null;
  if (identity === null) return <IdentityForm onSubmit={handleIdentity} />;

  const books: readonly BookEntry[] = result?.ok ? result.books : [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Gestão do site</h1>
      {site.name === "sign-in" && (
        <SignInPanel onSignIn={handleSignIn} notice={site.notice} />
      )}
      {site.name === "opening" && <p aria-busy="true">Baixando o site…</p>}
      {site.name === "failed" && (
        <div className="space-y-2">
          <p role="alert" className="text-red-700">
            {site.error}
          </p>
          <button
            type="button"
            onClick={() => void openSite()}
            className="rounded border border-indigo-600 px-3 py-1 text-indigo-700"
          >
            Tentar de novo
          </button>
        </div>
      )}
      {site.name === "ready" && site.notice !== null && (
        <p role="status" className="rounded bg-amber-50 p-3 text-amber-900">
          {site.notice}
        </p>
      )}
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
      {result?.ok === true && screen.name === "list" && (
        <section aria-label="Posts">
          <h2 className="mb-3 text-xl font-semibold">Posts</h2>
          <PostList
            posts={posts}
            onEdit={(draft) => setScreen({ name: "post", draft })}
            onCreate={() =>
              setScreen({ name: "post", draft: emptyPostDraft() })
            }
          />
        </section>
      )}
      {result?.ok === true && screen.name === "post" && (
        <PostForm
          initial={screen.draft}
          onSave={handleSavePost}
          onImportImage={handleImportPostImage}
          onClose={() => setScreen({ name: "list" })}
        />
      )}
      {result?.ok === true && screen.name === "list" && (
        <nav aria-label="Outros textos" className="flex gap-3">
          {SINGLE_FILE_KINDS.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setScreen({ name: "single", kind })}
              className="rounded border border-indigo-600 px-3 py-1 text-indigo-700"
            >
              {SINGLE_FILE_TITLES[kind]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setScreen({ name: "history" })}
            className="rounded border border-indigo-600 px-3 py-1 text-indigo-700"
          >
            Histórico
          </button>
        </nav>
      )}
      {result?.ok === true && screen.name === "single" && (
        <SingleFileForm
          key={screen.kind}
          kind={screen.kind}
          onClose={() => setScreen({ name: "list" })}
        />
      )}
      {result?.ok === true && screen.name === "history" && (
        <HistoryScreen
          onRestored={(restored) => {
            setResult({ ok: true, books: restored.books });
            setPosts(restored.posts);
          }}
          onClose={() => setScreen({ name: "list" })}
        />
      )}
      {result?.ok === true && screen.name === "form" && (
        <BookForm
          initial={screen.draft}
          covers={covers}
          onSave={handleSave}
          onImportCover={handleImportCover}
          onClose={() => setScreen({ name: "list" })}
        />
      )}
    </main>
  );
}
