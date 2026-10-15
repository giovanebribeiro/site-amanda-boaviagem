import { render, screen } from "@testing-library/react";
import Hero from "@/components/sections/Hero";
import { siteFixture } from "../../fixtures/site";

describe("Hero", () => {
  it("renders without crashing", () => {
    render(<Hero id="inicio" site={siteFixture} />);
  });

  it("renders the author name", () => {
    render(<Hero id="inicio" site={siteFixture} />);
    expect(
      screen.getByRole("heading", { name: /amanda\s*boaviagem/i }),
    ).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Hero id="inicio" site={siteFixture} />);
    expect(screen.getByText(siteFixture.slogan)).toBeInTheDocument();
  });

  it("renders the welcome text received by props", () => {
    render(<Hero id="inicio" site={siteFixture} />);
    expect(screen.getByText(siteFixture.heroWelcome)).toBeInTheDocument();
  });

  it("renders the CTA link pointing to #livros", () => {
    render(<Hero id="inicio" site={siteFixture} />);
    const ctaLink = screen.getByRole("link", { name: /ver livros/i });
    expect(ctaLink).toHaveAttribute("href", "/#livros");
  });

  it("renders the author photo", () => {
    render(<Hero id="inicio" site={siteFixture} />);
    const img = screen.getByRole("img", { name: siteFixture.heroPhotoAlt });
    expect(img).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Hero id="inicio" site={siteFixture} />);
    expect(container.querySelector("#inicio")).toBeInTheDocument();
  });
});
