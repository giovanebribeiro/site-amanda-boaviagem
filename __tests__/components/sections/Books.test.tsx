import { render, screen } from "@testing-library/react";
import Books from "@/components/sections/Books";
import type { Book } from "@/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const makeBook = (id: number): Book => ({
  id,
  slug: `livro-${id}`,
  title: `Livro ${id}`,
  description: "Sinopse",
  image: `/images/books/livro-${id}.png`,
  links: [],
  direction: id % 2 === 0 ? "left" : "right",
  releaseDate: "2022-01-01",
  slogan: "Slogan",
  reviews: [],
});

const books = [makeBook(1), makeBook(2), makeBook(3)];

describe("Books", () => {
  it("renders without crashing", () => {
    render(<Books id="livros" books={books} />);
  });

  it("renders section title", () => {
    render(<Books id="livros" books={books} />);
    expect(screen.getByText(/livros/i)).toBeInTheDocument();
  });

  it("renders cover links pointing to /livros/ pages", () => {
    render(<Books id="livros" books={books} />);
    const coverLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/livros/"));
    expect(coverLinks.length).toBeGreaterThan(0);
  });

  it("renders one cover link per book received by props", () => {
    render(<Books id="livros" books={books} />);
    const coverLinks = screen
      .getAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/livros/"));
    expect(coverLinks.length).toBe(3);
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Books id="livros" books={books} />);
    expect(container.querySelector("#livros")).toBeInTheDocument();
  });

  it("renders no covers when there are no books", () => {
    render(<Books id="livros" books={[]} />);
    const coverLinks = screen
      .queryAllByRole("link")
      .filter((l) => l.getAttribute("href")?.startsWith("/livros/"));
    expect(coverLinks).toHaveLength(0);
  });
});
