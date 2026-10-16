import type { SingleFileValues } from "./single-file";
import type { BookFrontmatter, BookLink, Review } from "@shared/content-schema";

export type BookSummary = BookFrontmatter & {
  slug: string;
  /** Sinopse: the markdown body of the book file. */
  synopsis: string;
};

/** Editable form state; may be incomplete or invalid. `slug` is null until the first save. */
export interface BookDraft {
  slug: string | null;
  title: string;
  releaseDate: string;
  image: string;
  slogan: string;
  links: BookLink[];
  reviews: Review[];
  synopsis: string;
}

/** Which book a cover belongs to. A null slug means not saved yet: the title names the folder. */
export interface CoverTarget {
  slug: string | null;
  title: string;
}

export interface CoverImportInput extends CoverTarget {
  bytes: Uint8Array;
}

export interface CoverImport {
  /** Site path to store in the book's `image` field. */
  image: string;
  /** Set when the stored image is still heavy. */
  warning?: string;
}

export type ImportCoverResult =
  ({ ok: true } & CoverImport) | { ok: false; error: string };

export interface Identity {
  name: string;
  email: string;
}

export type BookEntry =
  | { slug: string; status: "valid"; book: BookSummary }
  | { slug: string; status: "invalid"; error: string; draft?: BookDraft };

export type IdentityResult =
  { ok: true; identity: Identity } | { ok: false; error: string };

export interface SaveBookOutcome {
  slug: string;
  missing: string[];
  versionCreated: boolean;
}

export interface SingleFileRead {
  values: SingleFileValues;
  /** Set when the existing file could not be parsed; values then start empty. */
  error?: string;
}

export interface SaveSingleOutcome {
  missing: string[];
  versionCreated: boolean;
}

export type SaveSingleResult =
  ({ ok: true } & SaveSingleOutcome) | { ok: false; error: string };

export type ReadSingleResult =
  ({ ok: true } & SingleFileRead) | { ok: false; error: string };

export type SaveBookResult =
  | ({ ok: true; books: readonly BookEntry[] } & SaveBookOutcome)
  | { ok: false; error: string };

export type OpenRepositoryResult =
  { ok: true; books: readonly BookEntry[] } | { ok: false; error: string };
