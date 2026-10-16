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

  describe("single-file content", () => {
    const contact = {
      instagram: "@a",
      instagramUrl: "https://i.com/a",
      email: "a@b.com",
    };

    it("refuses to read or save before a folder is opened", async () => {
      const workspace = createWorkspace(createIdentityStore(userData));

      expect(workspace.readSingle("contact")).toMatchObject({ ok: false });
      expect(await workspace.saveSingle("contact", contact)).toMatchObject({
        ok: false,
      });
    });

    it("saves and reads back, reporting what is missing", async () => {
      const store = createIdentityStore(userData);
      store.write({ name: "Amanda", email: "a@b.com" });
      const workspace = createWorkspace(store);
      workspace.open(repo);

      const saved = await workspace.saveSingle("contact", {
        ...contact,
        email: "",
      });

      expect(saved).toMatchObject({
        ok: true,
        missing: ["E-mail"],
        versionCreated: true,
      });
      expect(workspace.readSingle("contact")).toMatchObject({
        ok: true,
        values: { instagram: "@a", email: "" },
      });
    });

    it("rejects an unknown kind or malformed values from the renderer", async () => {
      const store = createIdentityStore(userData);
      store.write({ name: "Amanda", email: "a@b.com" });
      const workspace = createWorkspace(store);
      workspace.open(repo);

      expect(
        await workspace.saveSingle("blog" as never, contact),
      ).toMatchObject({ ok: false });
      expect(
        await workspace.saveSingle("contact", { email: 1 } as never),
      ).toMatchObject({ ok: false });
      expect(workspace.readSingle("nope" as never)).toMatchObject({
        ok: false,
      });
    });
  });
  describe("importCover", () => {
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );

    it("refuses before a folder is opened", async () => {
      const workspace = createWorkspace(createIdentityStore(userData));

      expect(
        await workspace.importCover({ bytes: png, slug: null, title: "A" }),
      ).toMatchObject({ ok: false });
    });

    it("returns the site path of the stored cover", async () => {
      const workspace = createWorkspace(createIdentityStore(userData));
      workspace.open(repo);

      const result = await workspace.importCover({
        bytes: png,
        slug: null,
        title: "Livro Novo",
      });

      expect(result).toEqual({
        ok: true,
        image: "/images/books/livro-novo/cover.png",
      });
      expect(workspace.covers()).toContain(
        "/images/books/livro-novo/cover.png",
      );
    });

    it("explains a file that is not an image instead of throwing", async () => {
      const workspace = createWorkspace(createIdentityStore(userData));
      workspace.open(repo);

      const result = await workspace.importCover({
        bytes: Buffer.from("texto"),
        slug: null,
        title: "A",
      });

      expect(result).toMatchObject({
        ok: false,
        error: expect.stringContaining("imagem"),
      });
    });

    it("rejects a malformed payload", async () => {
      const workspace = createWorkspace(createIdentityStore(userData));
      workspace.open(repo);

      expect(await workspace.importCover({ title: 1 } as never)).toMatchObject({
        ok: false,
      });
    });
  });
});
