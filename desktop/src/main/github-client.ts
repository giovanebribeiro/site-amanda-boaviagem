import type { DeviceCode, GitHubClient } from "./site-session";

const DEVICE_CODE_URL = "https://github.com/login/device/code";
const ACCESS_TOKEN_URL = "https://github.com/login/oauth/access_token";
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
const SCOPE = "repo";
const MS_PER_SECOND = 1000;
const SLOW_DOWN_STEP_SECONDS = 5;

export interface GitHubClientOptions {
  clientId: string;
  fetch: typeof fetch;
  sleep: (ms: number) => Promise<void>;
}

async function postForm(
  fetchFn: typeof fetch,
  url: string,
  fields: Record<string, string>,
): Promise<Record<string, unknown>> {
  const response = await fetchFn(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(fields).toString(),
  });
  const body: unknown = await response.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    throw new Error(`GitHub answered ${response.status} without a JSON body`);
  }
  return body as Record<string, unknown>;
}

/** Device-flow login. Errors carry GitHub's error code only, never response bodies (they may hold the token). */
export function createGitHubClient(options: GitHubClientOptions): GitHubClient {
  const { clientId, sleep } = options;

  return {
    async requestDeviceCode() {
      if (!clientId) throw new Error("GitHub client id is not configured");
      const body = await postForm(options.fetch, DEVICE_CODE_URL, {
        client_id: clientId,
        scope: SCOPE,
      });
      const { device_code, user_code, verification_uri, interval, expires_in } =
        body;
      if (
        typeof device_code !== "string" ||
        typeof user_code !== "string" ||
        typeof verification_uri !== "string" ||
        typeof interval !== "number" ||
        typeof expires_in !== "number"
      ) {
        throw new Error("Unexpected device code response");
      }
      return {
        deviceCode: device_code,
        userCode: user_code,
        verificationUri: verification_uri,
        intervalSeconds: interval,
        expiresInSeconds: expires_in,
      };
    },

    async pollAccessToken(code: DeviceCode) {
      let waitSeconds = code.intervalSeconds;
      for (;;) {
        await sleep(waitSeconds * MS_PER_SECOND);
        const body = await postForm(options.fetch, ACCESS_TOKEN_URL, {
          client_id: clientId,
          device_code: code.deviceCode,
          grant_type: DEVICE_GRANT,
        });
        if (typeof body.access_token === "string") return body.access_token;
        if (body.error === "authorization_pending") continue;
        if (body.error === "slow_down") {
          waitSeconds =
            typeof body.interval === "number"
              ? body.interval
              : waitSeconds + SLOW_DOWN_STEP_SECONDS;
          continue;
        }
        throw new Error(
          typeof body.error === "string" ? body.error : "unknown_error",
        );
      }
    },
  };
}
