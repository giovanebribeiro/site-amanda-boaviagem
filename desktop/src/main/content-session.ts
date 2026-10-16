import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";
import matter from "gray-matter";
import { parseBookFrontmatter } from "@shared/content-schema";
import {
  SLUG_PATTERN,
  findMissing,
  serializeBook,
  slugify,
  uniqueSlug,
} from "../common/book-draft";
import type {
  BookDraft,
  BookEntry,
  Identity,
  SaveBookOutcome,
} from "../common/types";
import { saveVersion } from "./version-store";

const BOOK_EXTENSION = ".md";
const COVER_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const COVERS_URL_PREFIX = "/images/books";

export class NotASiteRepositoryError extends Error {
  constructor(repoPath: string) {
    super(`Not the site repository (no content/ folder): ${repoPath}`);
    this.name = "NotASiteRepositoryError";
  }
}

export interface ContentSession {
  listBooks(): readonly BookEntry[];
  /** Existing cover images, as site paths (e.g. /images/books/x.png). */
  listCovers(): readonly string[];
  /** Writes the book file and creates a local Versão salva. Incomplete drafts are allowed. */
  saveBook(draft: BookDraft, author: Identity): Promise<SaveBookOutcome>;
}

function toDraft(
  slug: string,
  data: Record<string, unknown>,
  body: string,
): BookDraft {
  const text = (value: unknown): string =>
    value === undefined || value === null ? "" : String(value);
  const list = (value: unknown): Record<string, unknown>[] =>
    Array.isArray(value) ? value : [];
  return {
    slug,
    title: text(data.title),
    releaseDate: text(
      data.releaseDate instanceof Date
        ? data.releaseDate.toISOString().slice(0, 10)
        : data.releaseDate,
    ),
    image: text(data.image),
    slogan: text(data.slogan),
    links: list(data.links).map((link) => ({
      label: text(link?.label),
      url: text(link?.url),
      ...(link?.primary === true ? { primary: true } : {}),
    })),
    reviews: list(data.reviews).map((review) => ({
      author: text(review?.author),
      text: text(review?.text),
    })),
    synopsis: body.trim(),
  };
}

function readBook(booksDir: string, slug: string): BookEntry {
  const fileName = `${slug}${BOOK_EXTENSION}`;
  let draft: BookDraft | undefined;
  try {
    const { data, content } = matter(
      readFileSync(join(booksDir, fileName), "utf8"),
    );
    draft = toDraft(slug, data, content);
    const frontmatter = parseBookFrontmatter(data, fileName);
    return {
      slug,
      status: "valid",
      book: { ...frontmatter, slug, synopsis: content.trim() },
    };
  } catch (error) {
    return {
      slug,
      status: "invalid",
      error: error instanceof Error ? error.message : String(error),
      ...(draft ? { draft } : {}),
    };
  }
}

function releaseDateOf(entry: BookEntry): string {
  return entry.status === "valid" ? entry.book.releaseDate : "";
}

export function openContentSession(repoPath: string): ContentSession {
  const contentDir = join(repoPath, "content");
  if (!existsSync(contentDir)) {
    throw new NotASiteRepositoryError(repoPath);
  }
  const booksDir = join(contentDir, "books");

  const coversDir = join(repoPath, "public", "images", "books");

  const listSlugs = (): string[] =>
    existsSync(booksDir)
      ? readdirSync(booksDir)
          .filter((file) => file.endsWith(BOOK_EXTENSION))
          .map((file) => file.slice(0, -BOOK_EXTENSION.length))
          .sort()
      : [];

  return {
    listBooks() {
      return listSlugs()
        .map((slug) => readBook(booksDir, slug))
        .sort((a, b) => releaseDateOf(b).localeCompare(releaseDateOf(a)));
    },

    listCovers() {
      if (!existsSync(coversDir)) return [];
      return readdirSync(coversDir)
        .filter((file) =>
          COVER_EXTENSIONS.includes(extname(file).toLowerCase()),
        )
        .sort()
        .map((file) => `${COVERS_URL_PREFIX}/${file}`);
    },

    async saveBook(draft, author) {
      const slug = draft.slug ?? uniqueSlug(slugify(draft.title), listSlugs());
      if (!SLUG_PATTERN.test(slug)) {
        throw new Error(`Invalid book slug: ${slug}`);
      }
      const relativePath = `content/books/${slug}${BOOK_EXTENSION}`;
      mkdirSync(booksDir, { recursive: true });
      writeFileSync(join(repoPath, relativePath), serializeBook(draft));

      const versionCreated = await saveVersion({
        repoPath,
        filepaths: [relativePath],
        message: `chore(content): atualizar livro "${draft.title.trim() || slug}"`,
        author,
      });
      return { slug, missing: findMissing(draft), versionCreated };
    },
  };
}
