import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Book, BookLink, Review } from "@/types";

const DEFAULT_CONTENT_ROOT = path.join(process.cwd(), "content");
const BOOK_EXTENSION = ".md";
const REQUIRED_FIELDS = ["title", "releaseDate", "image"] as const;

function booksDir(contentRoot: string): string {
  return path.join(contentRoot, "books");
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function invalid(slug: string, reason: string): Error {
  return new Error(`Invalid book (${slug}${BOOK_EXTENSION}): ${reason}`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function parseLinks(slug: string, raw: unknown): BookLink[] {
  if (raw === undefined) return [];
  if (
    !Array.isArray(raw) ||
    !raw.every((l) => isNonEmptyString(l?.label) && isNonEmptyString(l?.url))
  ) {
    throw invalid(slug, "links must be a list of { label, url }");
  }
  return raw as BookLink[];
}

function parseReviews(slug: string, raw: unknown): Review[] {
  if (raw === undefined) return [];
  if (
    !Array.isArray(raw) ||
    !raw.every((r) => isNonEmptyString(r?.author) && isNonEmptyString(r?.text))
  ) {
    throw invalid(slug, "reviews must be a list of { author, text }");
  }
  return raw as Review[];
}

function parseBookFile(
  filePath: string,
  slug: string,
): Omit<Book, "id" | "direction"> {
  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));

  for (const field of REQUIRED_FIELDS) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      throw invalid(slug, `missing required field: ${field}`);
    }
  }

  const releaseDate = toIsoDate(data.releaseDate);
  if (!ISO_DATE.test(releaseDate)) {
    throw invalid(slug, `releaseDate must be YYYY-MM-DD, got: ${releaseDate}`);
  }

  return {
    slug,
    title: String(data.title),
    description: content.trim(),
    image: String(data.image),
    links: parseLinks(slug, data.links),
    releaseDate,
    slogan: data.slogan ? String(data.slogan) : "",
    reviews: parseReviews(slug, data.reviews),
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
