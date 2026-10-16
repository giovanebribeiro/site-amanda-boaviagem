import matter from "gray-matter";
import type { BookDraft } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_SLUG = "livro";
export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function emptyDraft(): BookDraft {
  return {
    slug: null,
    title: "",
    releaseDate: "",
    image: "",
    slogan: "",
    links: [],
    reviews: [],
    synopsis: "",
  };
}

export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || DEFAULT_SLUG;
}

export function uniqueSlug(base: string, taken: readonly string[]): string {
  if (!taken.includes(base)) return base;
  let counter = 2;
  while (taken.includes(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

/** What still blocks the book from being valid, in the author's language. */
export function findMissing(draft: BookDraft): string[] {
  const missing: string[] = [];
  if (!draft.title.trim()) missing.push("Título");
  if (!ISO_DATE.test(draft.releaseDate)) {
    missing.push("Data de lançamento (use o formato AAAA-MM-DD)");
  }
  if (!draft.image.trim()) missing.push("Capa");
  draft.links.forEach((link, index) => {
    if (!link.label.trim() || !link.url.trim()) {
      missing.push(
        `Link de compra ${index + 1}: preencha o rótulo e o endereço`,
      );
    }
  });
  draft.reviews.forEach((review, index) => {
    if (!review.author.trim() || !review.text.trim()) {
      missing.push(`Resenha ${index + 1}: preencha o autor e o texto`);
    }
  });
  return missing;
}

const isString = (value: unknown): value is string => typeof value === "string";

const isRecordOf = (value: unknown, keys: readonly string[]): boolean =>
  typeof value === "object" &&
  value !== null &&
  keys.every((key) => isString((value as Record<string, unknown>)[key]));

/** Runtime check for payloads crossing the IPC boundary. */
export function isBookDraft(value: unknown): value is BookDraft {
  if (typeof value !== "object" || value === null) return false;
  const draft = value as Record<string, unknown>;
  return (
    (draft.slug === null || isString(draft.slug)) &&
    ["title", "releaseDate", "image", "slogan", "synopsis"].every((key) =>
      isString(draft[key]),
    ) &&
    Array.isArray(draft.links) &&
    draft.links.every((link) => isRecordOf(link, ["label", "url"])) &&
    Array.isArray(draft.reviews) &&
    draft.reviews.every((review) => isRecordOf(review, ["author", "text"]))
  );
}

function toLf(text: string): string {
  return text.replace(/\r\n?/g, "\n");
}

/** Book file source: frontmatter + synopsis body, always LF. */
export function serializeBook(draft: BookDraft): string {
  const data = {
    title: toLf(draft.title),
    releaseDate: draft.releaseDate,
    image: draft.image,
    ...(draft.slogan ? { slogan: toLf(draft.slogan) } : {}),
    ...(draft.links.length > 0
      ? {
          links: draft.links.map(({ primary, ...link }) =>
            primary ? { ...link, primary } : link,
          ),
        }
      : {}),
    ...(draft.reviews.length > 0
      ? {
          reviews: draft.reviews.map((review) => ({
            ...review,
            text: toLf(review.text),
          })),
        }
      : {}),
  };
  return toLf(matter.stringify(`${toLf(draft.synopsis).trim()}\n`, data));
}
