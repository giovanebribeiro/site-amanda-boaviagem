import type { Book } from "@/types";

/**
 * Book highlighted on the home page: the flagged "próximo lançamento" with the
 * soonest releaseDate, otherwise the newest book. Expects newest-first input.
 */
export function pickFeaturedBook(books: readonly Book[]): Book | null {
  const upcoming = books
    .filter((book) => book.toRelease)
    .sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : 1));
  return upcoming[0] ?? books[0] ?? null;
}

/** Flagged books whose release day already passed: the author probably forgot to unflag them. */
export function findStaleToRelease(
  books: readonly Book[],
  today: string,
): Book[] {
  return books.filter((book) => book.toRelease && book.releaseDate < today);
}
