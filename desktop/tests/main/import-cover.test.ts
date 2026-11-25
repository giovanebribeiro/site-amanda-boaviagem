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
import matter from "gray-matter";
import { Jimp } from "jimp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyDraft } from "../../src/common/book-draft";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };

async function noisyPng(width: number, height: number): Promise<Buffer> {
  const image = new Jimp({ width, height, color: 0xffffffff });
  // Pseudo-random pixels so the PNG does not compress to nothing.
  let seed = 7;
  for (let i = 0; i < image.bitmap.data.length; i += 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    image.bitmap.data[i] = seed & 0xff;
  }
  return image.getBuffer("image/png");
}

describe("ContentSession.importCover", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "cover-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
    mkdirSync(join(repo, "public", "images", "books"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  it("shrinks a wide image to 1200px and stores it in a folder per book", async () => {
    const source = await noisyPng(2400, 1600);

    const result = await openContentSession(repo).importCover({
      bytes: source,
      slug: null,
      title: "Meu Livro Novo",
    });

    expect(result.image).toBe("/images/books/meu-livro-novo/cover.png");
    const stored = await Jimp.read(
      readFileSync(join(repo, "public", result.image)),
    );
    expect(stored.bitmap.width).toBe(1200);
    expect(stored.bitmap.height).toBe(800);
  });

  it("does not enlarge a small image", async () => {
    const result = await openContentSession(repo).importCover({
      bytes: await noisyPng(300, 400),
      slug: "x",
      title: "",
    });

    const stored = await Jimp.read(
      readFileSync(join(repo, "public", result.image)),
    );
    expect(stored.bitmap.width).toBe(300);
    expect(result.warning).toBeUndefined();
  });

  it("warns when the stored image is still above ~500 KB", async () => {
    const result = await openContentSession(repo).importCover({
      bytes: await noisyPng(1200, 1200),
      slug: "x",
      title: "",
    });

    expect(result.warning).toMatch(/KB|MB/);
    expect(existsSync(join(repo, "public", result.image))).toBe(true);
  });

  it("uses the existing slug for the folder, not the title", async () => {
    const result = await openContentSession(repo).importCover({
      bytes: await noisyPng(100, 100),
      slug: "livro-antigo",
      title: "Título Renomeado",
    });

    expect(result.image).toBe("/images/books/livro-antigo/cover.png");
  });

  it("rejects bytes that are not an image, writing nothing", async () => {
    await expect(
      openContentSession(repo).importCover({
        bytes: Buffer.from("not an image"),
        slug: "x",
        title: "",
      }),
    ).rejects.toThrow();
    expect(existsSync(join(repo, "public", "images", "books", "x"))).toBe(
      false,
    );
  });

  it("refuses to import without a slug or a title", async () => {
    await expect(
      openContentSession(repo).importCover({
        bytes: await noisyPng(10, 10),
        slug: null,
        title: "  ",
      }),
    ).rejects.toThrow(/título/i);
  });

  it("leaves legacy images untouched and lists the new cover", async () => {
    const legacy = join(repo, "public", "images", "books", "book1.png");
    const legacyBytes = await noisyPng(50, 50);
    writeFileSync(legacy, legacyBytes);
    const session = openContentSession(repo);

    const { image } = await session.importCover({
      bytes: await noisyPng(50, 50),
      slug: "novo",
      title: "",
    });

    expect(readFileSync(legacy).equals(legacyBytes)).toBe(true);
    expect(session.listCovers()).toEqual(["/images/books/book1.png", image]);
  });

  it("commits the imported cover together with the book", async () => {
    const session = openContentSession(repo);
    const { image } = await session.importCover({
      bytes: await noisyPng(50, 50),
      slug: "novo",
      title: "",
    });

    await session.saveBook(
      {
        ...emptyDraft(),
        slug: "novo",
        title: "Novo",
        releaseDate: "2024-01-01",
        image,
      },
      author,
    );

    const files = await git.listFiles({ fs, dir: repo, ref: "HEAD" });
    expect(files).toContain("public/images/books/novo/cover.png");
    expect(files).toContain("content/books/novo.md");
  });
  it("outputs fewer bytes than the original for a large image", async () => {
    const source = await noisyPng(2400, 1600);

    const { image } = await openContentSession(repo).importCover({
      bytes: source,
      slug: "x",
      title: "",
    });

    expect(readFileSync(join(repo, "public", image)).byteLength).toBeLessThan(
      source.byteLength,
    );
  });

  it("stores a JPEG input as .jpg", async () => {
    const jpeg = await new Jimp({
      width: 1600,
      height: 900,
      color: 0x336699ff,
    }).getBuffer("image/jpeg");

    const { image } = await openContentSession(repo).importCover({
      bytes: jpeg,
      slug: "x",
      title: "",
    });

    expect(image).toBe("/images/books/x/cover.jpg");
    const stored = await Jimp.read(readFileSync(join(repo, "public", image)));
    expect(stored.bitmap.width).toBe(1200);
  });

  it("keeps the previous cover when a re-import has another format", async () => {
    const session = openContentSession(repo);
    const first = await session.importCover({
      bytes: await noisyPng(50, 50),
      slug: "x",
      title: "",
    });
    const jpeg = await new Jimp({
      width: 50,
      height: 50,
      color: 0xff0000ff,
    }).getBuffer("image/jpeg");

    const second = await session.importCover({
      bytes: jpeg,
      slug: "x",
      title: "",
    });

    expect(second.image).toBe("/images/books/x/cover.jpg");
    expect(existsSync(join(repo, "public", first.image))).toBe(true);
  });

  it("points the saved book file at the imported cover", async () => {
    const session = openContentSession(repo);
    const { image } = await session.importCover({
      bytes: await noisyPng(50, 50),
      slug: null,
      title: "Novo",
    });

    const { slug } = await session.saveBook(
      { ...emptyDraft(), title: "Novo", releaseDate: "2024-01-01", image },
      author,
    );

    const { data } = matter(
      readFileSync(join(repo, "content", "books", `${slug}.md`), "utf8"),
    );
    expect(data.image).toBe(image);
  });

  it("does not stage files outside the covers folder referenced by the draft", async () => {
    writeFileSync(join(repo, "secret.txt"), "x");

    await openContentSession(repo).saveBook(
      {
        ...emptyDraft(),
        title: "Novo",
        releaseDate: "2024-01-01",
        image: "/images/books/../../../secret.txt",
      },
      author,
    );

    const files = await git.listFiles({ fs, dir: repo, ref: "HEAD" });
    expect(files).not.toContain("secret.txt");
  });
});
