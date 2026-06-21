import { FiInstagram } from "@react-icons/all-files/fi/FiInstagram";
import { FiMail } from "@react-icons/all-files/fi/FiMail";
import DataContact from "@/public/data/DataContact";

interface ContactProps {
  id: string;
}

export default function Contact({ id }: ContactProps) {
  const { instagram, instagramUrl, email } = DataContact;

  return (
    <section
      id={id}
      className="py-24 px-4 bg-foreground/[0.03]"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6">
          Contato
        </h2>
        <p className="font-sans text-foreground/60 mb-16">
          Entre em contato ou siga Amanda nas redes sociais.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          {/* Instagram */}
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="group flex flex-col items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
          >
            <span className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-foreground/20 group-hover:border-primary transition-colors">
              <FiInstagram size={28} />
            </span>
            <span className="font-sans text-sm font-medium">{instagram}</span>
          </a>

          {/* E-mail */}
          <a
            href={`mailto:${email}`}
            aria-label="E-mail"
            className="group flex flex-col items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
          >
            <span className="w-16 h-16 flex items-center justify-center rounded-full border-2 border-foreground/20 group-hover:border-primary transition-colors">
              <FiMail size={28} />
            </span>
            <span className="font-sans text-sm font-medium">{email}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
