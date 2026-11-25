import { findStaleToRelease, pickFeaturedBook } from "@/lib/featured-book";
import type { Book } from "@/types";

function book(overrides: Partial<Book>): Book {
  return {
    id: 1,
    slug: "livro",
    title: "Livro",
    description: "",
    image: "/images/books/x.png",
    links: [],
    direction: "right",
    releaseDate: "2022-01-01",
    slogan: "",
    reviews: [],
    toRelease: false,
    ...overrides,
  };
}

describe("pickFeaturedBook", () => {
  it("returns null when there are no books", () => {
    expect(pickFeaturedBook([])).toBeNull();
  });

  it("returns the newest book when none is flagged", () => {
    const books = [book({ slug: "novo" }), book({ slug: "velho" })];
    expect(pickFeaturedBook(books)?.slug).toBe("novo");
  });

  it("returns the flagged book even when it is not the newest by date", () => {
    const books = [
      book({ slug: "novo", releaseDate: "2024-01-01" }),
      book({ slug: "proximo", releaseDate: "2020-01-01", toRelease: true }),
    ];
    expect(pickFeaturedBook(books)?.slug).toBe("proximo");
  });

  it("returns the flagged book with the soonest releaseDate when several are flagged", () => {
    const books = [
      book({ slug: "depois", releaseDate: "2027-06-01", toRelease: true }),
      book({ slug: "antes", releaseDate: "2027-01-01", toRelease: true }),
      book({ slug: "ja-lancado", releaseDate: "2024-01-01" }),
    ];
    expect(pickFeaturedBook(books)?.slug).toBe("antes");
  });
});

describe("findStaleToRelease", () => {
  const today = "2026-11-24";

  it("lists flagged books whose releaseDate has passed", () => {
    const books = [
      book({ slug: "velho-marcado", releaseDate: "2026-11-23", toRelease: true }),
      book({ slug: "futuro", releaseDate: "2027-01-01", toRelease: true }),
      book({ slug: "sem-marca", releaseDate: "2020-01-01" }),
    ];
    expect(findStaleToRelease(books, today).map((b) => b.slug)).toEqual([
      "velho-marcado",
    ]);
  });

  it("does not treat the release day itself as stale", () => {
    const books = [book({ releaseDate: today, toRelease: true })];
    expect(findStaleToRelease(books, today)).toEqual([]);
  });
});
