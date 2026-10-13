import { render, screen, act } from "@testing-library/react";
import Countdown from "@/components/ui/Countdown";
import type { BookLink } from "@/types";

const PAST_DATE = "2020-01-01";
const FUTURE_DATE = "2099-12-31";

const LINKS: BookLink[] = [
  { label: "Amazon", url: "https://amazon.com/test", primary: true },
  { label: "Uiclap", url: "https://uiclap.com/test" },
];

async function renderCountdown(releaseDate: string, links?: BookLink[]) {
  await act(async () => {
    render(<Countdown releaseDate={releaseDate} links={links} />);
  });
}

describe("Countdown", () => {
  it("renders without crashing before mount effects settle", () => {
    const { container } = render(
      <Countdown releaseDate={FUTURE_DATE} links={LINKS} />
    );
    expect(container).toBeInTheDocument();
  });

  it("shows one button per link, with the label from the data, when released", async () => {
    await renderCountdown(PAST_DATE, LINKS);
    expect(screen.getByRole("link", { name: "Amazon" })).toHaveAttribute(
      "href",
      "https://amazon.com/test"
    );
    expect(screen.getByRole("link", { name: "Uiclap" })).toHaveAttribute(
      "href",
      "https://uiclap.com/test"
    );
  });

  it("supports stores beyond Amazon and Uiclap", async () => {
    await renderCountdown(PAST_DATE, [
      { label: "Livraria Cultura", url: "https://cultura.com/x" },
    ]);
    expect(screen.getByRole("link", { name: "Livraria Cultura" })).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("renders no buttons when links is empty (released)", async () => {
    await renderCountdown(PAST_DATE, []);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders no buttons when links is omitted (released)", async () => {
    await renderCountdown(PAST_DATE);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("fills only the primary link; the others are outlined", async () => {
    await renderCountdown(PAST_DATE, LINKS);
    expect(screen.getByRole("link", { name: "Amazon" })).toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: "Uiclap" })).not.toHaveClass("bg-primary");
    expect(screen.getByRole("link", { name: "Uiclap" })).toHaveClass("border-primary");
  });

  it("outlines a lone link that is not flagged primary", async () => {
    await renderCountdown(PAST_DATE, [{ label: "Uiclap", url: "https://u.com/x" }]);
    expect(screen.getByRole("link", { name: "Uiclap" })).not.toHaveClass("bg-primary");
  });

  it("shows the countdown, not the links, when releaseDate is in the future", async () => {
    await renderCountdown(FUTURE_DATE, LINKS);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.getByText(/dias/i)).toBeInTheDocument();
  });
});
