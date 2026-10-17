import * as fs from "node:fs";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import git, { type HttpClient } from "isomorphic-git";
import type {
  DeviceCodePrompt,
  SignInResult,
  SiteUpdate,
} from "../common/types";
import { hasPendingChanges } from "./version-store";

const BRANCH = "master";
const PASSWORD_PLACEHOLDER = "x-oauth-basic";

const SIGN_IN_FAILED_MESSAGE =
  "Não foi possível entrar no GitHub. Tente de novo.";
const NEEDS_INTERNET_MESSAGE =
  "Não foi possível baixar o site. Conecte-se à internet e tente de novo.";
const TOKEN_REJECTED_MESSAGE =
  "Seu acesso ao GitHub não está mais valendo. Entre de novo.";
const NOT_SIGNED_IN_MESSAGE = "Entre com a sua conta do GitHub para continuar.";

export interface DeviceCode extends DeviceCodePrompt {
  deviceCode: string;
  intervalSeconds: number;
  expiresInSeconds: number;
}

/** The only door to GitHub's login: everything else about GitHub goes through git over HTTP. */
export interface GitHubClient {
  requestDeviceCode(): Promise<DeviceCode>;
  /** Resolves with the access token once the author approved; rejects when denied or expired. */
  pollAccessToken(code: DeviceCode): Promise<string>;
}

/** Where the access token rests between runs (the Windows vault in production). */
export interface TokenVault {
  get(): string | null;
  set(token: string): void;
  clear(): void;
}

export interface SiteSessionOptions {
  github: GitHubClient;
  vault: TokenVault;
  http: HttpClient;
  remoteUrl: string;
  cloneDir: string;
}

export type SiteOpenOutcome =
  | { ok: true; path: string; update: SiteUpdate }
  | { ok: false; error: string; needsSignIn: boolean };

export interface SiteSession {
  isSignedIn(): boolean;
  signIn(onPrompt: (prompt: DeviceCodePrompt) => void): Promise<SignInResult>;
  /** Clones on the first run; afterwards refreshes silently unless a Rascunho is pending. */
  open(): Promise<SiteOpenOutcome>;
}

class TokenRejectedError extends Error {
  constructor() {
    super("GitHub rejected the saved access");
    this.name = "TokenRejectedError";
  }
}

function isAuthFailure(error: unknown): boolean {
  if (error instanceof git.Errors.UserCanceledError) return true;
  if (error instanceof git.Errors.HttpError) {
    const status = (error.data as { statusCode?: number } | undefined)
      ?.statusCode;
    return status === 401 || status === 403;
  }
  return false;
}

/** Logs the failure kind only: error text from the transport could echo credentials. */
function describeForLog(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}

export function createSiteSession(options: SiteSessionOptions): SiteSession {
  const { github, vault, http, remoteUrl, cloneDir } = options;

  const authFor = (token: string) => ({
    onAuth: () => ({ username: token, password: PASSWORD_PLACEHOLDER }),
    onAuthFailure: () => ({ cancel: true }),
  });

  const headOid = (): Promise<string> =>
    git.resolveRef({ fs, dir: cloneDir, ref: "HEAD" });

  async function clone(token: string): Promise<void> {
    try {
      await git.clone({
        fs,
        http,
        dir: cloneDir,
        url: remoteUrl,
        ref: BRANCH,
        singleBranch: true,
        ...authFor(token),
      });
    } catch (error) {
      rmSync(cloneDir, { recursive: true, force: true });
      throw isAuthFailure(error) ? new TokenRejectedError() : error;
    }
  }

  async function refresh(token: string): Promise<SiteUpdate> {
    if (await hasPendingChanges(cloneDir)) return "kept-draft";
    const before = await headOid();
    try {
      await git.fastForward({
        fs,
        http,
        dir: cloneDir,
        ref: BRANCH,
        singleBranch: true,
        ...authFor(token),
      });
    } catch (error) {
      if (isAuthFailure(error)) throw new TokenRejectedError();
      if (error instanceof git.Errors.FastForwardError) return "diverged";
      console.error("Site refresh failed", describeForLog(error));
      return "offline";
    }
    return (await headOid()) === before ? "up-to-date" : "updated";
  }

  return {
    isSignedIn: () => vault.get() !== null,

    async signIn(onPrompt) {
      try {
        const code = await github.requestDeviceCode();
        onPrompt({
          userCode: code.userCode,
          verificationUri: code.verificationUri,
        });
        vault.set(await github.pollAccessToken(code));
        return { ok: true };
      } catch (error) {
        console.error("GitHub sign-in failed", describeForLog(error));
        return { ok: false, error: SIGN_IN_FAILED_MESSAGE };
      }
    },

    async open() {
      const token = vault.get();
      if (token === null) {
        return { ok: false, error: NOT_SIGNED_IN_MESSAGE, needsSignIn: true };
      }
      try {
        if (!existsSync(join(cloneDir, ".git"))) {
          await clone(token);
          return { ok: true, path: cloneDir, update: "cloned" };
        }
        return { ok: true, path: cloneDir, update: await refresh(token) };
      } catch (error) {
        if (error instanceof TokenRejectedError) {
          vault.clear();
          return {
            ok: false,
            error: TOKEN_REJECTED_MESSAGE,
            needsSignIn: true,
          };
        }
        console.error("Failed to open the site", describeForLog(error));
        return { ok: false, error: NEEDS_INTERNET_MESSAGE, needsSignIn: false };
      }
    },
  };
}
