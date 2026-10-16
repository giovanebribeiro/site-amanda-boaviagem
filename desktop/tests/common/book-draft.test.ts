import matter from "gray-matter";
import { describe, expect, it } from "vitest";
import { parseBookFrontmatter } from "@shared/content-schema";
import {
  emptyDraft,
  isBookDraft,
  findMissing,
  serializeBook,
  slugify,
  uniqueSlug,
} from "../../src/common/book-draft";

const completeDraft = {
  ...emptyDraft(),
  slug: "livro-a",
  title: "Livro A",
  releaseDate: "2021-05-01",
  image: "/images/books/a.png",
  slogan: "um slogan",
  links: [{ label: "Amazon", url: "https://example.com", primary: true }],
  reviews: [{ author: "Ana", text: "Ótimo" }],
  synopsis: "Sinopse.",
};

describe("slugify", () => {
  it("strips accents, lowercases and hyphenates", () => {
    expect(slugify("Contrônicas: Histórias Amorfas!")).toBe(
      "contronicas-historias-amorfas",
    );
  });

  it("falls back to a default when nothing usable remains", () => {
    expect(slugify("  ?!  ")).toBe("livro");
  });
});

describe("uniqueSlug", () => {
  it("appends a counter when the slug is taken", () => {
    expect(uniqueSlug("livro", ["livro", "livro-2"])).toBe("livro-3");
    expect(uniqueSlug("outro", ["livro"])).toBe("outro");
  });
});

describe("findMissing", () => {
  it("is empty for a complete draft", () => {
    expect(findMissing(completeDraft)).toEqual([]);
  });

  it("lists what is missing in portuguese", () => {
    const missing = findMissing({
      ...completeDraft,
      title: " ",
      image: "",
      releaseDate: "01/05/2021",
      links: [{ label: "Amazon", url: "" }],
    });
    expect(missing).toEqual([
      "Título",
      "Data de lançamento (use o formato AAAA-MM-DD)",
      "Capa",
      "Link de compra 1: preencha o rótulo e o endereço",
    ]);
  });
});

describe("serializeBook", () => {
  it("round-trips through the shared schema with LF endings", () => {
    const source = serializeBook(completeDraft);
    const { data, content } = matter(source);

    expect(source).not.toContain("\r");
    expect(source.endsWith("\n")).toBe(true);
    expect(parseBookFrontmatter(data, "livro-a.md")).toEqual({
      title: "Livro A",
      releaseDate: "2021-05-01",
      image: "/images/books/a.png",
      slogan: "um slogan",
      links: completeDraft.links,
      reviews: completeDraft.reviews,
    });
    expect(content.trim()).toBe("Sinopse.");
  });

  it("omits empty optional fields", () => {
    const source = serializeBook({
      ...completeDraft,
      slogan: "",
      links: [],
      reviews: [],
    });
    expect(source).not.toMatch(/slogan|links|reviews/);
  });

  it("normalizes CRLF typed in the form to LF", () => {
    const source = serializeBook({ ...completeDraft, synopsis: "a\r\nb" });
    expect(source).not.toContain("\r");
  });

  it("still serializes an incomplete draft", () => {
    const source = serializeBook({ ...emptyDraft(), title: "" });
    expect(matter(source).data.title).toBe("");
  });
});

describe("isBookDraft", () => {
  it("accepts a real draft and rejects malformed payloads", () => {
    expect(isBookDraft(completeDraft)).toBe(true);
    expect(isBookDraft({ ...completeDraft, links: undefined })).toBe(false);
    expect(isBookDraft({ ...completeDraft, title: 1 })).toBe(false);
    expect(isBookDraft({ ...completeDraft, links: [{ label: "x" }] })).toBe(
      false,
    );
    expect(isBookDraft(null)).toBe(false);
  });
});

describe("serializeBook primary flag", () => {
  it("does not write primary: false", () => {
    const source = serializeBook({
      ...completeDraft,
      links: [{ label: "A", url: "https://a.com", primary: false }],
    });
    expect(source).not.toContain("primary");
  });
});
