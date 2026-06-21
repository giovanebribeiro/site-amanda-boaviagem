import { render, screen } from "@testing-library/react";
import Hero from "@/components/sections/Hero";

describe("Hero", () => {
  it("renders without crashing", () => {
    render(<Hero id="inicio" />);
  });

  it("renders the author name", () => {
    render(<Hero id="inicio" />);
    expect(screen.getByText(/amanda boaviagem/i)).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Hero id="inicio" />);
    expect(screen.getByText(/escritora da esperança/i)).toBeInTheDocument();
  });

  it("renders the CTA link pointing to #livros", () => {
    render(<Hero id="inicio" />);
    const ctaLink = screen.getByRole("link", { name: /ver livros/i });
    expect(ctaLink).toHaveAttribute("href", "/#livros");
  });

  it("renders the author photo", () => {
    render(<Hero id="inicio" />);
    const img = screen.getByRole("img", { name: /amanda boaviagem/i });
    expect(img).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Hero id="inicio" />);
    expect(container.querySelector("#inicio")).toBeInTheDocument();
  });
});
