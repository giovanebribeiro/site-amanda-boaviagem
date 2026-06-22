import { render, screen } from "@testing-library/react";
import ReviewCard from "@/components/ui/ReviewCard";
import type { Review } from "@/types";

const mockReview: Review = {
  author: "Maria Silva",
  text: "Um livro incrível que me emocionou profundamente.",
};

describe("ReviewCard", () => {
  it("renders without crashing", () => {
    render(<ReviewCard review={mockReview} />);
  });

  it("renders the review text", () => {
    render(<ReviewCard review={mockReview} />);
    expect(
      screen.getByText(/um livro incrível que me emocionou profundamente/i)
    ).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<ReviewCard review={mockReview} />);
    expect(screen.getByText(/maria silva/i)).toBeInTheDocument();
  });
});
