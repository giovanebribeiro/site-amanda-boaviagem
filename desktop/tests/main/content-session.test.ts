import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  NotASiteRepositoryError,
  openContentSession,
} from "../../src/main/content-session";

const VALID_BOOK = `---
title: "Livro A"
releaseDate: "2021-05-01"
image: "/images/books/a.png"
slogan: "um slogan"
links:
  - { label: "Amazon", url: "https://example.com", primary: true }
---
Sinopse do livro A.
`;

describe("openContentSession", () => {
  let repo: string;

  const writeBook = (slug: string, source: string): void => {
    writeFileSync(join(repo, "content", "books", `${slug}.md`), source);
  };

  beforeEach(() => {
    repo = mkdtempSync(join(tmpdir(), "site-repo-"));
    mkdirSync(join(repo, "content", "books"), { recursive: true });
  });

  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("lists valid books with slug, frontmatter and synopsis", () => {
    writeBook("livro-a", VALID_BOOK);

    const entries = openContentSession(repo).listBooks();

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      slug: "livro-a",
      status: "valid",
      book: {
        slug: "livro-a",
        title: "Livro A",
        releaseDate: "2021-05-01",
        synopsis: "Sinopse do livro A.",
        links: [{ label: "Amazon", primary: true }],
      },
    });
  });

  it("sorts books newest first", () => {
    writeBook("antigo", VALID_BOOK.replace("2021-05-01", "2019-01-01"));
    writeBook("novo", VALID_BOOK.replace("2021-05-01", "2024-01-01"));

    const slugs = openContentSession(repo)
      .listBooks()
      .map((entry) => entry.slug);

    expect(slugs).toEqual(["novo", "antigo"]);
  });

  it("reports an invalid book without dropping the others", () => {
    writeBook("bom", VALID_BOOK);
    writeBook("ruim", VALID_BOOK.replace('title: "Livro A"\n', ""));

    const entries = openContentSession(repo).listBooks();

    const bad = entries.find((entry) => entry.slug === "ruim");
    expect(bad?.status).toBe("invalid");
    expect(bad).toMatchObject({ error: expect.stringContaining("title") });
    expect(entries.find((entry) => entry.slug === "bom")?.status).toBe("valid");
  });

  it("reports malformed frontmatter as an invalid book", () => {
    writeBook("quebrado", "---\ntitle: [unclosed\n---\ncorpo");

    const [entry] = openContentSession(repo).listBooks();

    expect(entry.status).toBe("invalid");
  });

  it("ignores non-markdown files", () => {
    writeFileSync(join(repo, "content", "books", "notas.txt"), "x");

    expect(openContentSession(repo).listBooks()).toEqual([]);
  });

  it("returns an empty list when there is no books folder", () => {
    rmSync(join(repo, "content", "books"), { recursive: true });

    expect(openContentSession(repo).listBooks()).toEqual([]);
  });

  it("rejects a folder that is not the site repository", () => {
    const other = mkdtempSync(join(tmpdir(), "not-a-repo-"));
    try {
      expect(() => openContentSession(other)).toThrow(NotASiteRepositoryError);
    } finally {
      rmSync(other, { recursive: true, force: true });
    }
  });
});
