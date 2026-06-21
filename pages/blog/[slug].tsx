import Head from "next/head";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import type { BlogPost } from "@/types";

interface PostPageProps {
  post: BlogPost;
  mdxSource: MDXRemoteSerializeResult;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PostPage({
  post,
  mdxSource,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{post.title} | Amanda Boaviagem</title>
        <meta name="description" content={post.excerpt} />
      </Head>

      <Header />

      <main className="min-h-screen bg-background text-foreground pt-16">
        <article className="max-w-3xl mx-auto px-4 py-20">
          {/* Cabeçalho do post */}
          <header className="mb-12 text-center">
            <time
              dateTime={post.date}
              className="font-sans text-xs text-foreground/50 uppercase tracking-widest"
            >
              {formatDate(post.date)}
            </time>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6 leading-tight">
              {post.title}
            </h1>
            <p className="font-sans text-lg text-foreground/60 leading-relaxed">
              {post.excerpt}
            </p>
          </header>

          {/* Conteúdo MDX */}
          <div className="prose prose-lg prose-neutral dark:prose-invert max-w-none font-sans">
            <MDXRemote {...mdxSource} />
          </div>

          {/* Navegação de volta */}
          <div className="mt-16 pt-8 border-t border-foreground/10">
            <Link
              href="/blog"
              className="font-sans text-sm text-primary hover:underline"
            >
              &larr; Voltar para o Blog
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();
  const paths = posts.map((post) => ({ params: { slug: post.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<PostPageProps> = async ({
  params,
}) => {
  const slug = params?.slug as string;
  const post = getPostBySlug(slug);

  if (!post) {
    return { notFound: true };
  }

  const mdxSource = await serialize(post.content);

  return {
    props: {
      post: {
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        ...(post.coverImage ? { coverImage: post.coverImage } : {}),
      },
      mdxSource,
    },
  };
};
