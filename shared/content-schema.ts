/**
 * Single source of truth for the Content schema (books, posts, about, contact, site).
 * Pure functions only: no fs, no Next imports, so the desktop app can reuse it.
 */

export interface Review {
  author: string;
  text: string;
}

export interface BookLink {
  label: string;
  url: string;
  primary?: boolean;
}

export interface BookFrontmatter {
  title: string;
  releaseDate: string;
  image: string;
  slogan: string;
  links: BookLink[];
  reviews: Review[];
}

export interface PostFrontmatter {
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
  /** "Em preparação": post saved in the repository but hidden from the site. */
  inPreparation: boolean;
}

export interface ContactData {
  instagram: string;
  instagramUrl: string;
  email: string;
}

export interface AboutData {
  title: string;
  body: string;
  body2: string;
  image: string;
}

export interface SiteData {
  slogan: string;
  heroWelcome: string;
  heroPhotoAlt: string;
  aboutPhotoAlt: string;
  latestReleaseTitle: string;
  booksTitle: string;
  booksSubtitle: string;
  blogTitle: string;
  blogSubtitle: string;
  contactTitle: string;
  contactSubtitle: string;
}

const BOOK_REQUIRED_FIELDS = ["title", "releaseDate", "image"] as const;
const ABOUT_FIELDS = ["title", "body", "body2", "image"] as const;
const CONTACT_FIELDS = ["instagram", "instagramUrl", "email"] as const;

const SITE_FIELDS = [
  "slogan",
  "heroWelcome",
  "heroPhotoAlt",
  "aboutPhotoAlt",
  "latestReleaseTitle",
  "booksTitle",
  "booksSubtitle",
  "blogTitle",
  "blogSubtitle",
  "contactTitle",
  "contactSubtitle",
] as const;

export type SingleFileKind = "about" | "contact" | "site";

/** File name and required fields of each single-file content, in file order. */
export const SINGLE_FILES: Record<
  SingleFileKind,
  { fileName: string; fields: readonly string[] }
> = {
  about: { fileName: "about.json", fields: ABOUT_FIELDS },
  contact: { fileName: "contact.json", fields: CONTACT_FIELDS },
  site: { fileName: "site.json", fields: SITE_FIELDS },
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type Raw = Record<string, unknown>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function invalidBook(fileName: string, reason: string): Error {
  return new Error(`Invalid book (${fileName}): ${reason}`);
}

function invalidContent(fileName: string, reason: string): Error {
  return new Error(`Invalid content (${fileName}): ${reason}`);
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value);
}

function parseList<T>(
  fileName: string,
  raw: unknown,
  keys: readonly string[],
  listName: string,
): T[] {
  if (raw === undefined) return [];
  const shape = `{ ${keys.join(", ")} }`;
  if (
    !Array.isArray(raw) ||
    !raw.every((item) => keys.every((key) => isNonEmptyString(item?.[key])))
  ) {
    throw invalidBook(fileName, `${listName} must be a list of ${shape}`);
  }
  return raw as T[];
}

/** Validates a book's frontmatter. `fileName` (e.g. "x.md") is used in errors. */
export function parseBookFrontmatter(
  data: Raw,
  fileName: string,
): BookFrontmatter {
  for (const field of BOOK_REQUIRED_FIELDS) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      throw invalidBook(fileName, `missing required field: ${field}`);
    }
  }

  const releaseDate = toIsoDate(data.releaseDate);
  if (!ISO_DATE.test(releaseDate)) {
    throw invalidBook(
      fileName,
      `releaseDate must be YYYY-MM-DD, got: ${releaseDate}`,
    );
  }

  return {
    title: String(data.title),
    releaseDate,
    image: String(data.image),
    slogan: data.slogan ? String(data.slogan) : "",
    links: parseList<BookLink>(fileName, data.links, ["label", "url"], "links"),
    reviews: parseList<Review>(
      fileName,
      data.reviews,
      ["author", "text"],
      "reviews",
    ),
  };
}

/** Normalizes a post's frontmatter; posts are lenient and fall back to defaults. */
export function parsePostFrontmatter(
  data: Raw,
  slug: string,
  fileName: string = slug,
): PostFrontmatter {
  if (
    data.inPreparation !== undefined &&
    typeof data.inPreparation !== "boolean"
  ) {
    throw invalidContent(fileName, "inPreparation must be a boolean");
  }
  return {
    title: (data.title as string) ?? slug,
    date: (data.date as string) ?? "",
    excerpt: (data.excerpt as string) ?? "",
    inPreparation: data.inPreparation ?? false,
    ...(data.coverImage ? { coverImage: data.coverImage as string } : {}),
  };
}

function parseStringFields<T extends { [K in keyof T]: string }>(
  data: Raw | null | undefined,
  fileName: string,
  fields: readonly (keyof T & string)[],
): T {
  for (const field of fields) {
    if (!isNonEmptyString(data?.[field])) {
      throw invalidContent(fileName, `missing required field: ${field}`);
    }
  }
  return Object.fromEntries(
    fields.map((field) => [field, (data as Raw)[field]]),
  ) as T;
}

export function parseAbout(data: Raw, fileName: string): AboutData {
  return parseStringFields<AboutData>(data, fileName, ABOUT_FIELDS);
}

export function parseContact(data: Raw, fileName: string): ContactData {
  return parseStringFields<ContactData>(data, fileName, CONTACT_FIELDS);
}

export function parseSite(data: Raw, fileName: string): SiteData {
  return parseStringFields<SiteData>(data, fileName, SITE_FIELDS);
}
