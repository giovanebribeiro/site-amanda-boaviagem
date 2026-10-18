import type { DeployState } from "../common/types";

const API_ROOT = "https://api.github.com";

export interface DeployStatusOptions {
  fetch: typeof fetch;
  getToken: () => string | null;
  /** "owner/name" of the site repository. */
  repo: string;
  workflowFile: string;
}

export interface DeployStatusClient {
  /** Where the workflow run for a sent commit stands. Rejects when GitHub cannot be asked. */
  stateOf(sha: string): Promise<DeployState>;
}

interface WorkflowRun {
  status?: unknown;
  conclusion?: unknown;
}

function stateOfRun(run: WorkflowRun): DeployState {
  if (run.status !== "completed") return "building";
  return run.conclusion === "success" ? "live" : "failed";
}

/** Errors carry the HTTP status only, never the response body. */
export function createDeployStatusClient(
  options: DeployStatusOptions,
): DeployStatusClient {
  const { repo, workflowFile } = options;

  return {
    async stateOf(sha) {
      const token = options.getToken();
      if (token === null) throw new Error("Not signed in");
      const url = `${API_ROOT}/repos/${repo}/actions/workflows/${workflowFile}/runs?head_sha=${encodeURIComponent(sha)}`;
      const response = await options.fetch(url, {
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`GitHub answered ${response.status}`);
      }
      const body: unknown = await response.json().catch(() => null);
      const runs = (body as { workflow_runs?: unknown } | null)?.workflow_runs;
      if (!Array.isArray(runs)) throw new Error("Unexpected workflow runs");
      // No run yet: GitHub takes a moment to start the workflow after a push.
      if (runs.length === 0) return "building";
      return stateOfRun(runs[0] as WorkflowRun);
    },
  };
}
