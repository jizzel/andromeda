"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { ArrowUpRight } from "lucide-react";
import type { DigitalPresenceCrossSell } from "@/types/proposal";

interface CrossSellSectionProps {
  crossSell: DigitalPresenceCrossSell;
}

export function CrossSellSection({ crossSell }: CrossSellSectionProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="crosssell-heading"
    >
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="p-8 rounded-xl bg-[var(--andromeda-secondary)]/60 border border-[var(--andromeda-accent-beige)]/20">
            <div className="flex items-center gap-2 mb-4 text-[var(--andromeda-accent-beige)]">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Looking ahead</span>
            </div>
            <h2
              id="crosssell-heading"
              className="text-2xl md:text-3xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
            >
              {crossSell.title || "Digital Presence Enhancement"}
            </h2>
            <p className="text-base text-[var(--andromeda-text-secondary)] mb-6 leading-relaxed">
              {crossSell.intro}
            </p>
            <ul className="space-y-2 mb-4">
              {crossSell.opportunities.map((item, i) => (
                <li
                  key={i}
                  className="flex gap-2 text-sm text-[var(--andromeda-text-secondary)] leading-relaxed"
                >
                  <span className="text-[var(--andromeda-accent-beige)]/60 shrink-0">·</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {crossSell.note && (
              <p className="text-xs text-[var(--andromeda-accent-beige)]/80 mt-4">
                {crossSell.note}
              </p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
