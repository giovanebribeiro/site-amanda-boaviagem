import * as fs from "node:fs";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import git from "isomorphic-git";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseAbout, parseContact, parseSite } from "@shared/content-schema";
import { openContentSession } from "../../src/main/content-session";

const author = { name: "Amanda", email: "amanda@example.com" };
const contact = {
  instagram: "@amanda",
  instagramUrl: "https://instagram.com/amanda",
  email: "a@example.com",
};

describe("ContentSession single-file content", () => {
  let repo: string;

  beforeEach(async () => {
    repo = mkdtempSync(join(tmpdir(), "single-repo-"));
    await git.init({ fs, dir: repo, defaultBranch: "master" });
    mkdirSync(join(repo, "content"), { recursive: true });
  });
  afterEach(() => rmSync(repo, { recursive: true, force: true }));

  const read = (name: string) =>
    readFileSync(join(repo, "content", name), "utf8");

  it("reads the current values of a file", () => {
    writeFileSync(
      join(repo, "content", "contact.json"),
      JSON.stringify(contact),
    );

    expect(openContentSession(repo).readSingle("contact")).toEqual({
      values: contact,
    });
  });

  it("reports an error and empty values for malformed JSON", () => {
    writeFileSync(join(repo, "content", "about.json"), "{ nope");

    const result = openContentSession(repo).readSingle("about");

    expect(result.error).toContain("about.json");
    expect(result.values.title).toBe("");
  });

  it("returns empty values for a file that does not exist yet", () => {
    const { values } = openContentSession(repo).readSingle("about");

    expect(values).toEqual({ title: "", body: "", body2: "", image: "" });
  });

  it("saves contact so the site reads it back, as LF, with a local version", async () => {
    const result = await openContentSession(repo).saveSingle(
      "contact",
      contact,
      author,
    );

    expect(result).toEqual({ missing: [], versionCreated: true });
    const text = read("contact.json");
    expect(text).not.toContain("\r");
    expect(text.endsWith("}\n")).toBe(true);
    expect(parseContact(JSON.parse(text), "contact.json")).toEqual(contact);
    const [entry] = await git.log({ fs, dir: repo });
    expect(entry.commit.author.email).toBe(author.email);
  });

  it("round-trips about and site, normalizing CRLF to LF", async () => {
    const session = openContentSession(repo);
    const about = {
      title: "Sobre",
      body: "a\r\nb",
      body2: "c",
      image: "/i.png",
    };
    await session.saveSingle("about", about, author);
    expect(parseAbout(JSON.parse(read("about.json")), "about.json").body).toBe(
      "a\nb",
    );

    const site = Object.fromEntries(
      Object.keys(session.readSingle("site").values).map((k) => [k, `v-${k}`]),
    );
    await session.saveSingle("site", site, author);
    expect(parseSite(JSON.parse(read("site.json")), "site.json")).toEqual(site);
  });

  it("lists required fields still empty but still saves", async () => {
    const result = await openContentSession(repo).saveSingle(
      "contact",
      { ...contact, email: "  " },
      author,
    );

    expect(result.missing).toEqual(["E-mail"]);
    expect(result.versionCreated).toBe(true);
  });

  it("ignores unknown keys", async () => {
    await openContentSession(repo).saveSingle(
      "contact",
      { ...contact, evil: "x" },
      author,
    );

    expect(Object.keys(JSON.parse(read("contact.json")))).toEqual([
      "instagram",
      "instagramUrl",
      "email",
    ]);
  });
});

describe("single-file labels", () => {
  it("label every required field of the shared schema, and only those", async () => {
    const { FIELD_LABELS } = await import("../../src/common/single-file");
    const { SINGLE_FILES } = await import("@shared/content-schema");
    for (const [kind, { fields }] of Object.entries(SINGLE_FILES)) {
      expect(
        Object.keys(FIELD_LABELS[kind as keyof typeof FIELD_LABELS]),
      ).toEqual([...fields]);
    }
  });
});
