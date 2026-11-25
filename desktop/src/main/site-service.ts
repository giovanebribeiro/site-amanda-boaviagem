import type { OpenRepositoryResult, OpenSiteResult } from "../common/types";
import type { SiteSession } from "./site-session";

/** Syncs the local copy of the site, then opens it for editing. */
export async function openSyncedSite(
  site: SiteSession,
  openFolder: (path: string) => OpenRepositoryResult | null,
): Promise<OpenSiteResult> {
  const synced = await site.open();
  if (!synced.ok) return synced;
  const opened = openFolder(synced.path);
  if (opened === null || !opened.ok) {
    return {
      ok: false,
      error: opened?.error ?? "Não foi possível abrir o site.",
      needsSignIn: false,
    };
  }
  return { ok: true, update: synced.update, books: opened.books };
}
