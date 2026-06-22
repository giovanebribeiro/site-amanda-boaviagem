import { render, screen, act } from "@testing-library/react";
import UltimoLancamento from "@/components/sections/UltimoLancamento";

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe("UltimoLancamento", () => {
  it("renders without crashing", async () => {
    await act(async () => {
      render(<UltimoLancamento />);
    });
  });

  it("renders the latest book title", async () => {
    await act(async () => {
      render(<UltimoLancamento />);
    });
    // The latest book by releaseDate is id=4 (2022-06-01)
    expect(
      screen.getByText(/amor nos tempos de quarentena.*2a ed/i)
    ).toBeInTheDocument();
  });

  it("renders the slogan of the latest book", async () => {
    await act(async () => {
      render(<UltimoLancamento />);
    });
    expect(
      screen.getByText(/edição definitiva/i)
    ).toBeInTheDocument();
  });

  it("renders the description of the latest book", async () => {
    await act(async () => {
      render(<UltimoLancamento />);
    });
    expect(screen.getByText(/amor e morte andam lado a lado/i)).toBeInTheDocument();
  });

  it("renders the cover image", async () => {
    await act(async () => {
      render(<UltimoLancamento />);
    });
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
