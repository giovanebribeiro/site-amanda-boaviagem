export interface Review {
  author: string;
  text: string;
}

export interface Book {
  id: number;
  slug: string;
  title: string;
  description: string;
  image: string;
  linkAmazon: string;
  linkUiclap: string;
  direction: "left" | "right";
  releaseDate: string;
  slogan: string;
  reviews: Review[];
}

export interface BannerItem {
  id: number;
  title: string;
  src: string;
}

export interface TestimonialItem {
  id: number;
  title: string;
  src: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage?: string;
}

export interface ContactData {
  instagram: string;
  instagramUrl: string;
  email: string;
}
