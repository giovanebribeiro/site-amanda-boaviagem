import { render, screen } from "@testing-library/react";
import Contact from "@/components/sections/Contact";

describe("Contact", () => {
  it("renders without crashing", () => {
    render(<Contact id="contato" />);
  });

  it("renders section title", () => {
    render(<Contact id="contato" />);
    expect(screen.getByRole("heading", { name: /contato/i })).toBeInTheDocument();
  });

  it("renders Instagram link", () => {
    render(<Contact id="contato" />);
    const instaLink = screen.getByRole("link", { name: /instagram/i });
    expect(instaLink).toHaveAttribute(
      "href",
      "https://www.instagram.com/pagina90_/"
    );
    expect(instaLink).toHaveAttribute("target", "_blank");
  });

  it("renders email link", () => {
    render(<Contact id="contato" />);
    const emailLink = screen.getByRole("link", { name: /e-mail/i });
    expect(emailLink).toHaveAttribute(
      "href",
      "mailto:amandaboaviagem@gmail.com"
    );
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Contact id="contato" />);
    expect(container.querySelector("#contato")).toBeInTheDocument();
  });
});
