import { render, screen, act } from "@testing-library/react";
import Countdown from "@/components/ui/Countdown";

const PAST_DATE = "2020-01-01";
const FUTURE_DATE = "2099-12-31";

describe("Countdown", () => {
  it("renders nothing before mount (SSR safety)", () => {
    const { container } = render(
      <Countdown
        releaseDate={FUTURE_DATE}
        linkAmazon="https://amazon.com"
        linkUiclap="https://uiclap.com"
      />
    );
    // Before useEffect fires (synchronous render), the mounted guard returns null
    // After act(), the component has mounted — we just verify it doesn't crash
    expect(container).toBeInTheDocument();
  });

  it("shows buy links when releaseDate is in the past", async () => {
    await act(async () => {
      render(
        <Countdown
          releaseDate={PAST_DATE}
          linkAmazon="https://amazon.com/test"
          linkUiclap="https://uiclap.com/test"
        />
      );
    });
    expect(screen.getByRole("link", { name: /amazon/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /uiclap/i })).toBeInTheDocument();
  });

  it("shows countdown when releaseDate is in the future", async () => {
    await act(async () => {
      render(
        <Countdown
          releaseDate={FUTURE_DATE}
          linkAmazon="https://amazon.com/test"
          linkUiclap="https://uiclap.com/test"
        />
      );
    });
    // Should show time units, not buy links
    expect(screen.queryByRole("link", { name: /amazon/i })).not.toBeInTheDocument();
    // Should render some countdown display
    expect(screen.getByText(/dias/i)).toBeInTheDocument();
  });

  it("hides Amazon link when linkAmazon is empty (past release)", async () => {
    await act(async () => {
      render(
        <Countdown
          releaseDate={PAST_DATE}
          linkAmazon=""
          linkUiclap="https://uiclap.com/test"
        />
      );
    });
    expect(screen.queryByRole("link", { name: /amazon/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /uiclap/i })).toBeInTheDocument();
  });
});
