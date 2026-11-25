import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Book } from "@/types";
import { parseBookFrontmatter } from "@/shared/content-schema";

const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");
const BOOK_EXTENSION = ".md";

function booksDir(contentRoot: string): string {
  return path.join(contentRoot, "books");
}

function parseBookFile(
  filePath: string,
  slug: string,
): Omit<Book, "id" | "direction"> {
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  return {
    slug,
    description: content.trim(),
    ...parseBookFrontmatter(data, `${slug}${BOOK_EXTENSION}`),
  };
}

/** Returns all books sorted by releaseDate descending (newest first). */
export function getBooksSortedByDate(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): Book[] {
  const dir = booksDir(contentRoot);
  if (!fs.existsSync(dir)) {
    return [];
  }

  const slugs = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(BOOK_EXTENSION))
    .map((file) => file.slice(0, -BOOK_EXTENSION.length))
    .sort();

  const ids = new Map(slugs.map((slug, index) => [slug, index + 1]));

  return slugs
    .map((slug) =>
      parseBookFile(path.join(dir, `${slug}${BOOK_EXTENSION}`), slug),
    )
    .sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1))
    .map((book, index) => ({
      ...book,
      id: ids.get(book.slug) as number,
      direction: index % 2 === 0 ? "right" : "left",
    }));
}

/** Returns a single book by slug, or null if not found. */
export function getBookBySlug(
  slug: string,
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): Book | null {
  return getBooksSortedByDate(contentRoot).find((b) => b.slug === slug) ?? null;
}

/** Returns the book with the most recent releaseDate, or null if none exist. */
export function getLatestBook(
  contentRoot: string = DEFAULT_CONTENT_ROOT,
): Book | null {
  return getBooksSortedByDate(contentRoot)[0] ?? null;
}
