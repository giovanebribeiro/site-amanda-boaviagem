import { isBookDraft } from "../common/book-draft";
import type {
  BookDraft,
  OpenRepositoryResult,
  SaveBookResult,
} from "../common/types";
import type { ContentSession } from "./content-session";
import type { IdentityStore } from "./identity-store";
import { openRepositoryWithSession } from "./repository-service";

const NO_FOLDER_MESSAGE = "Abra a pasta do site antes de salvar.";
const NO_IDENTITY_MESSAGE =
  "Informe o seu nome e e-mail antes de salvar (eles identificam cada versão salva).";
const SAVE_FAILED_MESSAGE =
  "Não foi possível salvar o livro. Verifique a pasta do site e tente de novo.";

export interface Workspace {
  open(repoPath: string | null): OpenRepositoryResult | null;
  covers(): readonly string[];
  saveBook(draft: BookDraft): Promise<SaveBookResult>;
}

/** Holds the opened content session for the app's lifetime. */
export function createWorkspace(identityStore: IdentityStore): Workspace {
  let session: ContentSession | null = null;

  return {
    open(repoPath) {
      const opened = openRepositoryWithSession(repoPath);
      if (opened === null) return null;
      session = opened.session;
      return opened.result;
    },

    covers() {
      return session?.listCovers() ?? [];
    },

    async saveBook(draft) {
      if (!isBookDraft(draft)) return { ok: false, error: SAVE_FAILED_MESSAGE };
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      const author = identityStore.read();
      if (author === null) return { ok: false, error: NO_IDENTITY_MESSAGE };
      try {
        const outcome = await session.saveBook(draft, author);
        return { ok: true, ...outcome, books: session.listBooks() };
      } catch (error) {
        console.error("Failed to save book", error);
        return { ok: false, error: SAVE_FAILED_MESSAGE };
      }
    },
  };
}
