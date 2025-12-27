"use client";

import { motion } from "framer-motion";
import { useScrollPosition } from "@/lib/hooks/useScrollPosition";
import { HeroBackground } from "./HeroBackground";
import { HeroContent } from "./HeroContent";
import { StatsBar } from "./StatsBar";

export function HeroSection() {
  const scrollPosition = useScrollPosition();

  // Calculate hero height based on scroll
  // Initial: 80vh, compresses to 50vh at 300px scroll
  const heroHeight = Math.max(50, 80 - (scrollPosition / 300) * 30);

  return (
    <motion.section
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{
        height: `${heroHeight}vh`,
        minHeight: "50vh",
      }}
      transition={{
        duration: 0.3,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      <HeroBackground />
      <HeroContent />
      <StatsBar />
    </motion.section>
  );
}
