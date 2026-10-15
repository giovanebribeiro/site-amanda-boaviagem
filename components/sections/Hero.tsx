import Image from "next/image";
import Link from "next/link";
import type { SiteData } from "@/types";

interface HeroProps {
  id: string;
  site: SiteData;
}

export default function Hero({ id, site }: HeroProps) {
  return (
    <section
      id={id}
      className="min-h-screen flex items-center bg-background py-24 px-4"
    >
      <div className="max-w-6xl mx-auto w-full flex flex-col-reverse md:flex-row items-center gap-12">
        {/* Texto */}
        <div className="flex-1 text-center md:text-left">
          <p className="font-sans text-sm uppercase tracking-widest text-primary mb-4">
            {site.slogan}
          </p>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
            Amanda
            <br />
            Boaviagem
          </h1>
          <p className="font-sans text-lg text-foreground/70 mb-8 max-w-md mx-auto md:mx-0">
            {site.heroWelcome}
          </p>
          <Link
            href="/#livros"
            className="inline-block font-sans font-medium px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Ver Livros
          </Link>
        </div>

        {/* Foto */}
        <div className="flex-shrink-0">
          <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden shadow-2xl border-4 border-primary/20">
            <Image
              src="/images/session02/amanda.jpeg"
              alt={site.heroPhotoAlt}
              fill
              className="object-cover object-top"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
