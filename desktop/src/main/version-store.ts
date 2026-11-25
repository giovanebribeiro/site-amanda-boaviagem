import * as fs from "node:fs";
import { dirname, join } from "node:path";
import git from "isomorphic-git";
import type { Identity, SavedVersion } from "../common/types";

interface SaveVersionInput {
  repoPath: string;
  filepaths: readonly string[];
  message: string;
  author: Identity;
}

async function committedBlobOid(
  dir: string,
  filepath: string,
): Promise<string | null> {
  try {
    const head = await git.resolveRef({ fs, dir, ref: "HEAD" });
    const { oid } = await git.readBlob({ fs, dir, oid: head, filepath });
    return oid;
  } catch {
    return null;
  }
}

/** Content hash comparison: immune to the stat cache missing same-size edits. */
async function hasChanged(dir: string, filepath: string): Promise<boolean> {
  const { oid } = await git.hashBlob({
    object: fs.readFileSync(join(dir, filepath)),
  });
  return oid !== (await committedBlobOid(dir, filepath));
}

/** Creates a local Versão salva; returns false when nothing changed. */
export async function saveVersion(input: SaveVersionInput): Promise<boolean> {
  const { repoPath: dir, filepaths, message, author } = input;
  const changed: string[] = [];
  for (const filepath of filepaths) {
    if (await hasChanged(dir, filepath)) changed.push(filepath);
  }
  if (changed.length === 0) return false;

  for (const filepath of changed) await git.add({ fs, dir, filepath });
  await git.commit({ fs, dir, message, author });
  return true;
}

const CONTENT_ROOTS = ["content/", "public/images/"];
const MESSAGE_PREFIX = /^chore\(content\):\s*/;

export class UnknownVersionError extends Error {
  constructor(versionId: string) {
    super(`Not a saved version: ${versionId}`);
    this.name = "UnknownVersionError";
  }
}

export class PendingChangesError extends Error {
  constructor() {
    super("Content has unsaved changes; save before going back.");
    this.name = "PendingChangesError";
  }
}

const isContentPath = (filepath: string): boolean =>
  CONTENT_ROOTS.some((root) => filepath.startsWith(root));

/** Saved versions, newest first; empty while the repository has no commits. */
export async function listVersions(
  repoPath: string,
): Promise<readonly SavedVersion[]> {
  let entries;
  try {
    entries = await git.log({ fs, dir: repoPath });
  } catch (error) {
    if (error instanceof git.Errors.NotFoundError) return [];
    throw error;
  }
  return entries.map(({ oid, commit }) => ({
    id: oid,
    date: new Date(commit.committer.timestamp * 1000).toISOString(),
    description:
      commit.message.split("\n")[0].replace(MESSAGE_PREFIX, "").trim() ||
      "Versão salva",
  }));
}

async function contentFilesAt(dir: string, ref: string): Promise<string[]> {
  return (await git.listFiles({ fs, dir, ref })).filter(isContentPath);
}

async function blobOidAt(
  dir: string,
  ref: string,
  filepath: string,
): Promise<string | null> {
  try {
    return (await git.readBlob({ fs, dir, oid: ref, filepath })).oid;
  } catch (error) {
    if (error instanceof git.Errors.NotFoundError) return null;
    throw error;
  }
}

/** Committed content whose file was edited or deleted; compared by hash because the stat cache misses same-size edits. */
async function hasEditedTrackedContent(dir: string): Promise<boolean> {
  const tracked = await contentFilesAt(dir, "HEAD");
  for (const filepath of tracked) {
    if (!fs.existsSync(join(dir, filepath))) return true;
    if (await hasChanged(dir, filepath)) return true;
  }
  return false;
}

/** Tracked content edited, deleted or staged but not committed. Untracked files do not count. */
export async function hasPendingChanges(dir: string): Promise<boolean> {
  if (await hasEditedTrackedContent(dir)) return true;
  const rows = await git.statusMatrix({ fs, dir });
  return rows.some(
    ([filepath, head, workdir, stage]) =>
      isContentPath(filepath) &&
      !(head === 0 && workdir === 2 && stage === 0) &&
      !(head === 1 && workdir === 1 && stage === 1),
  );
}

/**
 * Brings content/ and public/images/ back to how a past version had them,
 * as a new version on top of the history. Returns false when already identical.
 */
export async function restoreVersion(input: {
  repoPath: string;
  versionId: string;
  author: Identity;
}): Promise<boolean> {
  const { repoPath: dir, versionId, author } = input;
  const known = await listVersions(dir);
  const target = known.find((version) => version.id === versionId);
  if (!target) throw new UnknownVersionError(versionId);

  if (await hasPendingChanges(dir)) throw new PendingChangesError();

  const head = known[0].id;
  const wanted = await contentFilesAt(dir, versionId);
  const current = await contentFilesAt(dir, head);

  const toWrite: string[] = [];
  for (const filepath of wanted) {
    if (
      (await blobOidAt(dir, versionId, filepath)) !==
      (await blobOidAt(dir, head, filepath))
    ) {
      toWrite.push(filepath);
    }
  }
  const toRemove = current.filter((filepath) => !wanted.includes(filepath));
  if (toWrite.length === 0 && toRemove.length === 0) return false;

  for (const filepath of toWrite) {
    const { blob } = await git.readBlob({ fs, dir, oid: versionId, filepath });
    const absolute = join(dir, filepath);
    fs.mkdirSync(dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, blob);
    await git.add({ fs, dir, filepath });
  }
  for (const filepath of toRemove) {
    fs.rmSync(join(dir, filepath), { force: true });
    await git.remove({ fs, dir, filepath });
  }
  const day = new Date(target.date).toLocaleDateString("pt-BR");
  await git.commit({
    fs,
    dir,
    message: `chore(content): voltar para a versão de ${day}`,
    author,
  });
  return true;
}
