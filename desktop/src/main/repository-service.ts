import type { OpenRepositoryResult } from "../common/types";
import { NotASiteRepositoryError, openContentSession } from "./content-session";

const NOT_A_SITE_MESSAGE =
  "Esta pasta não parece ser a pasta do site. Escolha outra.";
const UNREADABLE_MESSAGE =
  "Não foi possível ler esta pasta. Verifique se você tem acesso a ela e tente de novo.";

/** Opens the chosen folder; returns null when the author cancelled the picker. */
export function openRepository(
  repoPath: string | null,
): OpenRepositoryResult | null {
  if (repoPath === null) return null;
  try {
    return { ok: true, books: openContentSession(repoPath).listBooks() };
  } catch (error) {
    if (error instanceof NotASiteRepositoryError) {
      return { ok: false, error: NOT_A_SITE_MESSAGE };
    }
    console.error("Failed to open repository", repoPath, error);
    return { ok: false, error: UNREADABLE_MESSAGE };
  }
}
