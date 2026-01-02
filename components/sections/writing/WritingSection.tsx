"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";

export function WritingSection() {
  return (
    <section
      className="relative w-full py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-label="Writing section"
    >
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="flex flex-col items-start gap-6 max-w-2xl">
            {/* Framing sentence - not a header */}
            <p className="text-lg md:text-xl text-[var(--andromeda-text-secondary)]">
              Articles on software engineering, system design, and the practical realities of building reliable software that holds up in production and scales correctly.
            </p>

            {/* Minimal link to writing page */}
            <Link href="/writing">
              <motion.span
                className="inline-flex items-center gap-2 text-[var(--andromeda-text-primary)] hover:text-[var(--andromeda-highlight)] transition-colors text-base"
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2, ease: [0.33, 1, 0.68, 1] }}
              >
                <span>View writing</span>
                <ArrowUpRight size={18} />
              </motion.span>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
