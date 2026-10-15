import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { parseBookFrontmatter } from "@shared/content-schema";
import type { BookEntry } from "../common/types";

const BOOK_EXTENSION = ".md";

export class NotASiteRepositoryError extends Error {
  constructor(repoPath: string) {
    super(`Not the site repository (no content/ folder): ${repoPath}`);
    this.name = "NotASiteRepositoryError";
  }
}

export interface ContentSession {
  listBooks(): readonly BookEntry[];
}

function readBook(booksDir: string, slug: string): BookEntry {
  const fileName = `${slug}${BOOK_EXTENSION}`;
  try {
    const { data, content } = matter(
      readFileSync(join(booksDir, fileName), "utf8"),
    );
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

  return {
    listBooks() {
      if (!existsSync(booksDir)) return [];
      return readdirSync(booksDir)
        .filter((file) => file.endsWith(BOOK_EXTENSION))
        .map((file) => file.slice(0, -BOOK_EXTENSION.length))
        .sort()
        .map((slug) => readBook(booksDir, slug))
        .sort((a, b) => releaseDateOf(b).localeCompare(releaseDateOf(a)));
    },
  };
}
