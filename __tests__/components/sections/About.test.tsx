import { render, screen } from "@testing-library/react";
import About from "@/components/sections/About";

describe("About", () => {
  it("renders without crashing", () => {
    render(<About id="sobre" />);
  });

  it("renders section title", () => {
    render(<About id="sobre" />);
    expect(screen.getByText(/sobre mim/i)).toBeInTheDocument();
  });

  it("renders biography text", () => {
    render(<About id="sobre" />);
    expect(screen.getByText(/amanda boaviagem é escritora/i)).toBeInTheDocument();
  });

  it("renders the author photo", () => {
    render(<About id="sobre" />);
    const img = screen.getByRole("img", { name: /amanda boaviagem/i });
    expect(img).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<About id="sobre" />);
    expect(container.querySelector("#sobre")).toBeInTheDocument();
  });
});
