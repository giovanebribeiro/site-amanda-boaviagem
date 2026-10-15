import path from "path";
import {
  getBooksSortedByDate,
  getBookBySlug,
  getLatestBook,
} from "@/lib/books";

const fixtures = path.join(__dirname, "..", "fixtures", "content");
const invalidFixtures = path.join(__dirname, "..", "fixtures", "content-invalid");
const invalidDateFixtures = path.join(__dirname, "..", "fixtures", "content-invalid-date");
const invalidLinksFixtures = path.join(__dirname, "..", "fixtures", "content-invalid-links");
const missingRoot = path.join(__dirname, "..", "fixtures", "content-inexistente");

describe("getBooksSortedByDate", () => {
  it("uses the file name as slug", () => {
    const slugs = getBooksSortedByDate(fixtures).map((b) => b.slug);
    expect(slugs).toEqual(["livro-novo", "livro-medio", "livro-antigo"]);
  });

  it("sorts by releaseDate descending", () => {
    const dates = getBooksSortedByDate(fixtures).map((b) => b.releaseDate);
    expect(dates).toEqual(["2022-12-31", "2021-06-01", "2020-01-15"]);
  });

  it("derives a stable id, independent of the date ordering", () => {
    const first = getBooksSortedByDate(fixtures);
    const second = getBooksSortedByDate(fixtures);
    expect(first.map((b) => [b.slug, b.id])).toEqual(
      second.map((b) => [b.slug, b.id])
    );
    expect(new Set(first.map((b) => b.id)).size).toBe(first.length);
  });

  it("alternates direction along the sorted list", () => {
    const directions = getBooksSortedByDate(fixtures).map((b) => b.direction);
    expect(directions).toEqual(["right", "left", "right"]);
  });

  it("defaults links and reviews to empty lists", () => {
    const novo = getBookBySlug("livro-novo", fixtures);
    expect(novo?.links).toEqual([]);
    expect(novo?.reviews).toEqual([]);
  });

  it("reads links and reviews when present", () => {
    const medio = getBookBySlug("livro-medio", fixtures);
    expect(medio?.links).toEqual([
      { label: "Uiclap", url: "https://uiclap.example/medio" },
    ]);
    expect(medio?.reviews).toEqual([{ author: "Leitora", text: "Gostei muito" }]);
  });

  it("keeps the primary flag on links", () => {
    const antigo = getBookBySlug("livro-antigo", fixtures);
    expect(antigo?.links[0].primary).toBe(true);
  });

  it("uses the body as synopsis, trimmed", () => {
    expect(getBookBySlug("livro-novo", fixtures)?.description).toBe(
      "Sinopse do livro novo."
    );
  });

  it("normalizes an unquoted YAML date to an ISO string", () => {
    expect(getBookBySlug("livro-antigo", fixtures)?.releaseDate).toBe("2020-01-15");
  });

  it("returns an empty list when the books folder does not exist", () => {
    expect(getBooksSortedByDate(missingRoot)).toEqual([]);
  });

  it("fails with a clear message when a required field is missing", () => {
    expect(() => getBooksSortedByDate(invalidFixtures)).toThrow(
      /sem-titulo\.md.*title/
    );
  });

  it("fails with a clear message when releaseDate is not an ISO date", () => {
    expect(() => getBooksSortedByDate(invalidDateFixtures)).toThrow(
      /data-ruim\.md.*releaseDate/
    );
  });

  it("fails with a clear message when a link lacks label or url", () => {
    expect(() => getBooksSortedByDate(invalidLinksFixtures)).toThrow(
      /links-ruins\.md.*links/
    );
  });

  it("reads the real content folder by default", () => {
    const slugs = getBooksSortedByDate().map((b) => b.slug);
    expect(slugs).toEqual(
      expect.arrayContaining([
        "amor-nos-tempos-de-quarentena",
        "contronicas-historias-amorfas-de-quarentena",
      ])
    );
    expect(slugs).toHaveLength(2);
  });
});

describe("getBookBySlug", () => {
  it("returns the matching book", () => {
    expect(getBookBySlug("livro-medio", fixtures)?.title).toBe("Livro Medio");
  });

  it("returns null for a non-existent slug", () => {
    expect(getBookBySlug("slug-que-nao-existe", fixtures)).toBeNull();
  });

  it("returns null for slugs that try to leave the books folder", () => {
    expect(getBookBySlug("../content-invalid/books/sem-titulo", fixtures)).toBeNull();
  });
});

describe("getLatestBook", () => {
  it("returns the most recent book", () => {
    expect(getLatestBook(fixtures)?.slug).toBe("livro-novo");
  });

  it("returns null when there are no books", () => {
    expect(getLatestBook(missingRoot)).toBeNull();
  });
});

describe("real content - purchase links", () => {
  it("exposes links as { label, url } and no legacy store fields", () => {
    for (const book of getBooksSortedByDate()) {
      for (const link of book.links) {
        expect(link.label).toBeTruthy();
        expect(link.url).toMatch(/^https?:\/\//);
      }
      expect(book).not.toHaveProperty("linkAmazon");
      expect(book).not.toHaveProperty("linkUiclap");
    }
  });

  it("keeps Amazon only on the books that had it before, as primary", () => {
    const amor = getBookBySlug("amor-nos-tempos-de-quarentena");
    const contronicas = getBookBySlug("contronicas-historias-amorfas-de-quarentena");
    expect(amor?.links.map((l) => l.label)).toEqual(["Amazon", "Uiclap"]);
    expect(amor?.links[0].primary).toBe(true);
    expect(contronicas?.links.map((l) => l.label)).toEqual(["Uiclap"]);
  });

  it("drops the placeholder reviews", () => {
    for (const book of getBooksSortedByDate()) {
      expect(book.reviews).toEqual([]);
    }
  });
});
