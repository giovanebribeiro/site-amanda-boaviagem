import matter from "gray-matter";
import type { PostDraft } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
/** `<` and `{` start JSX/expressions in MDX; the author writes plain Markdown, so they are escaped. */
const MDX_SPECIAL = /(?<!\\)([<{])/g;

export function emptyPostDraft(): PostDraft {
  return {
    slug: null,
    title: "",
    date: "",
    excerpt: "",
    inPreparation: false,
    body: "",
  };
}

/** What still blocks the post from being complete, in the author's language. */
export function findMissingPost(draft: PostDraft): string[] {
  const missing: string[] = [];
  if (!draft.title.trim()) missing.push("Título");
  if (!ISO_DATE.test(draft.date)) {
    missing.push("Data (use o formato AAAA-MM-DD)");
  }
  if (!draft.excerpt.trim()) missing.push("Resumo");
  return missing;
}

const isString = (value: unknown): value is string => typeof value === "string";

/** Runtime check for payloads crossing the IPC boundary. */
export function isPostDraft(value: unknown): value is PostDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    (draft.slug === null || isString(draft.slug)) &&
    ["title", "date", "excerpt", "body"].every((key) => isString(draft[key])) &&
    typeof draft.inPreparation === "boolean" &&
    (draft.coverImage === undefined || isString(draft.coverImage))
  );
}

function toLf(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Post file source: frontmatter + Markdown body, always LF and MDX-safe. */
export function serializePost(draft: PostDraft): string {
  const data = {
    title: toLf(draft.title),
    date: draft.date,
    excerpt: toLf(draft.excerpt),
    ...(draft.coverImage ? { coverImage: draft.coverImage } : {}),
    ...(draft.inPreparation ? { inPreparation: true } : {}),
  };
  const body = toLf(draft.body).replace(MDX_SPECIAL, "\\$1").trim();
  return toLf(matter.stringify(`${body}\n`, data));
}
