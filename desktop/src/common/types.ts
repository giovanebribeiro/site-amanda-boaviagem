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

export type SaveBookResult =
  | ({ ok: true; books: readonly BookEntry[] } & SaveBookOutcome)
  | { ok: false; error: string };

export type OpenRepositoryResult =
  { ok: true; books: readonly BookEntry[] } | { ok: false; error: string };
