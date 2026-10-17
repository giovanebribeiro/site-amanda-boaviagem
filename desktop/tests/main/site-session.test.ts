import * as fs from "node:fs";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSiteSession,
  type GitHubClient,
  type TokenVault,
} from "../../src/main/site-session";
import {
  REMOTE_URL,
  createLocalRemote,
  offlineHttp,
  type LocalRemote,
} from "../helpers/local-git-remote";

const TOKEN = "gho_secrettoken1234567890";
const BOOK = "content/books/a.md";
const author = { name: "Amanda", email: "amanda@example.com" };

function memoryVault(initial: string | null = null): TokenVault {
  let token = initial;
  return {
    get: () => token,
    set: (value) => {
      token = value;
    },
    clear: () => {
      token = null;
    },
  };
}

function fakeGitHub(overrides: Partial<GitHubClient> = {}): GitHubClient {
  return {
    requestDeviceCode: async () => ({
      deviceCode: "device-code",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      intervalSeconds: 5,
      expiresInSeconds: 900,
    }),
    pollAccessToken: async () => TOKEN,
    ...overrides,
  };
}

describe("site session", () => {
  let remote: LocalRemote;
  let workDir: string;
  let cloneDir: string;

  beforeEach(() => {
    remote = createLocalRemote(TOKEN, { [BOOK]: "versao 1\n" });
    workDir = mkdtempSync(join(tmpdir(), "site-session-"));
    cloneDir = join(workDir, "site");
  });
  afterEach(() => {
    remote.cleanup();
    rmSync(workDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  const session = (
    overrides: {
      vault?: TokenVault;
      github?: GitHubClient;
      http?: typeof remote.http;
    } = {},
  ) =>
    createSiteSession({
      github: overrides.github ?? fakeGitHub(),
      vault: overrides.vault ?? memoryVault(TOKEN),
      http: overrides.http ?? remote.http,
      remoteUrl: REMOTE_URL,
      cloneDir,
    });

  const read = () => readFileSync(join(cloneDir, BOOK), "utf8");

  describe("signing in", () => {
    it("shows the code, then keeps the token in the vault", async () => {
      const vault = memoryVault();
      const prompts: unknown[] = [];

      const result = await session({ vault }).signIn((prompt) =>
        prompts.push(prompt),
      );

      expect(result).toEqual({ ok: true });
      expect(prompts).toEqual([
        {
          userCode: "ABCD-1234",
          verificationUri: "https://github.com/login/device",
        },
      ]);
      expect(vault.get()).toBe(TOKEN);
    });

    it("reports signed in only when the vault holds a token", () => {
      expect(session({ vault: memoryVault() }).isSignedIn()).toBe(false);
      expect(session({ vault: memoryVault(TOKEN) }).isSignedIn()).toBe(true);
    });

    it("explains a refused or expired sign-in and stores nothing", async () => {
      const vault = memoryVault();
      const github = fakeGitHub({
        pollAccessToken: async () => {
          throw new Error("expired_token");
        },
      });
      vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await session({ vault, github }).signIn(() => {});

      expect(result).toMatchObject({
        ok: false,
        error: expect.stringContaining("Tente de novo"),
      });
      expect(vault.get()).toBeNull();
    });
  });

  describe("opening the site", () => {
    it("asks to sign in when there is no token", async () => {
      const result = await session({ vault: memoryVault() }).open();

      expect(result).toMatchObject({ ok: false, needsSignIn: true });
      expect(existsSync(cloneDir)).toBe(false);
    });

    it("clones the site on the first open, using the token", async () => {
      const result = await session().open();

      expect(result).toEqual({ ok: true, path: cloneDir, update: "cloned" });
      expect(read()).toBe("versao 1\n");
    });

    it("updates silently when the site changed and there is no Rascunho", async () => {
      await session().open();
      remote.pushFile(BOOK, "versao 2\n");

      const result = await session().open();

      expect(result).toMatchObject({ ok: true, update: "updated" });
      expect(read()).toBe("versao 2\n");
    });

    it("reports up to date when nothing changed", async () => {
      await session().open();

      expect(await session().open()).toMatchObject({
        ok: true,
        update: "up-to-date",
      });
    });

    it("does not update while a Rascunho is pending", async () => {
      await session().open();
      writeFileSync(join(cloneDir, BOOK), "rascunho\n");
      remote.pushFile("content/books/b.md", "outro livro\n");

      const result = await session().open();

      expect(result).toMatchObject({ ok: true, update: "kept-draft" });
      expect(read()).toBe("rascunho\n");
      expect(existsSync(join(cloneDir, "content/books/b.md"))).toBe(false);
    });

    it("opens the local clone without internet", async () => {
      await session().open();

      const result = await session({ http: offlineHttp }).open();

      expect(result).toEqual({ ok: true, path: cloneDir, update: "offline" });
      expect(read()).toBe("versao 1\n");
    });

    it("explains the need for internet on the very first open", async () => {
      const result = await session({ http: offlineHttp }).open();

      expect(result).toMatchObject({
        ok: false,
        needsSignIn: false,
        error: expect.stringContaining("internet"),
      });
      expect(existsSync(cloneDir)).toBe(false);
    });

    it("leaves versions saved here alone when the site did not change", async () => {
      await session().open();
      writeFileSync(join(cloneDir, BOOK), "salvo aqui\n");
      await git.add({ fs, dir: cloneDir, filepath: BOOK });
      await git.commit({ fs, dir: cloneDir, message: "local", author });

      const result = await session().open();

      expect(result).toMatchObject({ ok: true, update: "up-to-date" });
      expect(read()).toBe("salvo aqui\n");
    });

    it("keeps local versions when both sides changed (left for the publish step)", async () => {
      await session().open();
      writeFileSync(join(cloneDir, BOOK), "salvo aqui\n");
      await git.add({ fs, dir: cloneDir, filepath: BOOK });
      await git.commit({ fs, dir: cloneDir, message: "local", author });
      remote.pushFile("content/books/b.md", "outro livro\n");

      const result = await session().open();

      expect(result).toMatchObject({ ok: true, update: "diverged" });
      expect(read()).toBe("salvo aqui\n");
    });

    it("asks to sign in again when the saved token no longer works", async () => {
      const vault = memoryVault("gho_revoked");
      vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await session({ vault }).open();

      expect(result).toMatchObject({ ok: false, needsSignIn: true });
      expect(vault.get()).toBeNull();
      expect(existsSync(cloneDir)).toBe(false);
    });

    it("never writes the token to the logs", async () => {
      const spies = [
        vi.spyOn(console, "log").mockImplementation(() => {}),
        vi.spyOn(console, "error").mockImplementation(() => {}),
        vi.spyOn(console, "warn").mockImplementation(() => {}),
      ];

      await session({ vault: memoryVault("gho_revoked") }).open();
      await session({ http: offlineHttp }).open();
      await session().signIn(() => {});
      await session().open();
      await session({ http: offlineHttp }).open();

      const logged = JSON.stringify(spies.flatMap((spy) => spy.mock.calls));
      expect(logged).not.toContain(TOKEN);
      expect(logged).not.toContain("gho_revoked");
    });
  });
});
