import Link from "next/link";
import { FiInstagram } from "@react-icons/all-files/fi/FiInstagram";
import { FiMail } from "@react-icons/all-files/fi/FiMail";
import DataContact from "@/public/data/DataContact";

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

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground/5 border-t border-foreground/10 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Coluna 1: Logo + tagline */}
          <div className="flex flex-col gap-2">
            <Link href="/" className="font-serif text-lg font-semibold text-foreground">
              Amanda Boaviagem
            </Link>
            <p className="text-sm text-foreground/60 font-sans">
              Escritora da Esperança
            </p>
          </div>

          {/* Coluna 2: Navegação */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-foreground/50 mb-1">
              Navegação
            </h3>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-sans text-foreground/70 hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Coluna 3: Redes sociais */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-foreground/50 mb-1">
              Contato
            </h3>
            <a
              href={DataContact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex items-center gap-2 text-sm font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              <FiInstagram size={16} />
              {DataContact.instagram}
            </a>
            <a
              href={`mailto:${DataContact.email}`}
              aria-label="E-mail"
              className="flex items-center gap-2 text-sm font-sans text-foreground/70 hover:text-foreground transition-colors"
            >
              <FiMail size={16} />
              {DataContact.email}
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-foreground/10 text-center">
          <p className="text-xs font-sans text-foreground/40">
            &copy; {currentYear} Amanda Boaviagem. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
