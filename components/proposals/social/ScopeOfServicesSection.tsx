"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Camera,
  Palette,
  MessageCircle,
  BarChart3,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import type { ScopeArea } from "@/types/proposal";

interface ScopeOfServicesSectionProps {
  areas: ScopeArea[];
}

const iconMap: Record<string, LucideIcon> = {
  ClipboardList,
  Camera,
  Palette,
  MessageCircle,
  BarChart3,
};

export function ScopeOfServicesSection({ areas }: ScopeOfServicesSectionProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="scope-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="scope-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Scope of Services
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12 max-w-3xl">
            What we deliver each month, end to end.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area, idx) => {
            const Icon = (area.icon && iconMap[area.icon]) || ClipboardList;
            return (
              <ScrollReveal key={area.id} delay={0.08 * (idx + 1)}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full p-6 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
                      <Icon className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--andromeda-text-primary)]">
                      {area.title}
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {area.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-sm text-[var(--andromeda-text-secondary)] leading-relaxed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--andromeda-accent-beige)]/60 shrink-0 mt-0.5" />
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
