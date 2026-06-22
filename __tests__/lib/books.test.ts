import {
  getBooksSortedByDate,
  getBookBySlug,
  getLatestBook,
} from "@/lib/books";

describe("books helpers", () => {
  describe("getBooksSortedByDate", () => {
    it("returns an array", () => {
      expect(Array.isArray(getBooksSortedByDate())).toBe(true);
    });

    it("each book has all required fields", () => {
      const books = getBooksSortedByDate();
      for (const book of books) {
        expect(book).toHaveProperty("id");
        expect(book).toHaveProperty("slug");
        expect(book).toHaveProperty("title");
        expect(book).toHaveProperty("description");
        expect(book).toHaveProperty("image");
        expect(book).toHaveProperty("releaseDate");
        expect(book).toHaveProperty("slogan");
        expect(book).toHaveProperty("reviews");
        expect(Array.isArray(book.reviews)).toBe(true);
      }
    });

    it("returns books sorted by releaseDate descending", () => {
      const books = getBooksSortedByDate();
      for (let i = 1; i < books.length; i++) {
        expect(books[i - 1].releaseDate >= books[i].releaseDate).toBe(true);
      }
    });

    it("does not mutate the original DataStore order", () => {
      const first = getBooksSortedByDate();
      const second = getBooksSortedByDate();
      expect(first.map((b) => b.id)).toEqual(second.map((b) => b.id));
    });
  });

  describe("getBookBySlug", () => {
    it("returns the correct book for a valid slug", () => {
      const books = getBooksSortedByDate();
      const target = books[0];
      const result = getBookBySlug(target.slug);
      expect(result).not.toBeNull();
      expect(result!.slug).toBe(target.slug);
      expect(result!.id).toBe(target.id);
    });

    it("returns null for a non-existent slug", () => {
      expect(getBookBySlug("slug-que-nao-existe")).toBeNull();
    });
  });

  describe("getLatestBook", () => {
    it("returns a book (not null)", () => {
      expect(getLatestBook()).not.toBeNull();
    });

    it("returns the book with the most recent releaseDate", () => {
      const latest = getLatestBook();
      const all = getBooksSortedByDate();
      expect(latest!.slug).toBe(all[0].slug);
    });
  });
});
