import { render, screen } from "@testing-library/react";
import BlogIndex, { getStaticProps } from "@/pages/blog/index";
import type { BlogPost, ContactData } from "@/types";

jest.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/blog", push: jest.fn() }),
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
  Button: ({ children, isIconOnly: _i, variant: _v, onPress, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { isIconOnly?: boolean; variant?: string; onPress?: () => void }) => (
    <button onClick={onPress} {...props}>{children}</button>
  ),
}));

const contact: ContactData = {
  instagram: "@pagina90_",
  instagramUrl: "https://www.instagram.com/pagina90_/",
  email: "amandaboaviagem@gmail.com",
};

const mockPosts: BlogPost[] = [
  {
    slug: "primeiro-post",
    title: "Meu primeiro post",
    date: "2024-01-15",
    excerpt: "Breve descricao do post.",
  },
];

describe("BlogIndex page", () => {
  it("renders without crashing", () => {
    render(<BlogIndex posts={mockPosts} contact={contact} />);
  });

  it("renders page title", () => {
    render(<BlogIndex posts={mockPosts} contact={contact} />);
    expect(screen.getByRole("heading", { name: /blog/i })).toBeInTheDocument();
  });

  it("renders each post card with title", () => {
    render(<BlogIndex posts={mockPosts} contact={contact} />);
    expect(screen.getAllByText("Meu primeiro post").length).toBeGreaterThan(0);
  });

  it("renders each post card with excerpt", () => {
    render(<BlogIndex posts={mockPosts} contact={contact} />);
    expect(screen.getByText("Breve descricao do post.")).toBeInTheDocument();
  });

  it("getStaticProps returns posts array", async () => {
    const result = await getStaticProps({});
    expect(result).toHaveProperty("props");
    expect((result as { props: { posts: BlogPost[] } }).props).toHaveProperty("posts");
    expect(
      Array.isArray((result as { props: { posts: BlogPost[] } }).props.posts)
    ).toBe(true);
  });

  it("getStaticProps provides the contact data for the footer", async () => {
    const result = await getStaticProps({});
    const { props } = result as { props: { contact: ContactData } };
    expect(props.contact.email).toBe("amandaboaviagem@gmail.com");
  });
});
