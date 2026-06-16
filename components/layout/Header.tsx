import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
} from "@heroui/react";
import ThemeToggle from "./ThemeToggle";

interface NavLink {
  label: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { label: "Início", href: "/#inicio" },
  { label: "Sobre", href: "/#sobre" },
  { label: "Livros", href: "/#livros" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/#contato" },
];

export default function Header() {
  const { pathname } = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (href: string): boolean => {
    if (href === "/blog") return pathname.startsWith("/blog");
    return false;
  };

  return (
    <Navbar
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
      isBordered
      isBlurred
      maxWidth="xl"
      className="bg-background/95 backdrop-blur-sm"
      role="navigation"
    >
      {/* Logo — esquerda */}
      <NavbarContent justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          className="sm:hidden"
        />
        <NavbarBrand>
          <Link href="/" className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-foreground">
              Amanda Boaviagem
            </span>
            <span className="text-xs text-foreground/60 font-sans hidden sm:block">
              Escritora da Esperança
            </span>
          </Link>
        </NavbarBrand>
      </NavbarContent>

      {/* Links — centro/direita desktop */}
      <NavbarContent justify="end" className="hidden sm:flex gap-1">
        {NAV_LINKS.map((link) => (
          <NavbarItem key={link.href} isActive={isActive(link.href)}>
            <Link
              href={link.href}
              className={`text-sm font-sans px-2 py-1 rounded transition-colors ${
                isActive(link.href)
                  ? "text-primary font-medium"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          </NavbarItem>
        ))}
        <NavbarItem>
          <ThemeToggle />
        </NavbarItem>
      </NavbarContent>

      {/* Menu mobile drawer */}
      <NavbarMenu className="pt-6 gap-2">
        {NAV_LINKS.map((link) => (
          <NavbarMenuItem key={link.href}>
            <Link
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={`text-base font-sans w-full block py-2 border-b border-foreground/10 ${
                isActive(link.href) ? "text-primary font-medium" : "text-foreground/80"
              }`}
            >
              {link.label}
            </Link>
          </NavbarMenuItem>
        ))}
        <NavbarMenuItem>
          <div className="pt-2">
            <ThemeToggle />
          </div>
        </NavbarMenuItem>
      </NavbarMenu>
    </Navbar>
  );
}
