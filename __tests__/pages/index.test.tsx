/**
 * Smoke test: home page renders without crashing.
 * Full section tests live alongside each component.
 */
import { render } from "@testing-library/react";
import Home from "@/pages/index";

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
    const { container } = render(<Home />);
    expect(container).toBeInTheDocument();
  });
});
