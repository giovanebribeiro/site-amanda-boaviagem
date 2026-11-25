/**
 * Smoke test: home page renders without crashing.
 * Full section tests live alongside each component.
 */
import { render } from "@testing-library/react";
import Home, { getStaticProps } from "@/pages/index";
import type { AboutData, ContactData, SiteData } from "@/types";
import { siteFixture } from "../fixtures/site";

const about: AboutData = {
  title: "Sobre mim",
  body: "Texto.",
  body2: "Mais texto.",
  image: "/images/session02/amanda.jpeg",
};
const contact: ContactData = {
  instagram: "@pagina90_",
  instagramUrl: "https://www.instagram.com/pagina90_/",
  email: "amandaboaviagem@gmail.com",
};

// Mock next/dynamic to avoid SSR issues in tests
jest.mock("next/dynamic", () => (fn: () => Promise<unknown>) => {
  const Component = () => null;
  Component.displayName = "DynamicMock";
  return Component;
});

jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/" }),
}));

describe("Home page", () => {
  it("renders without crashing", () => {
    const { container } = render(<Home books={[]} about={about} contact={contact} site={siteFixture} />);
    expect(container).toBeInTheDocument();
  });

  it("getStaticProps provides the books from the content folder, newest first", async () => {
    const result = await getStaticProps({});
    expect(result).toHaveProperty("props.books");
    const { books } = (result as { props: { books: { releaseDate: string }[] } }).props;
    expect(books).toHaveLength(2);
    expect(books[0].releaseDate >= books[1].releaseDate).toBe(true);
  });

  it("renders the Hero, section titles and contact from the site texts received by props", () => {
    const { getByText } = render(
      <Home books={[]} about={about} contact={contact} site={siteFixture} />,
    );
    expect(getByText(siteFixture.heroWelcome)).toBeInTheDocument();
    expect(getByText(siteFixture.booksTitle)).toBeInTheDocument();
    expect(getByText(siteFixture.contactTitle)).toBeInTheDocument();
  });

  it("getStaticProps provides the site texts from the content folder", async () => {
    const result = await getStaticProps({});
    const { props } = result as { props: { site: SiteData } };
    expect(props.site.slogan).toBe("Escritora da Esperança");
  });

  it("getStaticProps provides about and contact from the content folder", async () => {
    const result = await getStaticProps({});
    const { props } = result as { props: { about: AboutData; contact: ContactData } };
    expect(props.about.title).toBe("Sobre mim");
    expect(props.contact.email).toBe("escritora@amandaboaviagem.com.br");
  });
});
