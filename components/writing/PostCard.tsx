"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Clock, Calendar } from "lucide-react";
import type { WritingPost } from "@/lib/content";

interface PostCardProps {
  post: WritingPost;
  index: number;
}

export function PostCard({ post, index }: PostCardProps) {
  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      <Link href={`/writing/${post.slug}`} className="block group">
        <motion.div
          className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10 h-full transition-all duration-200"
          style={{
            boxShadow: "var(--shadow-1)",
          }}
          whileHover={{
            y: -4,
            boxShadow: "var(--shadow-2)",
          }}
          transition={{ duration: 0.2 }}
        >
          {/* Category Badge */}
          <div className="mb-3">
            <span className="inline-block px-3 py-1 rounded text-xs font-medium bg-[var(--andromeda-highlight)]/20 text-[var(--andromeda-highlight)]">
              {post.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold mb-3 text-[var(--andromeda-text-primary)] group-hover:text-[var(--andromeda-highlight)] transition-colors">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-[var(--andromeda-text-secondary)] mb-4 line-clamp-2">
            {post.excerpt}
          </p>

          {/* Meta Info */}
          <div className="flex items-center gap-4 text-sm text-[var(--andromeda-text-secondary)]">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{post.readTime} min read</span>
            </div>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10 light:border-black/10">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-[var(--andromeda-text-secondary)]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </Link>
    </motion.article>
  );
}
