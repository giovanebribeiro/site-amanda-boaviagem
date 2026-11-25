import path from "path";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

const fixtures = path.join(__dirname, "..", "fixtures", "content-blog");
const invalidFixtures = path.join(
  __dirname,
  "..",
  "fixtures",
  "content-blog-invalid",
);

// Integration tests: read real MDX files from content/blog/ and fixtures under __tests__/fixtures/content-blog*
describe("blog helpers", () => {
  describe("getAllPosts", () => {
    it("returns an array", () => {
      const posts = getAllPosts();
      expect(Array.isArray(posts)).toBe(true);
    });

    it("each post has required fields", () => {
      const posts = getAllPosts();
      for (const post of posts) {
        expect(post).toHaveProperty("slug");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("date");
        expect(post).toHaveProperty("excerpt");
      }
    });

    it("posts are sorted by date descending", () => {
      const posts = getAllPosts();
      for (let i = 1; i < posts.length; i++) {
        expect(posts[i - 1].date >= posts[i].date).toBe(true);
      }
    });
  });

  describe("getPostBySlug", () => {
    it("returns null for non-existent slug", () => {
      const result = getPostBySlug("nao-existe-este-slug");
      expect(result).toBeNull();
    });

    it("returns post data for valid slug", () => {
      const posts = getAllPosts();
      if (posts.length === 0) return; // skip if no posts yet
      const post = getPostBySlug(posts[0].slug);
      expect(post).not.toBeNull();
      expect(post).toHaveProperty("content");
      expect(post!.slug).toBe(posts[0].slug);
    });
  });

  describe("Em preparação", () => {
    it("excludes in-preparation posts from the listing", () => {
      const slugs = getAllPosts(fixtures).map((p) => p.slug);
      expect(slugs).toEqual(["publicado", "explicito"]);
    });

    it("treats an in-preparation post as not found by slug", () => {
      expect(getPostBySlug("rascunho", fixtures)).toBeNull();
      expect(getPostBySlug("publicado", fixtures)).not.toBeNull();
    });

    it("fails clearly when the flag is not a boolean", () => {
      expect(() => getAllPosts(invalidFixtures)).toThrow(
        /ruim\.mdx.*inPreparation/,
      );
    });
  });
});
