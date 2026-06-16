import { render, screen } from "@testing-library/react";
import Header from "@/components/layout/Header";

jest.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/",
    push: jest.fn(),
  }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn(), resolvedTheme: "light" }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@heroui/react", () => ({
  // Desestrutura e descarta props específicas do HeroUI para não poluir o DOM
  Navbar: ({ children }: { children: React.ReactNode }) => (
    <nav role="navigation">{children}</nav>
  ),
  NavbarBrand: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarMenuToggle: () => <button aria-label="Abrir menu" />,
  NavbarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({ children, isIconOnly: _i, variant: _v, onPress, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isIconOnly?: boolean; variant?: string; onPress?: () => void }) => (
    <button onClick={onPress} {...props}>{children}</button>
  ),
}));

describe("Header", () => {
  it("renders without crashing", () => {
    render(<Header />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders the author name as logo", () => {
    render(<Header />);
    expect(screen.getByText("Amanda Boaviagem")).toBeInTheDocument();
  });

  it('link "Livros" points to #livros anchor', () => {
    render(<Header />);
    // Links appear in both desktop nav and mobile drawer
    const livrosLinks = screen.getAllByRole("link", { name: /livros/i });
    expect(livrosLinks.length).toBeGreaterThan(0);
    expect(livrosLinks[0]).toHaveAttribute("href", "/#livros");
  });

  it('link "Blog" points to /blog route', () => {
    render(<Header />);
    const blogLinks = screen.getAllByRole("link", { name: /blog/i });
    expect(blogLinks.length).toBeGreaterThan(0);
    expect(blogLinks[0]).toHaveAttribute("href", "/blog");
  });

  it("renders theme toggle button", () => {
    render(<Header />);
    const toggleButtons = screen.getAllByRole("button", { name: /alternar tema/i });
    expect(toggleButtons.length).toBeGreaterThan(0);
  });
});
