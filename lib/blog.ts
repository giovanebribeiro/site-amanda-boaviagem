import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogPost } from "@/types";
import {
  parsePostFrontmatter,
  type PostFrontmatter,
} from "@/shared/content-schema";

const DEFAULT_ROOT = path.join(process.cwd(), "content");

function publishedPostOrNull(
  slug: string,
  frontmatter: PostFrontmatter,
): BlogPost | null {
  const { inPreparation, ...fields } = frontmatter;
  return inPreparation ? null : { slug, ...fields };
}

export function getAllPosts(contentRoot: string = DEFAULT_ROOT): BlogPost[] {
  const blogDir = path.join(contentRoot, "blog");
  if (!fs.existsSync(blogDir)) {
    return [];
  }

  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files.flatMap((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const raw = fs.readFileSync(path.join(blogDir, filename), "utf8");
    const { data } = matter(raw);
    const post = publishedPostOrNull(
      slug,
      parsePostFrontmatter(data, slug, filename),
    );
    return post ? [post] : [];
  });

  return posts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface PostWithContent extends BlogPost {
  content: string;
}

export function getPostBySlug(
  slug: string,
  contentRoot: string = DEFAULT_ROOT,
): PostWithContent | null {
  const blogDir = path.join(contentRoot, "blog");
  const extensions = [".mdx", ".md"];

  for (const ext of extensions) {
    const filename = `${slug}${ext}`;
    const fullPath = path.join(blogDir, filename);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(raw);

      const post = publishedPostOrNull(
        slug,
        parsePostFrontmatter(data, slug, filename),
      );
      return post ? { ...post, content } : null;
    }
  }

  return null;
}
