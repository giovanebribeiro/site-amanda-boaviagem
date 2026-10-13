/**
 * Smoke test: home page renders without crashing.
 * Full section tests live alongside each component.
 */
import { render } from "@testing-library/react";
import Home, { getStaticProps } from "@/pages/index";
import type { AboutData, ContactData } from "@/types";

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
    const { container } = render(<Home books={[]} about={about} contact={contact} />);
    expect(container).toBeInTheDocument();
  });

  it("getStaticProps provides the books from the content folder, newest first", async () => {
    const result = await getStaticProps({});
    expect(result).toHaveProperty("props.books");
    const { books } = (result as { props: { books: { releaseDate: string }[] } }).props;
    expect(books).toHaveLength(4);
    expect(books[0].releaseDate >= books[1].releaseDate).toBe(true);
  });

  it("getStaticProps provides about and contact from the content folder", async () => {
    const result = await getStaticProps({});
    const { props } = result as { props: { about: AboutData; contact: ContactData } };
    expect(props.about.title).toBe("Sobre mim");
    expect(props.contact.email).toBe("amandaboaviagem@gmail.com");
  });
});
