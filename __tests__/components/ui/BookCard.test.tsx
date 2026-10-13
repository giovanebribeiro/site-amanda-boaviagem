import { render, screen } from "@testing-library/react";
import BookCard from "@/components/ui/BookCard";
import type { Book } from "@/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const baseBook: Book = {
  id: 1,
  slug: "test-book",
  title: "Test Book Title",
  description: "A test description.",
  image: "/images/test-cover.png",
  links: [
    { label: "Amazon", url: "https://amazon.com/test", primary: true },
    { label: "Uiclap", url: "https://uiclap.com/test" },
  ],
  direction: "right",
  releaseDate: "2021-05-01",
  slogan: "A test slogan.",
  reviews: [],
};

describe("BookCard", () => {
  it("renders one button per link, with the label from the data", () => {
    render(<BookCard book={baseBook} />);
    expect(screen.getByRole("link", { name: "Amazon" })).toHaveAttribute(
      "href",
      "https://amazon.com/test"
    );
    expect(screen.getByRole("link", { name: "Uiclap" })).toHaveAttribute(
      "href",
      "https://uiclap.com/test"
    );
  });

  it("renders only the stores present in the data", () => {
    render(
      <BookCard
        book={{
          ...baseBook,
          links: [{ label: "Uiclap", url: "https://uiclap.com/test" }],
        }}
      />
    );
    expect(screen.queryByRole("link", { name: "Amazon" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Uiclap" })).toBeInTheDocument();
  });

  it("fills only the primary link; the others are outlined", () => {
    render(<BookCard book={baseBook} />);
    expect(screen.getByRole("link", { name: "Amazon" })).toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: "Uiclap" })).not.toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: "Uiclap" })).toHaveClass("border-primary");
  });

  it("outlines a lone link that is not flagged primary", () => {
    render(
      <BookCard
        book={{ ...baseBook, links: [{ label: "Uiclap", url: "https://u.com/x" }] }}
      />
    );
    expect(screen.getByRole("link", { name: "Uiclap" })).not.toHaveClass("bg-primary");
  });

  it("renders no buttons when links is empty", () => {
    render(<BookCard book={{ ...baseBook, links: [] }} />);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
