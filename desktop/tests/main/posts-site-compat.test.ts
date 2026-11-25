import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { MDXRemote } from "next-mdx-remote";
// Same React copy as next-mdx-remote (the site's), not the desktop app's.
// @ts-expect-error -- untyped deep import on purpose (see above)
import { createElement } from "../../../node_modules/react";
// @ts-expect-error -- untyped deep import on purpose (see above)
import { renderToStaticMarkup } from "../../../node_modules/react-dom/server";
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

  it("renders an inserted image with its alt text", async () => {
    await openContentSession(repo).savePost(
      {
        ...draft,
        body: "Antes\n\n![Capa na mesa](/images/blog/post-de-teste/image-1.png)\n\nDepois",
      },
      author,
    );

    const full = getPostBySlug("post-de-teste", content());
    const html = renderToStaticMarkup(
      createElement(MDXRemote, { ...(await serialize(full!.content)) }),
    );

    expect(html).toContain('src="/images/blog/post-de-teste/image-1.png"');
    expect(html).toContain('alt="Capa na mesa"');
  });
});
