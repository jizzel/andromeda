"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { Stethoscope, BookOpen, Users, Briefcase, Layers, type LucideIcon } from "lucide-react";
import type { ContentPillar } from "@/types/proposal";

interface ContentPillarsSectionProps {
  pillars: ContentPillar[];
}

const iconMap: Record<string, LucideIcon> = {
  Stethoscope,
  BookOpen,
  Users,
  Briefcase,
  Layers,
};

export function ContentPillarsSection({ pillars }: ContentPillarsSectionProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="pillars-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="pillars-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Content Strategy
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12 max-w-3xl">
            Content is developed around four pillars. Each one carries a clear editorial purpose
            — together they balance authority, education, trust, and brand voice.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pillars.map((pillar, idx) => {
            const Icon = (pillar.icon && iconMap[pillar.icon]) || Layers;
            return (
              <ScrollReveal key={pillar.id} delay={0.1 * (idx + 1)}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full p-6 rounded-lg bg-[var(--andromeda-secondary)]/60 border border-white/10 light:border-black/10"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
                      <Icon className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)]">
                      {pillar.title}
                    </h3>
                  </div>
                  {pillar.description && (
                    <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4 leading-relaxed">
                      {pillar.description}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {pillar.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-[var(--andromeda-text-secondary)] leading-relaxed"
                      >
                        <span className="text-[var(--andromeda-accent-beige)]/60 shrink-0">·</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
