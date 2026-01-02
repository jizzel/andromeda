"use client";

import { motion, useTransform } from "framer-motion";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";
import { useEffect, useState } from "react";

export function StatsBar() {
  const scrollPosition = useScrollPosition();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Expand when scrolled 20vh (roughly 200px on most screens)
  const isExpanded = scrollPosition > 200;

  // Calculate dynamic bottom position and opacity based on scroll
  // On mobile: Move up and fade out as user scrolls to prevent overlap
  // On desktop: Keep static position
  const bottomPosition = isMobile
    ? Math.max(8, 32 - (scrollPosition / 300) * 24) // 32px -> 8px (2rem -> 0.5rem)
    : 32; // 2rem fixed on desktop

  const opacity = isMobile
    ? Math.max(0.3, 1 - (scrollPosition / 400)) // Fade to 30% on mobile
    : 1; // Full opacity on desktop

  return (
    <motion.div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{
        bottom: `${bottomPosition}px`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: opacity }}
      transition={{
        delay: 0.5,
        duration: 0.3,
        ease: [0.33, 1, 0.68, 1]
      }}
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
