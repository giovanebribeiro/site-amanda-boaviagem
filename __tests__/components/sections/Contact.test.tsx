import { render, screen } from "@testing-library/react";
import Contact from "@/components/sections/Contact";
import type { ContactData } from "@/types";

const contact: ContactData = {
  instagram: "@pagina90_",
  instagramUrl: "https://www.instagram.com/pagina90_/",
  email: "amandaboaviagem@gmail.com",
};

describe("Contact", () => {
  it("renders without crashing", () => {
    render(<Contact id="contato" contact={contact} />);
  });

  it("renders section title", () => {
    render(<Contact id="contato" contact={contact} />);
    expect(screen.getByRole("heading", { name: /contato/i })).toBeInTheDocument();
  });

  it("renders Instagram link", () => {
    render(<Contact id="contato" contact={contact} />);
    const instaLink = screen.getByRole("link", { name: /instagram/i });
    expect(instaLink).toHaveAttribute(
      "href",
      "https://www.instagram.com/pagina90_/"
    );
    expect(instaLink).toHaveAttribute("target", "_blank");
  });

  it("renders email link", () => {
    render(<Contact id="contato" contact={contact} />);
    const emailLink = screen.getByRole("link", { name: /e-mail/i });
    expect(emailLink).toHaveAttribute(
      "href",
      "mailto:amandaboaviagem@gmail.com"
    );
  });

  it("renders the contact received by props", () => {
    render(
      <Contact
        id="contato"
        contact={{
          instagram: "@outra",
          instagramUrl: "https://www.instagram.com/outra/",
          email: "outra@example.com",
        }}
      />
    );
    expect(screen.getByRole("link", { name: /e-mail/i })).toHaveAttribute(
      "href",
      "mailto:outra@example.com"
    );
    expect(screen.getByText("@outra")).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Contact id="contato" contact={contact} />);
    expect(container.querySelector("#contato")).toBeInTheDocument();
  });
});
