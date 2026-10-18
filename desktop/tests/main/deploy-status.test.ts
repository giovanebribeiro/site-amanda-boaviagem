import { describe, expect, it, vi } from "vitest";
import { createDeployStatusClient } from "../../src/main/deploy-status";

const SHA = "a".repeat(40);
const TOKEN = "gho_secrettoken1234567890";

function runsResponse(runs: Array<Record<string, unknown>>, status = 200) {
  return vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ workflow_runs: runs }), { status }),
    );
}

const client = (fetchFn: typeof fetch, token: string | null = TOKEN) =>
  createDeployStatusClient({
    fetch: fetchFn,
    getToken: () => token,
    repo: "owner/site",
    workflowFile: "publish.yml",
  });

describe("deploy status", () => {
  it("asks for the runs of the sent commit, with the token", async () => {
    const fetchFn = runsResponse([]);

    await client(fetchFn).stateOf(SHA);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(
      `https://api.github.com/repos/owner/site/actions/workflows/publish.yml/runs?head_sha=${SHA}`,
    );
    expect(init.headers.authorization).toBe(`Bearer ${TOKEN}`);
  });

  it("is building while GitHub has not started the run yet", async () => {
    expect(await client(runsResponse([])).stateOf(SHA)).toBe("building");
  });

  it.each(["queued", "in_progress", "waiting"])(
    "is building while the run is %s",
    async (status) => {
      const runs = runsResponse([{ status, conclusion: null }]);
      expect(await client(runs).stateOf(SHA)).toBe("building");
    },
  );

  it("is live when the run completed successfully", async () => {
    const runs = runsResponse([{ status: "completed", conclusion: "success" }]);
    expect(await client(runs).stateOf(SHA)).toBe("live");
  });

  it.each(["failure", "cancelled", "timed_out"])(
    "is failed when the run ended as %s",
    async (conclusion) => {
      const runs = runsResponse([{ status: "completed", conclusion }]);
      expect(await client(runs).stateOf(SHA)).toBe("failed");
    },
  );

  it("rejects without a token, without calling GitHub", async () => {
    const fetchFn = runsResponse([]);
    await expect(client(fetchFn, null).stateOf(SHA)).rejects.toThrow();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("rejects when GitHub answers with an error, never echoing the body", async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(new Response(`bad ${TOKEN}`, { status: 401 }));
    const error = await client(fetchFn)
      .stateOf(SHA)
      .catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).not.toContain(TOKEN);
  });
});
