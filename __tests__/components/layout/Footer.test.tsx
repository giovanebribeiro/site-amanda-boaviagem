import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn(), resolvedTheme: "light" }),
}));

describe("Footer", () => {
  it("renders without crashing", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<Footer />);
    expect(screen.getAllByText(/amanda boaviagem/i).length).toBeGreaterThan(0);
  });

  it("renders Instagram link pointing to the correct URL", () => {
    render(<Footer />);
    const instagramLinks = screen.getAllByRole("link", { name: /instagram/i });
    expect(instagramLinks[0]).toHaveAttribute(
      "href",
      "https://www.instagram.com/pagina90_/"
    );
  });

  it("renders email link as mailto", () => {
    render(<Footer />);
    const emailLink = screen.getByRole("link", { name: /e-mail/i });
    expect(emailLink).toHaveAttribute("href", "mailto:amandaboaviagem@gmail.com");
  });

  it("renders dynamic copyright year", () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('link "Livros" navigates to #livros anchor', () => {
    render(<Footer />);
    const livrosLinks = screen.getAllByRole("link", { name: /livros/i });
    expect(livrosLinks[0]).toHaveAttribute("href", "/#livros");
  });
});
