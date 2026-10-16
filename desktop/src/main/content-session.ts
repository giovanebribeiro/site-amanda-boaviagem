import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { extname, join } from "node:path";
import matter from "gray-matter";
import {
  SINGLE_FILES,
  parseBookFrontmatter,
  type SingleFileKind,
} from "@shared/content-schema";
import {
  findMissingFields,
  serializeSingleFile,
  type SingleFileValues,
} from "../common/single-file";
import {
  SLUG_PATTERN,
  coverRepoPath,
  findMissing,
  serializeBook,
  slugify,
  uniqueSlug,
} from "../common/book-draft";
import type {
  BookDraft,
  BookEntry,
  CoverImport,
  CoverImportInput,
  Identity,
  SaveBookOutcome,
  SaveSingleOutcome,
  SingleFileRead,
} from "../common/types";
import { processCover } from "./cover-image";
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

export class MissingBookNameError extends Error {
  constructor() {
    super("Preencha o título do livro antes de importar a capa.");
    this.name = "MissingBookNameError";
  }
}

export interface ContentSession {
  listBooks(): readonly BookEntry[];
  /** Existing cover images, as site paths (e.g. /images/books/x.png). */
  listCovers(): readonly string[];
  /** Resizes and stores a cover under public/images/books/<slug>/; nothing is written on failure. */
  importCover(input: CoverImportInput): Promise<CoverImport>;
  /** Writes the book file and creates a local Versão salva. Incomplete drafts are allowed. */
  saveBook(draft: BookDraft, author: Identity): Promise<SaveBookOutcome>;
  /** Current values of about/contact/site; unreadable or missing files yield empty fields. */
  readSingle(kind: SingleFileKind): SingleFileRead;
  /** Writes the JSON file and creates a local Versão salva. Incomplete values are allowed. */
  saveSingle(
    kind: SingleFileKind,
    values: SingleFileValues,
    author: Identity,
  ): Promise<SaveSingleOutcome>;
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

function readSingleFile(
  contentDir: string,
  kind: SingleFileKind,
): SingleFileRead {
  const { fileName, fields } = SINGLE_FILES[kind];
  const empty = Object.fromEntries(fields.map((key) => [key, ""]));
  const filePath = join(contentDir, fileName);
  if (!existsSync(filePath)) return { values: empty };
  try {
    const data = JSON.parse(readFileSync(filePath, "utf8")) as Record<
      string,
      unknown
    >;
    return {
      values: Object.fromEntries(
        fields.map((key) => [
          key,
          typeof data[key] === "string" ? data[key] : "",
        ]),
      ),
    };
  } catch (error) {
    return {
      values: empty,
      error: `${fileName}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
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
      const isCover = (file: string): boolean =>
        COVER_EXTENSIONS.includes(extname(file).toLowerCase());
      const entries = readdirSync(coversDir, { withFileTypes: true });
      const flat = entries
        .filter((entry) => entry.isFile() && isCover(entry.name))
        .map((entry) => `${COVERS_URL_PREFIX}/${entry.name}`);
      const perBook = entries
        .filter((entry) => entry.isDirectory())
        .flatMap((entry) =>
          readdirSync(join(coversDir, entry.name))
            .filter(isCover)
            .map((file) => `${COVERS_URL_PREFIX}/${entry.name}/${file}`),
        );
      return [...flat, ...perBook].sort();
    },

    async importCover({ bytes, slug, title }) {
      const folder =
        slug ?? (title.trim() ? uniqueSlug(slugify(title), listSlugs()) : null);
      if (folder === null) {
        throw new MissingBookNameError();
      }
      if (!SLUG_PATTERN.test(folder)) {
        throw new Error(`Invalid book slug: ${folder}`);
      }
      const processed = await processCover(bytes);
      const bookCoversDir = join(coversDir, folder);
      mkdirSync(bookCoversDir, { recursive: true });
      const fileName = `cover${processed.extension}`;
      writeFileSync(join(bookCoversDir, fileName), processed.bytes);
      return {
        image: `${COVERS_URL_PREFIX}/${folder}/${fileName}`,
        ...(processed.warning ? { warning: processed.warning } : {}),
      };
    },

    async saveBook(draft, author) {
      const slug = draft.slug ?? uniqueSlug(slugify(draft.title), listSlugs());
      if (!SLUG_PATTERN.test(slug)) {
        throw new Error(`Invalid book slug: ${slug}`);
      }
      const relativePath = `content/books/${slug}${BOOK_EXTENSION}`;
      mkdirSync(booksDir, { recursive: true });
      writeFileSync(join(repoPath, relativePath), serializeBook(draft));

      const coverFile = coverRepoPath(draft.image);
      const versionCreated = await saveVersion({
        repoPath,
        filepaths: [
          relativePath,
          ...(coverFile && existsSync(join(repoPath, coverFile))
            ? [coverFile]
            : []),
        ],
        message: `chore(content): atualizar livro "${draft.title.trim() || slug}"`,
        author,
      });
      return { slug, missing: findMissing(draft), versionCreated };
    },

    readSingle(kind) {
      return readSingleFile(contentDir, kind);
    },

    async saveSingle(kind, values, author) {
      const { fileName, fields } = SINGLE_FILES[kind];
      const relativePath = `content/${fileName}`;
      writeFileSync(
        join(repoPath, relativePath),
        serializeSingleFile(fields, values),
      );
      const versionCreated = await saveVersion({
        repoPath,
        filepaths: [relativePath],
        message: `chore(content): atualizar ${fileName}`,
        author,
      });
      return { missing: findMissingFields(kind, values), versionCreated };
    },
  };
}
