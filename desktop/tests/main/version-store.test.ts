import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  PendingChangesError,
  UnknownVersionError,
  listVersions,
  restoreVersion,
  saveVersion,
} from "../../src/main/version-store";

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

describe("listVersions and restoreVersion", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "history-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
    mkdirSync(join(repo, "public", "images"), { recursive: true });
  });

  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const write = (file: string, text: string) =>
    writeFileSync(join(repo, file), text);
  const read = (file: string) => fs.readFileSync(join(repo, file), "utf8");
  const save = (files: string[], message: string) =>
    saveVersion({ repoPath: repo, filepaths: files, message, author });

  it("lists versions newest first with date and description", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "chore(content): atualizar livro A");
    write("content/books/a.md", "2\n");
    await save(["content/books/a.md"], "chore(content): atualizar livro A v2");

    const versions = await listVersions(repo);

    expect(versions.map((v) => v.description)).toEqual([
      "atualizar livro A v2",
      "atualizar livro A",
    ]);
    expect(versions[0].id).toMatch(/^[0-9a-f]{40}$/);
    expect(new Date(versions[0].date).getTime()).not.toBeNaN();
  });

  it("returns no versions for a repository without commits", async () => {
    expect(await listVersions(repo)).toEqual([]);
  });

  it("restores old content as a new version without rewriting history", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "m1");
    const [first] = await listVersions(repo);
    write("content/books/a.md", "2\n");
    await save(["content/books/a.md"], "m2");

    const created = await restoreVersion({
      repoPath: repo,
      versionId: first.id,
      author,
    });

    expect(created).toBe(true);
    expect(read("content/books/a.md")).toBe("1\n");
    const messages = (await listVersions(repo)).map((v) => v.description);
    expect(messages).toHaveLength(3);
    expect(messages[0]).toContain("voltar");
    expect(messages.slice(1)).toEqual(["m2", "m1"]);
  });

  it("removes files that did not exist in that version and brings back deleted ones", async () => {
    write("content/books/a.md", "a\n");
    await save(["content/books/a.md"], "m1");
    const [first] = await listVersions(repo);
    write("content/books/b.md", "b\n");
    write("public/images/cover.png", "png");
    await save(["content/books/b.md", "public/images/cover.png"], "m2");
    fs.rmSync(join(repo, "content/books/a.md"));
    await git.remove({ fs, dir: repo, filepath: "content/books/a.md" });
    await git.commit({ fs, dir: repo, message: "m3", author });

    await restoreVersion({ repoPath: repo, versionId: first.id, author });

    expect(read("content/books/a.md")).toBe("a\n");
    expect(fs.existsSync(join(repo, "content/books/b.md"))).toBe(false);
    expect(fs.existsSync(join(repo, "public/images/cover.png"))).toBe(false);
    expect(await git.listFiles({ fs, dir: repo, ref: "HEAD" })).toEqual([
      "content/books/a.md",
    ]);
  });

  it("creates nothing when the content already matches that version", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "m1");
    const [only] = await listVersions(repo);

    expect(
      await restoreVersion({ repoPath: repo, versionId: only.id, author }),
    ).toBe(false);
    expect(await listVersions(repo)).toHaveLength(1);
  });

  it("rejects an id that is not a saved version", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "m1");

    await expect(
      restoreVersion({ repoPath: repo, versionId: "f".repeat(40), author }),
    ).rejects.toThrow(UnknownVersionError);
  });

  it("refuses to restore over unsaved edits to tracked content", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "m1");
    const [first] = await listVersions(repo);
    write("content/books/a.md", "2\n");
    await save(["content/books/a.md"], "m2");
    write("content/books/a.md", "unsaved edit\n");

    await expect(
      restoreVersion({ repoPath: repo, versionId: first.id, author }),
    ).rejects.toThrow(PendingChangesError);
    expect(read("content/books/a.md")).toBe("unsaved edit\n");
    expect(await listVersions(repo)).toHaveLength(2);
  });

  it("ignores untracked leftovers such as an abandoned image import", async () => {
    write("content/books/a.md", "1\n");
    await save(["content/books/a.md"], "m1");
    const [first] = await listVersions(repo);
    write("content/books/a.md", "2\n");
    await save(["content/books/a.md"], "m2");
    write("public/images/orphan.png", "png");

    await expect(
      restoreVersion({ repoPath: repo, versionId: first.id, author }),
    ).resolves.toBe(true);
  });
});
