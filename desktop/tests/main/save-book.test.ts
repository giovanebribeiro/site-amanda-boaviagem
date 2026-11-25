import * as fs from "node:fs";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import matter from "gray-matter";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseBookFrontmatter } from "@shared/content-schema";
import { emptyDraft } from "../../src/common/book-draft";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };
const draft = {
  ...emptyDraft(),
  title: "Meu Livro Novo",
  releaseDate: "2024-03-01",
  image: "/images/books/capa.png",
  synopsis: "Sinopse.",
};

describe("ContentSession.saveBook", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "save-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
    mkdirSync(join(repo, "public", "images", "books"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const bookPath = (slug: string) =>
    join(repo, "content", "books", `${slug}.md`);

  it("creates the file with a slug generated from the title and a local version", async () => {
    const result = await openContentSession(repo).saveBook(draft, author);

    expect(result).toMatchObject({
      slug: "meu-livro-novo",
      missing: [],
      versionCreated: true,
    });
    const { data } = matter(readFileSync(bookPath("meu-livro-novo"), "utf8"));
    expect(parseBookFrontmatter(data, "x.md").title).toBe("Meu Livro Novo");
    const [entry] = await git.log({ fs, dir: repo });
    expect(entry.commit.author.email).toBe(author.email);
  });

  it("keeps the slug when the title is renamed", async () => {
    const session = openContentSession(repo);
    const first = await session.saveBook(draft, author);

    const second = await session.saveBook(
      { ...draft, slug: first.slug, title: "Outro Título" },
      author,
    );

    expect(second.slug).toBe("meu-livro-novo");
    expect(fs.readdirSync(join(repo, "content", "books"))).toEqual([
      "meu-livro-novo.md",
    ]);
    expect(readFileSync(bookPath("meu-livro-novo"), "utf8")).toContain(
      "Outro Título",
    );
  });

  it("does not overwrite another book with the same generated slug", async () => {
    writeFileSync(bookPath("meu-livro-novo"), "---\ntitle: x\n---\n");

    const result = await openContentSession(repo).saveBook(draft, author);

    expect(result.slug).toBe("meu-livro-novo-2");
  });

  it("saves an incomplete book and reports what is missing", async () => {
    const result = await openContentSession(repo).saveBook(
      { ...emptyDraft(), title: "Rascunho" },
      author,
    );

    expect(result.missing).toEqual([
      "Data de lançamento (use o formato AAAA-MM-DD)",
      "Capa",
    ]);
    expect(fs.existsSync(bookPath("rascunho"))).toBe(true);
  });

  it("lists an incomplete saved book as invalid but editable", async () => {
    const session = openContentSession(repo);
    await session.saveBook({ ...emptyDraft(), title: "Rascunho" }, author);

    const [entry] = session.listBooks();

    expect(entry).toMatchObject({
      status: "invalid",
      draft: { slug: "rascunho", title: "Rascunho" },
    });
  });

  it("rejects a draft slug that would escape the books folder", async () => {
    await expect(
      openContentSession(repo).saveBook(
        { ...draft, slug: "../../evil" },
        author,
      ),
    ).rejects.toThrow(/slug/i);
  });

  it("lists the existing covers", () => {
    writeFileSync(join(repo, "public/images/books/a.png"), "");
    writeFileSync(join(repo, "public/images/books/b.jpg"), "");
    writeFileSync(join(repo, "public/images/books/notas.txt"), "");

    expect(openContentSession(repo).listCovers()).toEqual([
      "/images/books/a.png",
      "/images/books/b.jpg",
    ]);
  });
});
