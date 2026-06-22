import DataStore from "@/public/data/DataStore";
import type { Book } from "@/types";

/** Returns all books sorted by releaseDate descending (newest first). Immutable. */
export function getBooksSortedByDate(): Book[] {
  return DataStore.items.slice().sort((a, b) =>
    a.releaseDate < b.releaseDate ? 1 : -1
  );
}

/** Returns a single book by slug, or null if not found. */
export function getBookBySlug(slug: string): Book | null {
  return DataStore.items.find((b) => b.slug === slug) ?? null;
}

/** Returns the book with the most recent releaseDate, or null if no books exist. */
export function getLatestBook(): Book | null {
  return getBooksSortedByDate()[0] ?? null;
}
