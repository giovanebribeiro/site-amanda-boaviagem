import * as fs from "node:fs";
import { join } from "node:path";
import git from "isomorphic-git";
import type { Identity } from "../common/types";

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
