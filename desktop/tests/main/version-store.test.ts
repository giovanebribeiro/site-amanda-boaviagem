import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { saveVersion } from "../../src/main/version-store";

const author = { name: "Amanda", email: "amanda@example.com" };

describe("saveVersion", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "version-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
  });

  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const log = () => git.log({ fs, dir: repo });

  it("commits the file with the author identity", async () => {
    writeFileSync(join(repo, "content/books/a.md"), "x\n");

    const created = await saveVersion({
      repoPath: repo,
      filepaths: ["content/books/a.md"],
      message: "chore(content): atualizar livro A",
      author,
    });

    const [entry] = await log();
    expect(created).toBe(true);
    expect(entry.commit.message).toContain("atualizar livro A");
    expect(entry.commit.author).toMatchObject(author);
  });

  it("does not create a version when nothing changed", async () => {
    writeFileSync(join(repo, "content/books/a.md"), "x\n");
    const input = {
      repoPath: repo,
      filepaths: ["content/books/a.md"],
      message: "m",
      author,
    };
    await saveVersion(input);

    expect(await saveVersion(input)).toBe(false);
    expect(await log()).toHaveLength(1);
  });

  it("creates a new version when the file changes", async () => {
    const input = {
      repoPath: repo,
      filepaths: ["content/books/a.md"],
      message: "m",
      author,
    };
    writeFileSync(join(repo, "content/books/a.md"), "x\n");
    await saveVersion(input);
    writeFileSync(join(repo, "content/books/a.md"), "y\n");

    expect(await saveVersion(input)).toBe(true);
    expect(await log()).toHaveLength(2);
  });
});
