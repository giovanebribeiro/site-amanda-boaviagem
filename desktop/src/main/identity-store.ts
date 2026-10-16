import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Identity, IdentityResult } from "../common/types";

const FILE_NAME = "identity.json";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IdentityStore {
  read(): Identity | null;
  write(input: Identity): IdentityResult;
}

function isIdentity(value: unknown): value is Identity {
  const candidate = value as Partial<Identity> | null;
  return (
    typeof candidate?.name === "string" && typeof candidate?.email === "string"
  );
}

export function createIdentityStore(dir: string): IdentityStore {
  const file = join(dir, FILE_NAME);
  return {
    read() {
      try {
        const parsed: unknown = JSON.parse(readFileSync(file, "utf8"));
        return isIdentity(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    write(input) {
      if (!isIdentity(input)) {
        return { ok: false, error: "Informe o seu nome e e-mail." };
      }
      const identity = { name: input.name.trim(), email: input.email.trim() };
      if (!identity.name || /[\r\n<>]/.test(identity.name)) {
        return { ok: false, error: "Informe o seu nome." };
      }
      if (!EMAIL_PATTERN.test(identity.email)) {
        return { ok: false, error: "Informe um e-mail válido." };
      }
      mkdirSync(dir, { recursive: true });
      writeFileSync(file, `${JSON.stringify(identity)}\n`);
      return { ok: true, identity };
    },
  };
}
