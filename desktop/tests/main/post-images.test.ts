import * as fs from "node:fs";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { Jimp } from "jimp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyPostDraft } from "../../src/common/post-draft";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };

async function png(width: number, height: number): Promise<Buffer> {
  return new Jimp({ width, height, color: 0xff0000ff }).getBuffer("image/png");
}

describe("ContentSession.importPostImage", () => {
  let repo: string;
  const imagesDir = (slug: string) =>
    join(repo, "public", "images", "blog", slug);

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "post-image-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "blog"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("stores the image in a folder per post and returns Markdown for it", async () => {
    const result = await openContentSession(repo).importPostImage({
      bytes: await png(300, 200),
      slug: null,
      title: "Meu Primeiro Post",
      alt: "Capa do livro sobre a mesa",
    });

    expect(result.path).toBe("/images/blog/meu-primeiro-post/image-1.png");
    expect(result.markdown).toBe(
      "![Capa do livro sobre a mesa](/images/blog/meu-primeiro-post/image-1.png)",
    );
    expect(existsSync(join(repo, "public", result.path))).toBe(true);
  });

  it("shrinks wide images to 1200px", async () => {
    const result = await openContentSession(repo).importPostImage({
      bytes: await png(2400, 1200),
      slug: "p",
      title: "",
      alt: "Foto larga",
    });

    const stored = await Jimp.read(
      readFileSync(join(repo, "public", result.path)),
    );
    expect(stored.bitmap.width).toBe(1200);
  });

  it("numbers a second image of the same post without overwriting the first", async () => {
    const session = openContentSession(repo);
    const input = {
      bytes: await png(50, 50),
      slug: "p",
      title: "",
      alt: "Uma",
    };

    const first = await session.importPostImage(input);
    const second = await session.importPostImage(input);

    expect(first.path).toBe("/images/blog/p/image-1.png");
    expect(second.path).toBe("/images/blog/p/image-2.png");
  });

  it.each(["", "   ", "\n"])(
    "rejects missing alt text %j and writes nothing",
    async (alt) => {
      await expect(
        openContentSession(repo).importPostImage({
          bytes: await png(50, 50),
          slug: "p",
          title: "",
          alt,
        }),
      ).rejects.toThrow(/texto alternativo|descreva/i);
      expect(existsSync(imagesDir("p"))).toBe(false);
    },
  );

  it("keeps brackets and line breaks in the alt text from breaking the Markdown", async () => {
    const result = await openContentSession(repo).importPostImage({
      bytes: await png(50, 50),
      slug: "p",
      title: "",
      alt: "Livro [novo]\ncom capa",
    });

    expect(result.markdown).toBe(
      "![Livro (novo) com capa](/images/blog/p/image-1.png)",
    );
  });

  it("drops backslashes from the alt text so the label cannot be broken", async () => {
    const result = await openContentSession(repo).importPostImage({
      bytes: await png(50, 50),
      slug: "p",
      title: "",
      alt: "foo\\",
    });

    expect(result.markdown).toBe("![foo](/images/blog/p/image-1.png)");
  });

  it("asks for a title when the post has no slug yet", async () => {
    await expect(
      openContentSession(repo).importPostImage({
        bytes: await png(50, 50),
        slug: null,
        title: "  ",
        alt: "x",
      }),
    ).rejects.toThrow(/título do post/i);
  });

  it("rejects a slug that could escape the images folder", async () => {
    await expect(
      openContentSession(repo).importPostImage({
        bytes: await png(50, 50),
        slug: "../evil",
        title: "",
        alt: "x",
      }),
    ).rejects.toThrow(/slug/i);
  });

  it("commits the images referenced by the post together with it", async () => {
    const session = openContentSession(repo);
    const image = await session.importPostImage({
      bytes: await png(50, 50),
      slug: null,
      title: "Post com imagem",
      alt: "Descrição",
    });

    const saved = await session.savePost(
      {
        ...emptyPostDraft(),
        title: "Post com imagem",
        date: "2024-03-01",
        excerpt: "r",
        body: `Antes\n\n${image.markdown}\n\nDepois`,
      },
      author,
    );

    expect(saved.slug).toBe("post-com-imagem");
    const files = await git.listFiles({ fs, dir: repo, ref: "HEAD" });
    expect(files).toContain("public/images/blog/post-com-imagem/image-1.png");
    expect(files).toContain("content/blog/post-com-imagem.mdx");
  });

  it("ignores references that point outside the post's image folder", async () => {
    mkdirSync(join(repo, "public", "images"), { recursive: true });
    writeFileSync(join(repo, "public", "images", "secret.png"), "x");

    await openContentSession(repo).savePost(
      {
        ...emptyPostDraft(),
        title: "P",
        body: "![a](/images/blog/../secret.png) ![b](/images/blog/other/x.png)",
      },
      author,
    );

    const files = await git.listFiles({ fs, dir: repo, ref: "HEAD" });
    expect(files).toEqual(["content/blog/p.mdx"]);
  });
});
