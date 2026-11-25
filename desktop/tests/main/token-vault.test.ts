import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createSafeStorageVault,
  type SafeStorageLike,
} from "../../src/main/token-vault";

const reversible: SafeStorageLike = {
  isEncryptionAvailable: () => true,
  encryptString: (text) => Buffer.from([...text].reverse().join("")),
  decryptString: (data) => [...data.toString()].reverse().join(""),
};

describe("token vault", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "vault-"));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("is empty before the first sign-in", () => {
    expect(createSafeStorageVault(dir, reversible).get()).toBeNull();
  });

  it("keeps the token across runs, encrypted on disk", () => {
    createSafeStorageVault(dir, reversible).set("gho_abc");

    expect(createSafeStorageVault(dir, reversible).get()).toBe("gho_abc");
    expect(
      readFileSync(join(dir, "github-token.bin")).toString(),
    ).not.toContain("gho_abc");
  });

  it("forgets the token on clear", () => {
    const vault = createSafeStorageVault(dir, reversible);
    vault.set("gho_abc");
    vault.clear();

    expect(createSafeStorageVault(dir, reversible).get()).toBeNull();
  });

  it("refuses to store the token in plain text when the system cannot encrypt", () => {
    const vault = createSafeStorageVault(dir, {
      ...reversible,
      isEncryptionAvailable: () => false,
    });

    expect(() => vault.set("gho_abc")).toThrow(/encryption/i);
    expect(vault.get()).toBeNull();
  });

  it("treats an unreadable file as signed out", () => {
    const vault = createSafeStorageVault(dir, {
      ...reversible,
      decryptString: () => {
        throw new Error("bad key");
      },
    });
    createSafeStorageVault(dir, reversible).set("gho_abc");

    expect(vault.get()).toBeNull();
  });
});
