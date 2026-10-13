import Image from "next/image";
import Link from "next/link";
import type { Book } from "@/types";

interface BookCoverProps {
  book: Book;
}

export default function BookCover({ book }: BookCoverProps) {
  return (
    <Link
      href={`/livros/${book.slug}`}
      className="group block relative aspect-[2/3] w-full rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
    >
      <Image
        src={book.image}
        alt={book.title}
        fill
        className="object-contain bg-foreground/5 p-2 group-hover:scale-105 transition-transform duration-300"
      />
    </Link>
  );
}
