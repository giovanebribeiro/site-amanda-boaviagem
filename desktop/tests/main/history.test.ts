import * as fs from "node:fs";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { emptyDraft } from "../../src/common/book-draft";
import { createIdentityStore } from "../../src/main/identity-store";
import { createWorkspace } from "../../src/main/workspace";

describe("workspace history", () => {
  let repo: string;
  let userData: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "hist-repo-"));
    userData = mkdtempSync(join(tmpdir(), "hist-user-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content", "books"), { recursive: true });
  });
  afterEach(() => {
    rmSync(repo, { recursive: true, force: true });
    rmSync(userData, { recursive: true, force: true });
  });

  const draft = { ...emptyDraft(), title: "Livro" };

  function identified() {
    const store = createIdentityStore(userData);
    store.write({ name: "Amanda", email: "a@b.com" });
    return createWorkspace(store);
  }

  it("refuses before a folder is opened", async () => {
    const workspace = createWorkspace(createIdentityStore(userData));

    expect(await workspace.listVersions()).toMatchObject({ ok: false });
    expect(await workspace.restoreVersion("a".repeat(40))).toMatchObject({
      ok: false,
    });
  });

  it("lists the versions created by saving", async () => {
    const workspace = identified();
    workspace.open(repo);
    await workspace.saveBook(draft);

    const result = await workspace.listVersions();

    expect(result).toMatchObject({
      ok: true,
      versions: [{ description: 'atualizar livro "Livro"' }],
    });
  });

  it("goes back to a version and returns the refreshed content", async () => {
    const workspace = identified();
    workspace.open(repo);
    await workspace.saveBook({ ...draft, slogan: "antes" });
    const listed = await workspace.listVersions();
    const first = listed.ok ? listed.versions[0] : null;
    await workspace.saveBook({ ...draft, slug: "livro", slogan: "depois" });

    const result = await workspace.restoreVersion(first!.id);

    expect(result).toMatchObject({
      ok: true,
      versionCreated: true,
      books: [{ slug: "livro", status: "invalid", draft: { slogan: "antes" } }],
    });
    expect(result.ok && result.versions).toHaveLength(3);
    expect(result.ok && result.posts).toEqual([]);
  });

  it("requires the author identity to go back", async () => {
    const workspace = createWorkspace(createIdentityStore(userData));
    workspace.open(repo);

    expect(await workspace.restoreVersion("a".repeat(40))).toMatchObject({
      ok: false,
      error: expect.stringContaining("nome"),
    });
  });

  it("rejects malformed or unknown version ids from the renderer", async () => {
    const workspace = identified();
    workspace.open(repo);
    await workspace.saveBook(draft);

    expect(await workspace.restoreVersion("HEAD~1")).toMatchObject({
      ok: false,
    });
    expect(await workspace.restoreVersion({} as never)).toMatchObject({
      ok: false,
    });
    expect(await workspace.restoreVersion("a".repeat(40))).toMatchObject({
      ok: false,
    });
  });
});
