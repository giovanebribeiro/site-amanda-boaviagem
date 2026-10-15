export type {
  AboutData,
  BookLink,
  ContactData,
  Review,
} from "@/shared/content-schema";
import type { BookLink, Review } from "@/shared/content-schema";

export interface Book {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  links: BookLink[];
  direction: "left" | "right";
  releaseDate: string;
  slogan: string;
  reviews: Review[];
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
}
