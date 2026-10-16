import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyDraft } from "../../src/common/book-draft";
import { createIdentityStore } from "../../src/main/identity-store";
import { createWorkspace } from "../../src/main/workspace";

describe("workspace", () => {
  let repo: string;
  let userData: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "ws-repo-"));
    userData = mkdtempSync(join(tmpdir(), "ws-user-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
  });
  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(userData, { recursive: true, force: true });
  });

  const draft = { ...emptyDraft(), title: "Livro" };

  it("refuses to save before a folder is opened", async () => {
    const workspace = createWorkspace(createIdentityStore(userData));

    expect(await workspace.saveBook(draft)).toMatchObject({ ok: false });
  });

  it("refuses to save before the author identifies themself", async () => {
    const workspace = createWorkspace(createIdentityStore(userData));
    workspace.open(repo);

    const result = await workspace.saveBook(draft);

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining("nome"),
    });
  });

  it("saves offline and returns the refreshed list with what is missing", async () => {
    const store = createIdentityStore(userData);
    store.write({ name: "Amanda", email: "a@b.com" });
    const workspace = createWorkspace(store);
    workspace.open(repo);

    const result = await workspace.saveBook(draft);

    expect(result).toMatchObject({
      ok: true,
      slug: "livro",
      versionCreated: true,
      books: [{ slug: "livro", status: "invalid" }],
    });
    expect(result.ok && result.missing).toContain("Capa");
  });

  it("rejects a malformed draft coming from the renderer", async () => {
    const store = createIdentityStore(userData);
    store.write({ name: "Amanda", email: "a@b.com" });
    const workspace = createWorkspace(store);
    workspace.open(repo);

    const result = await workspace.saveBook({ title: "x" } as never);

    expect(result).toMatchObject({ ok: false });
  });
});
