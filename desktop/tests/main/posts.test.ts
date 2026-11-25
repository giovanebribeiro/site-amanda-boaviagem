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
import { parsePostFrontmatter } from "@shared/content-schema";
import { emptyPostDraft } from "../../src/common/post-draft";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };
const draft = {
  ...emptyPostDraft(),
  title: "Meu Primeiro Post",
  date: "2024-03-01",
  excerpt: "Um resumo.",
  body: "Texto do **post**.",
};

describe("ContentSession posts", () => {
  let repo: string;
  const blogDir = () => join(repo, "content", "blog");
  const postPath = (file: string) => join(blogDir(), file);

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "post-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(blogDir(), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("creates an .mdx file with a slug from the title and a local version", async () => {
    const result = await openContentSession(repo).savePost(draft, author);

    expect(result).toMatchObject({
      slug: "meu-primeiro-post",
      missing: [],
      versionCreated: true,
    });
    const { data, content } = matter(
      readFileSync(postPath("meu-primeiro-post.mdx"), "utf8"),
    );
    expect(parsePostFrontmatter(data, "meu-primeiro-post")).toMatchObject({
      title: "Meu Primeiro Post",
      date: "2024-03-01",
      excerpt: "Um resumo.",
      inPreparation: false,
    });
    expect(content.trim()).toBe("Texto do **post**.");
    const [entry] = await git.log({ fs, dir: repo });
    expect(entry.commit.author.email).toBe(author.email);
  });

  it("keeps the slug when the title is renamed", async () => {
    const session = openContentSession(repo);
    const first = await session.savePost(draft, author);

    const second = await session.savePost(
      { ...draft, slug: first.slug, title: "Outro Título" },
      author,
    );

    expect(second.slug).toBe("meu-primeiro-post");
    expect(fs.readdirSync(blogDir())).toEqual(["meu-primeiro-post.mdx"]);
    expect(readFileSync(postPath("meu-primeiro-post.mdx"), "utf8")).toContain(
      "Outro Título",
    );
  });

  it("gives a distinct slug to a post with the same title", async () => {
    const session = openContentSession(repo);
    await session.savePost(draft, author);

    const second = await session.savePost(draft, author);

    expect(second.slug).toBe("meu-primeiro-post-2");
  });

  it("keeps the .md extension of an existing .md post", async () => {
    writeFileSync(
      postPath("antigo.md"),
      '---\ntitle: "Antigo"\ndate: "2023-01-01"\nexcerpt: "x"\n---\nCorpo.\n',
    );
    const session = openContentSession(repo);

    await session.savePost(
      { ...draft, slug: "antigo", title: "Antigo" },
      author,
    );

    expect(fs.readdirSync(blogDir())).toEqual(["antigo.md"]);
  });

  it("stores the Em preparação flag and writes it so the site hides the post", async () => {
    await openContentSession(repo).savePost(
      { ...draft, inPreparation: true },
      author,
    );

    const { data } = matter(
      readFileSync(postPath("meu-primeiro-post.mdx"), "utf8"),
    );
    expect(parsePostFrontmatter(data, "x").inPreparation).toBe(true);
  });

  it("omits the flag when the post is not in preparation", async () => {
    await openContentSession(repo).savePost(draft, author);

    expect(
      readFileSync(postPath("meu-primeiro-post.mdx"), "utf8"),
    ).not.toContain("inPreparation");
  });

  it("saves an incomplete draft and reports what is missing", async () => {
    const result = await openContentSession(repo).savePost(
      { ...emptyPostDraft(), title: "Rascunho" },
      author,
    );

    expect(result.missing).toEqual([
      "Data (use o formato AAAA-MM-DD)",
      "Resumo",
    ]);
  });

  it("preserves the coverImage of an existing post", async () => {
    writeFileSync(
      postPath("com-capa.mdx"),
      '---\ntitle: "Com capa"\ndate: "2023-01-01"\nexcerpt: "x"\ncoverImage: "/images/blog/c.png"\n---\nCorpo.\n',
    );
    const session = openContentSession(repo);
    const [entry] = session.listPosts();
    if (entry.status !== "valid") throw new Error("expected valid");

    await session.savePost({ ...entry.post, body: "Novo corpo." }, author);

    expect(readFileSync(postPath("com-capa.mdx"), "utf8")).toContain(
      "/images/blog/c.png",
    );
  });

  it("escapes characters that would break the MDX build", async () => {
    await openContentSession(repo).savePost(
      { ...draft, body: "a < b e {chaves} e \\< já escapado" },
      author,
    );

    const { content } = matter(
      readFileSync(postPath("meu-primeiro-post.mdx"), "utf8"),
    );
    expect(content.trim()).toBe("a \\< b e \\{chaves} e \\< já escapado");
  });

  it("writes LF only", async () => {
    await openContentSession(repo).savePost(
      { ...draft, body: "linha 1\r\nlinha 2" },
      author,
    );

    expect(
      readFileSync(postPath("meu-primeiro-post.mdx"), "utf8"),
    ).not.toContain("\r");
  });

  it("does not create a version when nothing changed", async () => {
    const session = openContentSession(repo);
    const first = await session.savePost(draft, author);

    const again = await session.savePost(
      { ...draft, slug: first.slug },
      author,
    );

    expect(again.versionCreated).toBe(false);
  });

  it("lists posts newest first, flagging unreadable ones", () => {
    writeFileSync(
      postPath("a.mdx"),
      '---\ntitle: "A"\ndate: "2023-01-01"\nexcerpt: "x"\n---\nA.\n',
    );
    writeFileSync(
      postPath("b.mdx"),
      '---\ntitle: "B"\ndate: "2024-01-01"\nexcerpt: "x"\ninPreparation: true\n---\nB.\n',
    );
    writeFileSync(
      postPath("c.mdx"),
      '---\ntitle: "C"\ninPreparation: "sim"\n---\nC.\n',
    );

    const entries = openContentSession(repo).listPosts();

    expect(entries.map((e) => [e.slug, e.status])).toEqual([
      ["b", "valid"],
      ["a", "valid"],
      ["c", "invalid"],
    ]);
    const b = entries[0];
    if (b.status !== "valid") throw new Error("expected valid");
    expect(b.post.inPreparation).toBe(true);
    expect(b.post.body).toBe("B.");
  });

  it("returns no posts when the blog folder does not exist", () => {
    rmSync(blogDir(), { recursive: true });

    expect(openContentSession(repo).listPosts()).toEqual([]);
  });

  it("keeps escapes stable across read and save", async () => {
    const session = openContentSession(repo);
    await session.savePost({ ...draft, body: "a < b {x}" }, author);
    const [entry] = session.listPosts();
    if (entry.status !== "valid") throw new Error("expected valid");
    const before = readFileSync(postPath("meu-primeiro-post.mdx"), "utf8");

    await session.savePost(entry.post, author);

    expect(readFileSync(postPath("meu-primeiro-post.mdx"), "utf8")).toBe(
      before,
    );
  });
});
