"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { WritingPost, PostCategory } from "@/lib/content";
import { CategoryFilter } from "./CategoryFilter";
import { PostCard } from "./PostCard";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface WritingContentProps {
  posts: WritingPost[];
  categories: PostCategory[];
}

export function WritingContent({ posts, categories }: WritingContentProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { trackWritingCategoryFiltered } = useAnalytics();

  const filteredPosts = activeCategory
    ? posts.filter((post) => post.category === activeCategory)
    : posts;

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    if (category) {
      trackWritingCategoryFiltered({ category });
    }
  };

  return (
    <main className="relative w-full min-h-screen bg-[var(--andromeda-primary)] pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <ScrollReveal>
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4 text-[var(--andromeda-text-primary)]">
              Writing
            </h1>
            <p className="text-lg text-[var(--andromeda-text-secondary)] max-w-2xl">
              Thoughts on systems design, monitoring, automation, and the practice
              of building software that works.
            </p>
          </div>
        </ScrollReveal>

        {/* Category Filter */}
        <ScrollReveal delay={0.1}>
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </ScrollReveal>

        {/* Posts Count */}
        <motion.p
          className="text-sm text-[var(--andromeda-text-secondary)] mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          {activeCategory && ` in ${activeCategory}`}
        </motion.p>

        {/* Posts Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        ) : (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-[var(--andromeda-text-secondary)]">
              No posts found in this category.
            </p>
          </motion.div>
        )}
      </div>
    </main>
  );
}
