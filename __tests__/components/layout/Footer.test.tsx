import { render, screen } from "@testing-library/react";
import Footer from "@/components/layout/Footer";
import type { ContactData } from "@/types";
import { siteFixture } from "../../fixtures/site";

const contact: ContactData = {
  instagram: "@pagina90_",
  instagramUrl: "https://www.instagram.com/pagina90_/",
  email: "amandaboaviagem@gmail.com",
};

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn(), resolvedTheme: "light" }),
}));

describe("Footer", () => {
  it("renders without crashing", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("renders the author name", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    expect(screen.getAllByText(/amanda boaviagem/i).length).toBeGreaterThan(0);
  });

  it("renders Instagram link pointing to the correct URL", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    const instagramLinks = screen.getAllByRole("link", { name: /instagram/i });
    expect(instagramLinks[0]).toHaveAttribute(
      "href",
      "https://www.instagram.com/pagina90_/"
    );
  });

  it("renders the slogan received by props", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    expect(screen.getByText(siteFixture.slogan)).toBeInTheDocument();
  });

  it("renders email link as mailto", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    const emailLink = screen.getByRole("link", { name: /e-mail/i });
    expect(emailLink).toHaveAttribute("href", "mailto:amandaboaviagem@gmail.com");
  });

  it("renders the contact received by props", () => {
    render(
      <Footer
        contact={{
          instagram: "@outra",
          instagramUrl: "https://www.instagram.com/outra/",
          email: "outra@example.com",
        }}
        slogan={siteFixture.slogan}
      />
    );
    expect(screen.getByRole("link", { name: /e-mail/i })).toHaveAttribute(
      "href",
      "mailto:outra@example.com"
    );
    expect(screen.getByText("@outra")).toBeInTheDocument();
  });

  it("renders dynamic copyright year", () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('link "Livros" navigates to #livros anchor', () => {
    render(<Footer contact={contact} slogan={siteFixture.slogan} />);
    const livrosLinks = screen.getAllByRole("link", { name: /livros/i });
    expect(livrosLinks[0]).toHaveAttribute("href", "/#livros");
  });
});
