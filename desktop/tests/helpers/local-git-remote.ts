import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { HttpClient } from "isomorphic-git";

const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: "Seed",
  GIT_AUTHOR_EMAIL: "seed@example.com",
  GIT_COMMITTER_NAME: "Seed",
  GIT_COMMITTER_EMAIL: "seed@example.com",
};

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    env: GIT_ENV,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const pktLine = (text: string): string =>
  (text.length + 4).toString(16).padStart(4, "0") + text;

const textBody = (bytes: Uint8Array): AsyncIterableIterator<Uint8Array> =>
  (async function* () {
    yield bytes;
  })();

async function collect(body: unknown): Promise<Buffer> {
  const chunks: Buffer[] = [];
  if (body) {
    for await (const chunk of body as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
  }
  return Buffer.concat(chunks);
}

export const REMOTE_URL = "https://remote.test/site.git";

/** Smart-HTTP stand-in: the real `git upload-pack` / `receive-pack` behind isomorphic-git's http plugin. */
export function createLocalRemoteHttp(
  bareDir: string,
  token: string,
): HttpClient {
  const expected = `Basic ${Buffer.from(`${token}:x-oauth-basic`).toString("base64")}`;

  return {
    async request({ url, method = "GET", headers = {}, body }) {
      const respond = (
        statusCode: number,
        contentType: string,
        payload: Uint8Array,
      ) => ({
        url,
        method,
        statusCode,
        statusMessage: statusCode === 200 ? "OK" : "Unauthorized",
        headers: {
          "content-type": contentType,
          ...(statusCode === 401
            ? { "www-authenticate": 'Basic realm="remote"' }
            : {}),
        },
        body: textBody(payload),
      });

      const authorization = Object.entries(headers).find(
        ([name]) => name.toLowerCase() === "authorization",
      )?.[1];
      if (authorization !== expected) {
        return respond(401, "text/plain", Buffer.from("unauthorized"));
      }

      const { pathname, searchParams } = new URL(url);
      const service = pathname.endsWith("git-receive-pack")
        ? "receive-pack"
        : "upload-pack";

      if (pathname.endsWith("/info/refs")) {
        const wanted = searchParams.get("service") ?? "git-upload-pack";
        const command = wanted.replace("git-", "");
        const advertised = spawnSync(
          "git",
          [command, "--stateless-rpc", "--advertise-refs", bareDir],
          { env: GIT_ENV },
        ).stdout;
        const head = Buffer.from(`${pktLine(`# service=${wanted}\n`)}0000`);
        return respond(
          200,
          `application/x-${wanted}-advertisement`,
          Buffer.concat([head, advertised]),
        );
      }

      const result = spawnSync("git", [service, "--stateless-rpc", bareDir], {
        env: GIT_ENV,
        input: await collect(body),
        maxBuffer: 1 << 28,
      });
      return respond(200, `application/x-git-${service}-result`, result.stdout);
    },
  };
}

/** An http client that behaves like a missing network connection. */
export const offlineHttp: HttpClient = {
  async request() {
    throw new TypeError("fetch failed");
  },
};

export interface LocalRemote {
  bareDir: string;
  http: HttpClient;
  /** Commits files straight onto the remote's master, as if someone else pushed. */
  pushFile(filepath: string, content: string, message?: string): void;
  cleanup(): void;
}

/** A bare repository seeded with one commit on master. */
export function createLocalRemote(
  token: string,
  seed: Record<string, string>,
): LocalRemote {
  const root = mkdtempSync(join(tmpdir(), "remote-"));
  const bareDir = join(root, "site.git");
  const seedDir = join(root, "seed");
  git(root, "init", "--bare", "-b", "master", bareDir);
  git(root, "clone", bareDir, seedDir);
  git(seedDir, "checkout", "-b", "master");

  const write = (filepath: string, content: string) => {
    mkdirSync(dirname(join(seedDir, filepath)), { recursive: true });
    writeFileSync(join(seedDir, filepath), content);
  };
  for (const [filepath, content] of Object.entries(seed)) {
    write(filepath, content);
  }
  git(seedDir, "add", "-A");
  git(seedDir, "commit", "-m", "seed");
  git(seedDir, "push", "origin", "master");

  return {
    bareDir,
    http: createLocalRemoteHttp(bareDir, token),
    pushFile(filepath, content, message = "remote change") {
      git(seedDir, "pull", "origin", "master");
      write(filepath, content);
      git(seedDir, "add", "-A");
      git(seedDir, "commit", "-m", message);
      git(seedDir, "push", "origin", "master");
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true });
    },
  };
}
