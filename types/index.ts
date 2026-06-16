export interface Book {
  id: number;
  title: string;
  description: string;
  image: string;
  linkAmazon: string;
  linkUiclap: string;
  direction: "left" | "right";
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
