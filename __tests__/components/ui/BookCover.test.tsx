import { render, screen } from "@testing-library/react";
import BookCover from "@/components/ui/BookCover";
import type { Book } from "@/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockBook: Book = {
  id: 1,
  slug: "test-book",
  title: "Test Book Title",
  description: "A test description.",
  image: "/images/test-cover.png",
  linkAmazon: "https://amazon.com/test",
  linkUiclap: "https://uiclap.com/test",
  direction: "right",
  releaseDate: "2021-05-01",
  slogan: "A test slogan.",
  reviews: [{ author: "Reviewer A", text: "Great book!" }],
};

describe("BookCover", () => {
  it("renders without crashing", () => {
    render(<BookCover book={mockBook} />);
  });

  it("renders the cover image with correct src", () => {
    render(<BookCover book={mockBook} />);
    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/images/test-cover.png");
  });

  it("uses the book title as image alt text", () => {
    render(<BookCover book={mockBook} />);
    expect(screen.getByRole("img", { name: "Test Book Title" })).toBeInTheDocument();
  });

  it("wraps the cover in a link to /livros/[slug]", () => {
    render(<BookCover book={mockBook} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/livros/test-book");
  });
});
