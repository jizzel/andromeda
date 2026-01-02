"use client";

import { motion } from "framer-motion";
import { useBusinessCard } from "@/components/layout/BusinessCardContext";

export function HeroContent() {
  const { openBusinessCard } = useBusinessCard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.33, 1, 0.68, 1] }}
      className="relative z-10 flex flex-col items-start justify-center h-full max-w-4xl mx-auto px-6 pb-24 md:pb-16"
    >
      <h1 className="mb-6 leading-tight">
        Building Software That{" "}
        <button
          onClick={openBusinessCard}
          className="inline hover:text-[var(--andromeda-accent-beige)] transition-colors duration-200 cursor-pointer border-b border-transparent hover:border-[var(--andromeda-accent-beige)] focus:outline-none focus:border-[var(--andromeda-accent-beige)]"
          aria-label="Open business card"
        >
          Automates Operations
        </button>
      </h1>

      <p className="text-lg md:text-xl mb-4 max-w-3xl leading-relaxed text-[var(--andromeda-text-primary)]">
        I design and build production-ready software systems that replace manual
        workflows with reliable automation, from monitoring platforms to enterprise
        management systems.
      </p>

      <p className="text-sm md:text-base text-[var(--andromeda-text-secondary)]">
        Currently building and maintaining operational systems used daily in live
        production environments.
      </p>
    </motion.div>
  );
}
