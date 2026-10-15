import type { BookFrontmatter } from "@shared/content-schema";

export type BookSummary = BookFrontmatter & {
  slug: string;
  /** Sinopse: the markdown body of the book file. */
  synopsis: string;
};

export type BookEntry =
  | { slug: string; status: "valid"; book: BookSummary }
  | { slug: string; status: "invalid"; error: string };

export type OpenRepositoryResult =
  { ok: true; books: readonly BookEntry[] } | { ok: false; error: string };
