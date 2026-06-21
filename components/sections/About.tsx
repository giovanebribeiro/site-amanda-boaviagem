import Image from "next/image";
import DataAbout from "@/public/data/DataAbout";

interface AboutProps {
  id: string;
}

export default function About({ id }: AboutProps) {
  const { title, body, body2, image } = DataAbout;

  return (
    <section
      id={id}
      className="py-24 px-4 bg-foreground/[0.03]"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground text-center mb-16">
          {title}
        </h2>

        <div className="flex flex-col md:flex-row items-center gap-12">
          {/* Foto */}
          <div className="flex-shrink-0">
            <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={image}
                alt="Amanda Boaviagem"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Texto */}
          <div className="flex-1 space-y-6">
            <p className="font-sans text-lg text-foreground/80 leading-relaxed italic">
              {body}
            </p>
            <p className="font-sans text-base text-foreground/70 leading-relaxed">
              {body2}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
