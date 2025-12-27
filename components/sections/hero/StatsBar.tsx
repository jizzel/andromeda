"use client";

import { motion } from "framer-motion";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";

export function StatsBar() {
  const scrollPosition = useScrollPosition();

  // Expand when scrolled 20vh (roughly 200px on most screens)
  const isExpanded = scrollPosition > 200;

  return (
    <motion.div
      className="absolute bottom-8 left-0 right-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
    >
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          className="flex flex-wrap items-center gap-2 md:gap-4 text-sm md:text-base text-[var(--andromeda-text-secondary)] font-medium"
          animate={{
            height: "auto",
          }}
          transition={{
            duration: 0.3,
            ease: [0.33, 1, 0.68, 1],
          }}
        >
          <span>Software Engineer</span>
          <span className="text-[var(--andromeda-accent-beige)]">•</span>
          <span>Systems & Monitoring</span>
          <span className="text-[var(--andromeda-accent-beige)]">•</span>
          <span>Based in Accra</span>

          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={
              isExpanded
                ? { opacity: 1, width: "auto" }
                : { opacity: 0, width: 0 }
            }
            transition={{
              duration: 0.3,
              ease: [0.33, 1, 0.68, 1],
            }}
            className="overflow-hidden whitespace-nowrap"
          >
            <span className="text-[var(--andromeda-accent-beige)]"> • </span>
            Working Globally
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
