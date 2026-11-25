import Head from "next/head";
import Link from "next/link";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PostCard from "@/components/blog/PostCard";
import { getAllPosts } from "@/lib/blog";
import { getContactData } from "@/lib/contact";
import { getSiteData } from "@/lib/site";
import type { BlogPost, ContactData, SiteData } from "@/types";

interface BlogIndexProps {
  posts: BlogPost[];
  contact: ContactData;
  site: SiteData;
}

export default function BlogIndex({
  posts,
  contact,
  site,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Blog | Amanda Boaviagem</title>
        <meta
          name="description"
          content="Reflexões, histórias e novidades de Amanda Boaviagem."
        />
      </Head>

      <Header slogan={site.slogan} />

      <main className="min-h-screen bg-background text-foreground pt-16">
        {/* Hero da página */}
        <section className="py-20 px-4 text-center">
          <h1 className="font-serif text-5xl font-bold text-foreground mb-4">
            {site.blogTitle}
          </h1>
          <p className="font-sans text-foreground/60 max-w-xl mx-auto">
            {site.blogSubtitle}
          </p>
        </section>

        {/* Lista de posts */}
        <section className="max-w-4xl mx-auto px-4 pb-24">
          {posts.length === 0 ? (
            <p className="text-center font-sans text-foreground/50">
              Nenhum post publicado ainda.
            </p>
          ) : (
            <div className="grid gap-8">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
          )}
        </section>

        {/* Link de volta para home */}
        <div className="text-center pb-16">
          <Link
            href="/"
            className="font-sans text-sm text-primary hover:underline"
          >
            &larr; Voltar para a home
          </Link>
        </div>
      </main>

      <Footer contact={contact} slogan={site.slogan} />
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const posts = getAllPosts();
  return { props: { posts, contact: getContactData(), site: getSiteData() } };
};
