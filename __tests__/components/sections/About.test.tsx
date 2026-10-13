import { render, screen } from "@testing-library/react";
import About from "@/components/sections/About";
import type { AboutData } from "@/types";

const about: AboutData = {
  title: "Sobre mim",
  body: "Texto de abertura da autora.",
  body2: "Amanda Boaviagem é escritora e sonhadora.",
  image: "/images/session02/amanda.jpeg",
};

describe("About", () => {
  it("renders without crashing", () => {
    render(<About id="sobre" about={about} />);
  });

  it("renders section title", () => {
    render(<About id="sobre" about={about} />);
    expect(screen.getByText(/sobre mim/i)).toBeInTheDocument();
  });

  it("renders biography text", () => {
    render(<About id="sobre" about={about} />);
    expect(screen.getByText(/amanda boaviagem é escritora/i)).toBeInTheDocument();
  });

  it("renders the content received by props", () => {
    render(<About id="sobre" about={{ ...about, title: "Outro titulo", body: "Outro corpo" }} />);
    expect(screen.getByText("Outro titulo")).toBeInTheDocument();
    expect(screen.getByText("Outro corpo")).toBeInTheDocument();
  });

  it("renders the author photo", () => {
    render(<About id="sobre" about={about} />);
    const img = screen.getByRole("img", { name: /amanda boaviagem/i });
    expect(img).toBeInTheDocument();
  });

  it("renders with the given id attribute", () => {
    const { container } = render(<About id="sobre" about={about} />);
    expect(container.querySelector("#sobre")).toBeInTheDocument();
  });
});
