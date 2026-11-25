import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createIdentityStore } from "../../src/main/identity-store";

describe("identity store", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "identity-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("returns null before the first run", () => {
    expect(createIdentityStore(dir).read()).toBeNull();
  });

  it("persists a valid identity", () => {
    const store = createIdentityStore(dir);
    const result = store.write({ name: " Amanda ", email: "a@b.com" });

    expect(result).toEqual({
      ok: true,
      identity: { name: "Amanda", email: "a@b.com" },
    });
    expect(createIdentityStore(dir).read()).toEqual({
      name: "Amanda",
      email: "a@b.com",
    });
  });

  it("rejects an empty name or malformed email with a portuguese message", () => {
    const store = createIdentityStore(dir);
    expect(store.write({ name: "", email: "a@b.com" })).toMatchObject({
      ok: false,
    });
    expect(store.write({ name: "A", email: "nope" })).toMatchObject({
      ok: false,
      error: expect.stringContaining("e-mail"),
    });
    expect(store.read()).toBeNull();
  });

  it("rejects a non-string payload and names with line breaks", () => {
    const store = createIdentityStore(dir);
    expect(store.write({ name: 5, email: "a@b.com" } as never)).toMatchObject({
      ok: false,
    });
    expect(store.write({ name: "A\nB", email: "a@b.com" })).toMatchObject({
      ok: false,
    });
  });

  it("treats a corrupt file as not set up", () => {
    const store = createIdentityStore(dir);
    store.write({ name: "A", email: "a@b.com" });
    require("node:fs").writeFileSync(join(dir, "identity.json"), "{oops");

    expect(store.read()).toBeNull();
  });
});
