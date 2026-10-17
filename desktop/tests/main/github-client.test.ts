import { describe, expect, it, vi } from "vitest";
import { createGitHubClient } from "../../src/main/github-client";

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const DEVICE_RESPONSE = {
  device_code: "dev-123",
  user_code: "ABCD-1234",
  verification_uri: "https://github.com/login/device",
  interval: 5,
  expires_in: 900,
};

describe("github client (device flow)", () => {
  it("requests a device code for the app's client id", async () => {
    const fetchFn = vi.fn(async () => json(DEVICE_RESPONSE));
    const client = createGitHubClient({
      clientId: "client-1",
      fetch: fetchFn,
      sleep: async () => {},
    });

    const code = await client.requestDeviceCode();

    expect(code).toEqual({
      deviceCode: "dev-123",
      userCode: "ABCD-1234",
      verificationUri: "https://github.com/login/device",
      intervalSeconds: 5,
      expiresInSeconds: 900,
    });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://github.com/login/device/code");
    expect(String(init.body)).toContain("client_id=client-1");
    expect(String(init.body)).toContain("scope=repo");
  });

  it("refuses to start without a client id", async () => {
    const client = createGitHubClient({
      clientId: "",
      fetch: vi.fn(),
      sleep: async () => {},
    });

    await expect(client.requestDeviceCode()).rejects.toThrow(/client id/i);
  });

  it("waits while the author has not approved yet, then returns the token", async () => {
    const answers = [
      json({ error: "authorization_pending" }),
      json({ error: "slow_down", interval: 10 }),
      json({ access_token: "gho_abc", token_type: "bearer" }),
    ];
    const fetchFn = vi.fn(async () => answers.shift() as Response);
    const sleep = vi.fn(async (_ms: number) => {});
    const client = createGitHubClient({ clientId: "c", fetch: fetchFn, sleep });

    const token = await client.pollAccessToken({
      deviceCode: "dev-123",
      userCode: "X",
      verificationUri: "https://github.com/login/device",
      intervalSeconds: 5,
      expiresInSeconds: 900,
    });

    expect(token).toBe("gho_abc");
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([5000, 5000, 10000]);
  });

  it.each(["expired_token", "access_denied"])(
    "rejects when GitHub answers %s",
    async (error) => {
      const client = createGitHubClient({
        clientId: "c",
        fetch: vi.fn(async () => json({ error })),
        sleep: async () => {},
      });

      await expect(
        client.pollAccessToken({
          deviceCode: "d",
          userCode: "X",
          verificationUri: "https://github.com/login/device",
          intervalSeconds: 1,
          expiresInSeconds: 900,
        }),
      ).rejects.toThrow(error);
    },
  );
});
