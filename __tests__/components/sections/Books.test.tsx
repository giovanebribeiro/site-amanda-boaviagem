import { render, screen } from "@testing-library/react";
import Books from "@/components/sections/Books";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("Books", () => {
  it("renders without crashing", () => {
    render(<Books id="livros" />);
  });

  it("renders section title", () => {
    render(<Books id="livros" />);
    expect(screen.getByText(/livros/i)).toBeInTheDocument();
  });

  it("renders all book cards from DataStore", () => {
    render(<Books id="livros" />);
    // DataStore has 4 items
    const amazonLinks = screen.getAllByRole("link", { name: /amazon/i });
    expect(amazonLinks.length).toBeGreaterThan(0);
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Books id="livros" />);
    expect(container.querySelector("#livros")).toBeInTheDocument();
  });
});
