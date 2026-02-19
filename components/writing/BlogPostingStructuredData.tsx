import { profile } from "@/constants/profile";
import type { WritingPost } from "@/lib/content";

interface BlogPostingStructuredDataProps {
  post: WritingPost;
}

export function BlogPostingStructuredData({ post }: BlogPostingStructuredDataProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    image: {
      "@type": "ImageObject",
      url: `${profile.siteUrl}/writing/${post.slug}/opengraph-image`,
      width: 1200,
      height: 630,
    },
    author: {
      "@type": "Person",
      name: profile.name,
      url: profile.siteUrl,
    },
    publisher: {
      "@type": "Person",
      name: profile.name,
      url: profile.siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${profile.siteUrl}/writing/${post.slug}`,
    },
    articleSection: post.category,
    keywords: post.tags.join(", "),
    timeRequired: `PT${post.readTime}M`,
    inLanguage: "en-US",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
