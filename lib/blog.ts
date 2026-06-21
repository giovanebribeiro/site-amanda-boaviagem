import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "@/types";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts: BlogPost[] = files.map((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const fullPath = path.join(BLOG_DIR, filename);
    const raw = fs.readFileSync(fullPath, "utf8");
    const { data } = matter(raw);

    return {
      slug,
      title: (data.title as string) ?? slug,
      date: (data.date as string) ?? "",
      excerpt: (data.excerpt as string) ?? "",
      ...(data.coverImage ? { coverImage: data.coverImage as string } : {}),
    };
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface PostWithContent extends BlogPost {
  content: string;
}

export function getPostBySlug(slug: string): PostWithContent | null {
  const extensions = [".mdx", ".md"];

  for (const ext of extensions) {
    const fullPath = path.join(BLOG_DIR, `${slug}${ext}`);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);

      return {
        slug,
        title: (data.title as string) ?? slug,
        date: (data.date as string) ?? "",
        excerpt: (data.excerpt as string) ?? "",
        ...(data.coverImage ? { coverImage: data.coverImage as string } : {}),
        content,
      };
    }
  }

  return null;
}
