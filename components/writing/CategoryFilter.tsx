"use client";

import { motion } from "framer-motion";
import type { PostCategory } from "@/lib/content";

interface CategoryFilterProps {
  categories: PostCategory[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-12">
      <motion.button
        onClick={() => onCategoryChange(null)}
        className={`px-4 py-2 rounded transition-colors ${
          activeCategory === null
            ? "bg-[var(--andromeda-highlight)] text-white"
            : "bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        All
      </motion.button>

      {categories.map((category) => (
        <motion.button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded transition-colors ${
            activeCategory === category
              ? "bg-[var(--andromeda-highlight)] text-white"
              : "bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
        >
          {category}
        </motion.button>
      ))}
    </div>
  );
}
