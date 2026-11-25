import matter from "gray-matter";
import type { PostDraft, PostImageImportInput } from "./types";

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

const POST_IMAGES_URL_PREFIX = "/images/blog";
const POST_IMAGE_REFERENCE = /!\[[^\]]*\]\((\/images\/blog\/[^)\s]+)\)/g;
const SAFE_POST_IMAGE_URL =
  /^\/images\/blog\/[a-z0-9]+(-[a-z0-9]+)*\/[A-Za-z0-9._-]+$/;

/** Alt text on one line, without characters that would end the Markdown label. */
export function sanitizeAlt(alt: string): string {
  return alt
    .replace(/\s+/g, " ")
    .replace(/\\/g, "")
    .replace(/\[/g, "(")
    .replace(/\]/g, ")")
    .trim();
}

export function postImageMarkdown(alt: string, sitePath: string): string {
  return `![${sanitizeAlt(alt)}](${sitePath})`;
}

export function postImageSitePath(slug: string, fileName: string): string {
  return `${POST_IMAGES_URL_PREFIX}/${slug}/${fileName}`;
}

/** Repo-relative paths of the images a post body references inside its own image folders. */
export function postImageRepoPaths(body: string): string[] {
  const paths = [...body.matchAll(POST_IMAGE_REFERENCE)]
    .map((match) => match[1])
    .filter((url) => SAFE_POST_IMAGE_URL.test(url))
    .map((url) => `public${url}`);
  return [...new Set(paths)];
}

/** Runtime check for the image-import payload crossing the IPC boundary. */
export function isPostImageImportInput(
  value: unknown,
): value is PostImageImportInput {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  return (
    input.bytes instanceof Uint8Array &&
    (input.slug === null || isString(input.slug)) &&
    isString(input.title) &&
    isString(input.alt)
  );
}
