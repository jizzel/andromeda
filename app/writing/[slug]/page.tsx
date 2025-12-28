import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { getPostBySlug, getAllPosts, getRelatedPosts } from "@/lib/content";
import { PostWrapper } from "@/components/writing/PostWrapper";
import { MDXContent } from "@/components/writing/MDXContent";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ReadingProgress } from "@/components/writing/ReadingProgress";
import { BlogPostingStructuredData } from "@/components/writing/BlogPostingStructuredData";
import type { Metadata } from "next";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} | Attakorah`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedAt,
      authors: ["Joseph Attakorah"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <PostWrapper slug={post.slug} category={post.category} readTime={post.readTime}>
      <BlogPostingStructuredData post={post} />
      <ReadingProgress />
      <main className="relative w-full min-h-screen bg-[var(--andromeda-primary)] pt-24 pb-24 px-6">
        {/* Back Button */}
        <div className="max-w-3xl mx-auto mb-8">
          <Link
            href="/writing"
            className="inline-flex items-center gap-2 text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)] transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Writing</span>
          </Link>
        </div>

        <article className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Writing", href: "/writing" },
              { label: post.title },
            ]}
          />

          {/* Header */}
          <ScrollReveal>
            <header className="mb-12">
              {/* Category Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-[var(--andromeda-highlight)]/20 text-[var(--andromeda-highlight)]">
                  {post.category}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--andromeda-text-secondary)] mb-6">
                <div className="flex items-center gap-2">
                  <Calendar size={16} />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{post.readTime} min read</span>
                </div>
              </div>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-sm text-[var(--andromeda-text-secondary)]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </header>
          </ScrollReveal>

          {/* Content */}
          <ScrollReveal delay={0.1}>
            <div className="max-w-none">
              {post.content && <MDXContent content={post.content} />}
            </div>
          </ScrollReveal>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <ScrollReveal delay={0.2}>
              <div className="mt-16 pt-8 border-t border-white/10 dark:border-white/10 light:border-black/10">
                <h2 className="text-2xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
                  Related Posts
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/writing/${relatedPost.slug}`}
                      className="block group"
                    >
                      <div className="bg-[var(--andromeda-secondary)] rounded-lg p-4 border border-white/10 dark:border-white/10 light:border-black/10 transition-all duration-200 hover:translate-x-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-[var(--andromeda-text-primary)] group-hover:text-[var(--andromeda-highlight)] transition-colors mb-1">
                              {relatedPost.title}
                            </h3>
                            <p className="text-sm text-[var(--andromeda-text-secondary)] line-clamp-1">
                              {relatedPost.excerpt}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--andromeda-text-secondary)] whitespace-nowrap">
                            {relatedPost.readTime} min
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}
        </article>
      </main>
    </PostWrapper>
  );
}
