import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { TokenVault } from "./site-session";

const FILE_NAME = "github-token.bin";

/** The slice of Electron's safeStorage (DPAPI on Windows) this app relies on. */
export interface SafeStorageLike {
  isEncryptionAvailable(): boolean;
  encryptString(text: string): Buffer;
  decryptString(data: Buffer): string;
}

/** Keeps the token encrypted by the operating system; never falls back to plain text. */
export function createSafeStorageVault(
  dir: string,
  safeStorage: SafeStorageLike,
): TokenVault {
  const file = join(dir, FILE_NAME);
  return {
    get() {
      try {
        return safeStorage.decryptString(readFileSync(file));
      } catch {
        return null;
      }
    },
    set(token) {
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error("System encryption is not available");
      }
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, safeStorage.encryptString(token));
    },
    clear() {
      rmSync(file, { force: true });
    },
  };
}
