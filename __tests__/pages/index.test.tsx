/**
 * Smoke test: home page renders without crashing.
 * Full section tests live alongside each component.
 */
import { render } from "@testing-library/react";
import Home, { getStaticProps } from "@/pages/index";

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
    const { container } = render(<Home books={[]} />);
    expect(container).toBeInTheDocument();
  });

  it("getStaticProps provides the books from the content folder, newest first", async () => {
    const result = await getStaticProps({});
    expect(result).toHaveProperty("props.books");
    const { books } = (result as { props: { books: { releaseDate: string }[] } }).props;
    expect(books).toHaveLength(4);
    expect(books[0].releaseDate >= books[1].releaseDate).toBe(true);
  });
});
