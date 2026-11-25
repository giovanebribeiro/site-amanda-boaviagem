import { render, screen } from "@testing-library/react";
import Contact from "@/components/sections/Contact";
import type { ContactData } from "@/types";
import { siteFixture } from "../../fixtures/site";

const contact: ContactData = {
  instagram: "@pagina90_",
  instagramUrl: "https://www.instagram.com/pagina90_/",
  email: "amandaboaviagem@gmail.com",
};

describe("Contact", () => {
  it("renders without crashing", () => {
    render(<Contact id="contato" contact={contact} site={siteFixture} />);
  });

  it("renders section title", () => {
    render(<Contact id="contato" contact={contact} site={siteFixture} />);
    expect(screen.getByRole("heading", { name: /contato/i })).toBeInTheDocument();
  });

  it("renders Instagram link", () => {
    render(<Contact id="contato" contact={contact} site={siteFixture} />);
    const instaLink = screen.getByRole("link", { name: /instagram/i });
    expect(instaLink).toHaveAttribute(
      "href",
      "https://www.instagram.com/pagina90_/"
    );
    expect(instaLink).toHaveAttribute("target", "_blank");
  });

  it("renders email link", () => {
    render(<Contact id="contato" contact={contact} site={siteFixture} />);
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
        site={siteFixture}
      />
    );
    expect(screen.getByRole("link", { name: /e-mail/i })).toHaveAttribute(
      "href",
      "mailto:outra@example.com"
    );
    expect(screen.getByText("@outra")).toBeInTheDocument();
  });

  it("renders the title and subtitle received by props", () => {
    render(<Contact id="contato" contact={contact} site={siteFixture} />);
    expect(screen.getByText(siteFixture.contactTitle)).toBeInTheDocument();
    expect(screen.getByText(siteFixture.contactSubtitle)).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<Contact id="contato" contact={contact} site={siteFixture} />);
    expect(container.querySelector("#contato")).toBeInTheDocument();
  });
});
