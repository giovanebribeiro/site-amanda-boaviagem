import type { SingleFileValues } from "./single-file";
import type { BookFrontmatter, BookLink, Review } from "@shared/content-schema";

export type BookSummary = BookFrontmatter & {
  slug: string;
  /** Sinopse: the markdown body of the book file. */
  synopsis: string;
};

/** Editable form state; may be incomplete or invalid. `slug` is null until the first save. */
export interface BookDraft {
  slug: string | null;
  title: string;
  releaseDate: string;
  image: string;
  slogan: string;
  links: BookLink[];
  reviews: Review[];
  synopsis: string;
}

/** Which book a cover belongs to. A null slug means not saved yet: the title names the folder. */
export interface CoverTarget {
  slug: string | null;
  title: string;
}

export interface CoverImportInput extends CoverTarget {
  bytes: Uint8Array;
}

export interface CoverImport {
  /** Site path to store in the book's `image` field. */
  image: string;
  /** Set when the stored image is still heavy. */
  warning?: string;
}

export type ImportCoverResult =
  ({ ok: true } & CoverImport) | { ok: false; error: string };

export interface Identity {
  name: string;
  email: string;
}

export type BookEntry =
  | { slug: string; status: "valid"; book: BookSummary }
  | { slug: string; status: "invalid"; error: string; draft?: BookDraft };

export type IdentityResult =
  { ok: true; identity: Identity } | { ok: false; error: string };

export interface SaveBookOutcome {
  slug: string;
  missing: string[];
  versionCreated: boolean;
}

export interface SingleFileRead {
  values: SingleFileValues;
  /** Set when the existing file could not be parsed; values then start empty. */
  error?: string;
}

export interface SaveSingleOutcome {
  missing: string[];
  versionCreated: boolean;
}

export type SaveSingleResult =
  ({ ok: true } & SaveSingleOutcome) | { ok: false; error: string };

export type ReadSingleResult =
  ({ ok: true } & SingleFileRead) | { ok: false; error: string };

export type SaveBookResult =
  | ({ ok: true; books: readonly BookEntry[] } & SaveBookOutcome)
  | { ok: false; error: string };

export type OpenRepositoryResult =
  { ok: true; books: readonly BookEntry[] } | { ok: false; error: string };

/** Editable post state; may be incomplete. `slug` is null until the first save and is never changed afterwards. */
export interface PostDraft {
  slug: string | null;
  title: string;
  date: string;
  excerpt: string;
  /** "Em preparação": saved in the repository but hidden from the site. */
  inPreparation: boolean;
  /** Markdown body (no JSX). */
  body: string;
  /** Kept as-is from an existing post; the app does not edit it yet. */
  coverImage?: string;
}

export type PostEntry =
  | { slug: string; status: "valid"; post: PostDraft & { slug: string } }
  | { slug: string; status: "invalid"; error: string };

export interface SavePostOutcome {
  slug: string;
  missing: string[];
  versionCreated: boolean;
}

export type SavePostResult =
  | ({ ok: true; posts: readonly PostEntry[] } & SavePostOutcome)
  | { ok: false; error: string };

export type ListPostsResult =
  { ok: true; posts: readonly PostEntry[] } | { ok: false; error: string };

/** Which post an image belongs to. A null slug means not saved yet: the title names the folder. */
export interface PostImageTarget {
  slug: string | null;
  title: string;
}

/** `alt` is the text alternativo; it is required. */
export interface PostImageInput extends PostImageTarget {
  alt: string;
}

export interface PostImageImportInput extends PostImageInput {
  bytes: Uint8Array;
}

export interface PostImageImport {
  /** Site path of the stored image (e.g. /images/blog/<slug>/image-1.png). */
  path: string;
  /** Markdown to insert in the post body. */
  markdown: string;
  /** Set when the stored image is still heavy. */
  warning?: string;
}

export type ImportPostImageResult =
  ({ ok: true } & PostImageImport) | { ok: false; error: string };

/** A Versão salva as shown in the history. */
export interface SavedVersion {
  /** Commit id; opaque to the renderer. */
  id: string;
  /** ISO timestamp. */
  date: string;
  description: string;
}

export type ListVersionsResult =
  | { ok: true; versions: readonly SavedVersion[] }
  | { ok: false; error: string };

export type RestoreVersionResult =
  | {
      ok: true;
      /** False when the content already matched that version. */
      versionCreated: boolean;
      versions: readonly SavedVersion[];
      books: readonly BookEntry[];
      posts: readonly PostEntry[];
    }
  | { ok: false; error: string };

/** What the author must do on github.com/login/device to finish signing in. */
export interface DeviceCodePrompt {
  userCode: string;
  verificationUri: string;
}

export type SignInResult = { ok: true } | { ok: false; error: string };

/** How the local copy of the site compares to the site on GitHub after opening. */
export type SiteUpdate =
  | "cloned"
  | "updated"
  | "up-to-date"
  /** A Rascunho is pending, so the site was not refreshed. */
  | "kept-draft"
  /** Local versions and the site both changed; the Publicação step resolves it. */
  | "diverged"
  /** No connection: the local copy was opened as-is. */
  | "offline";

export type OpenSiteResult =
  | { ok: true; update: SiteUpdate; books: readonly BookEntry[] }
  | { ok: false; error: string; needsSignIn: boolean };

/** Where the site stands after a Publicação: sent, being built, live, or failed. */
export type DeployState = "building" | "live" | "failed";

export type PublishResult =
  | {
      ok: true;
      /** The commit now on the site; its workflow run is what the screen follows. */
      sha: string;
      /** False when there was nothing new to send. */
      sent: boolean;
    }
  | { ok: false; error: string; needsSignIn: boolean };

export type DeployStateResult =
  { ok: true; state: DeployState } | { ok: false; error: string };
