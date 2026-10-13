export interface Review {
  author: string;
  text: string;
}

export interface BookLink {
  label: string;
  url: string;
  primary?: boolean;
}

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

export interface ContactData {
  instagram: string;
  instagramUrl: string;
  email: string;
}
