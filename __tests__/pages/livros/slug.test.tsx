import { render, screen } from "@testing-library/react";
import BookPage, {
  getStaticPaths,
  getStaticProps,
} from "@/pages/livros/[slug]";
import type { Book } from "@/types";

jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/livros/[slug]", push: jest.fn() }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn(), resolvedTheme: "light" }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@heroui/react", () => ({
  Navbar: ({ children }: { children: React.ReactNode }) => <nav role="navigation">{children}</nav>,
  NavbarBrand: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarMenuToggle: () => <button aria-label="Abrir menu" />,
  NavbarMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  NavbarMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    isIconOnly: _i,
    variant: _v,
    onPress,
    ...props
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isIconOnly?: boolean;
    variant?: string;
    onPress?: () => void;
  }) => (
    <button onClick={onPress} {...props}>
      {children}
    </button>
  ),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const mockBook: Book = {
  id: 4,
  slug: "amor-nos-tempos-de-quarentena-2a-ed",
  title: "Amor nos Tempos de Quarentena - Amanda Boaviagem (2a Ed.)",
  description: "Amor e Morte andam lado a lado.",
  image: "/images/session03/book1.png",
  linkAmazon: "https://amazon.com/test",
  linkUiclap: "https://uiclap.com/test",
  direction: "right",
  releaseDate: "2022-06-01",
  slogan: "A edição definitiva de um romance que emocionou o Brasil.",
  reviews: [
    { author: "Leitora G", text: "Reli na segunda edição e me emocionei ainda mais." },
    { author: "Leitora H", text: "Uma obra atemporal." },
  ],
};

describe("BookPage", () => {
  it("renders without crashing", () => {
    render(<BookPage book={mockBook} />);
  });

  it("renders the book title as h1", () => {
    render(<BookPage book={mockBook} />);
    expect(
      screen.getByRole("heading", { level: 1, name: /amor nos tempos de quarentena/i })
    ).toBeInTheDocument();
  });

  it("renders the slogan", () => {
    render(<BookPage book={mockBook} />);
    expect(screen.getByText(/edição definitiva/i)).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<BookPage book={mockBook} />);
    expect(screen.getByText(/amor e morte andam lado a lado/i)).toBeInTheDocument();
  });

  it("renders the Amazon buy link when linkAmazon is non-empty", () => {
    render(<BookPage book={mockBook} />);
    expect(screen.getByRole("link", { name: /amazon/i })).toBeInTheDocument();
  });

  it("renders all review cards", () => {
    render(<BookPage book={mockBook} />);
    expect(screen.getByText(/reli na segunda edição e me emocionei ainda mais/i)).toBeInTheDocument();
    expect(screen.getByText(/uma obra atemporal/i)).toBeInTheDocument();
  });

  it("renders the cover image", () => {
    render(<BookPage book={mockBook} />);
    expect(screen.getByRole("img", { name: /amor nos tempos/i })).toBeInTheDocument();
  });
});

describe("BookPage — getStaticPaths", () => {
  it("generates a path for each book slug in DataStore", async () => {
    const result = await getStaticPaths({});
    expect(result.fallback).toBe(false);
    expect(result.paths.length).toBeGreaterThan(0);
    // Every path should have a slug param
    for (const path of result.paths) {
      expect(typeof (path as { params: { slug: string } }).params.slug).toBe("string");
    }
  });

  it("includes the known slugs", async () => {
    const result = await getStaticPaths({});
    const slugs = result.paths.map(
      (p) => (p as { params: { slug: string } }).params.slug
    );
    expect(slugs).toContain("amor-nos-tempos-de-quarentena-2a-ed");
    expect(slugs).toContain("amor-nos-tempos-de-quarentena");
  });
});

describe("BookPage — getStaticProps", () => {
  it("returns notFound for an unknown slug", async () => {
    const result = await getStaticProps({ params: { slug: "slug-inexistente" } });
    expect(result).toHaveProperty("notFound", true);
  });

  it("returns the book data for a valid slug", async () => {
    const result = await getStaticProps({
      params: { slug: "amor-nos-tempos-de-quarentena-2a-ed" },
    });
    expect(result).toHaveProperty("props");
    const { props } = result as { props: { book: Book } };
    expect(props.book.slug).toBe("amor-nos-tempos-de-quarentena-2a-ed");
  });
});
