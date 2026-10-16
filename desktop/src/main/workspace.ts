import type { SingleFileKind } from "@shared/content-schema";
import { isBookDraft, isCoverImportInput } from "../common/book-draft";
import {
  isPostDraft,
  isPostImageImportInput,
  sanitizeAlt,
} from "../common/post-draft";
import {
  isSingleFileKind,
  isSingleFileValues,
  type SingleFileValues,
} from "../common/single-file";
import type {
  BookDraft,
  CoverImportInput,
  ImportCoverResult,
  ImportPostImageResult,
  PostImageImportInput,
  PostImageInput,
  ListPostsResult,
  PostDraft,
  SavePostResult,
  ReadSingleResult,
  SaveSingleResult,
  OpenRepositoryResult,
  SaveBookResult,
} from "../common/types";
import {
  MissingAltTextError,
  MissingBookNameError,
  MissingPostNameError,
  type ContentSession,
} from "./content-session";
import type { IdentityStore } from "./identity-store";
import { openRepositoryWithSession } from "./repository-service";

const NO_FOLDER_MESSAGE = "Abra a pasta do site antes de salvar.";
const NO_IDENTITY_MESSAGE =
  "Informe o seu nome e e-mail antes de salvar (eles identificam cada versão salva).";
const SAVE_FAILED_MESSAGE =
  "Não foi possível salvar o livro. Verifique a pasta do site e tente de novo.";

const SAVE_POST_FAILED_MESSAGE =
  "Não foi possível salvar o post. Verifique a pasta do site e tente de novo.";
const LIST_POSTS_FAILED_MESSAGE =
  "Não foi possível abrir os posts. Verifique a pasta do site e tente de novo.";

const READ_FAILED_MESSAGE =
  "Não foi possível abrir este conteúdo. Verifique a pasta do site e tente de novo.";
const SAVE_SINGLE_FAILED_MESSAGE =
  "Não foi possível salvar. Verifique a pasta do site e tente de novo.";

const IMPORT_COVER_FAILED_MESSAGE =
  "Não foi possível importar a capa. Escolha um arquivo de imagem (PNG, JPG ou GIF) e tente de novo.";

const IMPORT_POST_IMAGE_FAILED_MESSAGE =
  "Não foi possível inserir a imagem. Escolha um arquivo de imagem (PNG, JPG ou GIF) e tente de novo.";

export interface Workspace {
  open(repoPath: string | null): OpenRepositoryResult | null;
  covers(): readonly string[];
  importCover(input: CoverImportInput): Promise<ImportCoverResult>;
  /** Refusal to show before the file picker opens, or null when the request may proceed. */
  checkPostImage(input: PostImageInput): ImportPostImageResult | null;
  importPostImage(input: PostImageImportInput): Promise<ImportPostImageResult>;
  saveBook(draft: BookDraft): Promise<SaveBookResult>;
  listPosts(): ListPostsResult;
  savePost(draft: PostDraft): Promise<SavePostResult>;
  readSingle(kind: SingleFileKind): ReadSingleResult;
  saveSingle(
    kind: SingleFileKind,
    values: SingleFileValues,
  ): Promise<SaveSingleResult>;
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

    async importCover(input) {
      if (!isCoverImportInput(input)) {
        return { ok: false, error: IMPORT_COVER_FAILED_MESSAGE };
      }
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      try {
        return { ok: true, ...(await session.importCover(input)) };
      } catch (error) {
        console.error("Failed to import cover", error);
        return {
          ok: false,
          error:
            error instanceof MissingBookNameError
              ? error.message
              : IMPORT_COVER_FAILED_MESSAGE,
        };
      }
    },

    checkPostImage(input) {
      if (typeof input?.alt !== "string" || !sanitizeAlt(input.alt)) {
        return { ok: false, error: new MissingAltTextError().message };
      }
      return null;
    },

    async importPostImage(input) {
      if (!isPostImageImportInput(input)) {
        return { ok: false, error: IMPORT_POST_IMAGE_FAILED_MESSAGE };
      }
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      try {
        return { ok: true, ...(await session.importPostImage(input)) };
      } catch (error) {
        console.error("Failed to import post image", error);
        return {
          ok: false,
          error:
            error instanceof MissingAltTextError ||
            error instanceof MissingPostNameError
              ? error.message
              : IMPORT_POST_IMAGE_FAILED_MESSAGE,
        };
      }
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

    listPosts() {
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      try {
        return { ok: true, posts: session.listPosts() };
      } catch (error) {
        console.error("Failed to list posts", error);
        return { ok: false, error: LIST_POSTS_FAILED_MESSAGE };
      }
    },

    async savePost(draft) {
      if (!isPostDraft(draft)) {
        return { ok: false, error: SAVE_POST_FAILED_MESSAGE };
      }
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      const author = identityStore.read();
      if (author === null) return { ok: false, error: NO_IDENTITY_MESSAGE };
      try {
        const outcome = await session.savePost(draft, author);
        return { ok: true, ...outcome, posts: session.listPosts() };
      } catch (error) {
        console.error("Failed to save post", error);
        return { ok: false, error: SAVE_POST_FAILED_MESSAGE };
      }
    },

    readSingle(kind) {
      if (!isSingleFileKind(kind))
        return { ok: false, error: READ_FAILED_MESSAGE };
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      try {
        return { ok: true, ...session.readSingle(kind) };
      } catch (error) {
        console.error("Failed to read single-file content", error);
        return { ok: false, error: READ_FAILED_MESSAGE };
      }
    },

    async saveSingle(kind, values) {
      if (!isSingleFileKind(kind) || !isSingleFileValues(values)) {
        return { ok: false, error: SAVE_SINGLE_FAILED_MESSAGE };
      }
      if (session === null) return { ok: false, error: NO_FOLDER_MESSAGE };
      const author = identityStore.read();
      if (author === null) return { ok: false, error: NO_IDENTITY_MESSAGE };
      try {
        const outcome = await session.saveSingle(kind, values, author);
        return {
          ok: true,
          ...outcome,
          values: session.readSingle(kind).values,
        };
      } catch (error) {
        console.error("Failed to save single-file content", error);
        return { ok: false, error: SAVE_SINGLE_FAILED_MESSAGE };
      }
    },
  };
}
