import { render, screen, act } from "@testing-library/react";
import UltimoLancamento from "@/components/sections/UltimoLancamento";
import type { Book } from "@/types";
import { siteFixture } from "../../fixtures/site";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const book: Book = {
  id: 4,
  slug: "amor-nos-tempos-de-quarentena-2a-ed",
  title: "Amor nos Tempos de Quarentena - Amanda Boaviagem (2a Ed.)",
  description: "Amor e Morte andam lado a lado.",
  image: "/images/books/book1.png",
  links: [{ label: "Uiclap", url: "https://uiclap.example/x" }],
  direction: "right",
  releaseDate: "2022-06-01",
  slogan: "A edição definitiva de um romance que emocionou o Brasil.",
  reviews: [],
};

describe("UltimoLancamento", () => {
  it("renders without crashing", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
  });

  it("renders the title of the book received by props", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
    expect(
      screen.getByText(/amor nos tempos de quarentena.*2a ed/i)
    ).toBeInTheDocument();
  });

  it("renders the slogan of the latest book", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
    expect(
      screen.getByText(/edição definitiva/i)
    ).toBeInTheDocument();
  });

  it("renders the description of the latest book", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
    expect(screen.getByText(/amor e morte andam lado a lado/i)).toBeInTheDocument();
  });

  it("renders the cover image", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders the section title received by props", async () => {
    await act(async () => {
      render(<UltimoLancamento book={book} site={siteFixture} />);
    });
    expect(screen.getByText(siteFixture.latestReleaseTitle)).toBeInTheDocument();
  });

  it("renders nothing when there is no book", async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<UltimoLancamento book={null} site={siteFixture} />));
    });
    expect(container).toBeEmptyDOMElement();
  });
});
