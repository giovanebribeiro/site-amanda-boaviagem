import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { serialize } from "next-mdx-remote/serialize";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAllPosts, getPostBySlug } from "../../../lib/blog";
import { emptyPostDraft } from "../../src/common/post-draft";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };
const draft = {
  ...emptyPostDraft(),
  title: "Post de teste",
  date: "2024-03-01",
  excerpt: "Resumo.",
  body: "## Seção\n\nTexto com a < b e {chaves}, **negrito** e [link](https://example.com).",
};

describe("posts saved by the app, read by the site", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "compat-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "blog"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const content = () => join(repo, "content");

  it("is listed and compiles as MDX without error", async () => {
    await openContentSession(repo).savePost(draft, author);

    const [post] = getAllPosts(content());
    const full = getPostBySlug("post-de-teste", content());

    expect(post).toMatchObject({
      slug: "post-de-teste",
      title: "Post de teste",
    });
    await expect(serialize(full!.content)).resolves.toBeDefined();
  });

  it("does not appear on the site while Em preparação", async () => {
    await openContentSession(repo).savePost(
      { ...draft, inPreparation: true },
      author,
    );

    expect(getAllPosts(content())).toEqual([]);
    expect(getPostBySlug("post-de-teste", content())).toBeNull();
  });
});
