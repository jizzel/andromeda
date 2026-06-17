"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { CalendarClock, Hourglass } from "lucide-react";
import type { EngagementTerms } from "@/types/proposal";

interface EngagementTermsSectionProps {
  engagement: EngagementTerms;
}

export function EngagementTermsSection({ engagement }: EngagementTermsSectionProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="engagement-heading"
    >
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <h2
            id="engagement-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Engagement Period
          </h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <ScrollReveal>
            <div className="p-5 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10">
              <div className="flex items-center gap-2 mb-2 text-[var(--andromeda-accent-beige)]">
                <Hourglass className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Minimum</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--andromeda-text-primary)]">
                {engagement.minimumMonths} {engagement.minimumMonths === 1 ? "month" : "months"}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="p-5 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10">
              <div className="flex items-center gap-2 mb-2 text-[var(--andromeda-accent-beige)]">
                <CalendarClock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wider font-semibold">Recommended</span>
              </div>
              <p className="text-2xl font-semibold text-[var(--andromeda-text-primary)]">
                {engagement.recommendedRange}
              </p>
            </div>
          </ScrollReveal>
        </div>

        {engagement.note && (
          <ScrollReveal delay={0.2}>
            <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
              {engagement.note}
            </p>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
