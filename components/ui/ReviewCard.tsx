import type { Review } from "@/types";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <figure className="bg-foreground/[0.03] border border-foreground/10 rounded-2xl p-6">
      <blockquote className="font-sans text-sm text-foreground/70 leading-relaxed italic mb-4">
        &ldquo;{review.text}&rdquo;
      </blockquote>
      <figcaption className="font-sans text-xs font-semibold text-foreground/50 uppercase tracking-widest">
        {review.author}
      </figcaption>
    </figure>
  );
}
