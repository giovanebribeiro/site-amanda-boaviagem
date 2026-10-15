import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openRepository } from "../../src/main/repository-service";

const created: string[] = [];

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  created.push(dir);
  return dir;
}

afterEach(() => {
  created
    .splice(0)
    .forEach((dir) => rmSync(dir, { recursive: true, force: true }));
});

describe("openRepository", () => {
  it("returns null when the picker was cancelled", () => {
    expect(openRepository(null)).toBeNull();
  });

  it("explains in portuguese when the folder is not the site", () => {
    const result = openRepository(tempDir("not-site-"));

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("não parece ser a pasta do site"),
    });
  });

  it("returns the books of a valid repository", () => {
    const repo = tempDir("site-");
    mkdirSync(join(repo, "content", "books"), { recursive: true });
    writeFileSync(
      join(repo, "content", "books", "a.md"),
      '---\ntitle: "A"\nreleaseDate: "2020-01-01"\nimage: "/a.png"\n---\ncorpo',
    );

    const result = openRepository(repo);

    expect(result).toMatchObject({ ok: true, books: [{ slug: "a" }] });
  });

  it("turns unexpected failures into a readable error instead of throwing", () => {
    const repo = tempDir("site-");
    mkdirSync(join(repo, "content"), { recursive: true });
    writeFileSync(
      join(repo, "content", "books"),
      "this is a file, not a folder",
    );

    const result = openRepository(repo);

    expect(result).toEqual({
      ok: false,
      error: expect.stringContaining("Não foi possível ler"),
    });
  });
});
