import type { OpenRepositoryResult } from "../common/types";
import {
  NotASiteRepositoryError,
  openContentSession,
  type ContentSession,
} from "./content-session";

const NOT_A_SITE_MESSAGE =
  "Esta pasta não parece ser a pasta do site. Escolha outra.";
const UNREADABLE_MESSAGE =
  "Não foi possível ler esta pasta. Verifique se você tem acesso a ela e tente de novo.";

export interface OpenedRepository {
  result: OpenRepositoryResult;
  session: ContentSession | null;
}

/** Opens the chosen folder; returns null when the author cancelled the picker. */
export function openRepositoryWithSession(
  repoPath: string | null,
): OpenedRepository | null {
  if (repoPath === null) return null;
  try {
    const session = openContentSession(repoPath);
    return { result: { ok: true, books: session.listBooks() }, session };
  } catch (error) {
    if (error instanceof NotASiteRepositoryError) {
      return {
        result: { ok: false, error: NOT_A_SITE_MESSAGE },
        session: null,
      };
    }
    console.error("Failed to open repository", repoPath, error);
    return { result: { ok: false, error: UNREADABLE_MESSAGE }, session: null };
  }
}

export function openRepository(
  repoPath: string | null,
): OpenRepositoryResult | null {
  return openRepositoryWithSession(repoPath)?.result ?? null;
}
