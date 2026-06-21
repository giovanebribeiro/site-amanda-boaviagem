import Link from "next/link";
import type { BlogPost } from "@/types";

interface PostCardProps {
  post: BlogPost;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PostCard({ post }: PostCardProps) {
  const { slug, title, date, excerpt } = post;

  return (
    <article className="group border border-foreground/10 rounded-2xl p-6 hover:shadow-md transition-shadow bg-background">
      <time
        dateTime={date}
        className="font-sans text-xs text-foreground/50 uppercase tracking-widest"
      >
        {formatDate(date)}
      </time>
      <h3 className="font-serif text-xl font-semibold text-foreground mt-2 mb-3 group-hover:text-primary transition-colors">
        <Link href={`/blog/${slug}`}>{title}</Link>
      </h3>
      <p className="font-sans text-sm text-foreground/60 leading-relaxed mb-4">
        {excerpt}
      </p>
      <Link
        href={`/blog/${slug}`}
        className="font-sans text-sm font-medium text-primary hover:underline"
      >
        Ler mais &rarr;
      </Link>
    </article>
  );
}
