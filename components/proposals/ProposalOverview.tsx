"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Target } from "lucide-react";

interface ProposalOverviewProps {
  situation: string;
  solution: string;
  primaryObjective: string;
}

export function ProposalOverview({ situation, solution, primaryObjective }: ProposalOverviewProps) {
  return (
    <section
      id="overview"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="overview-heading"
    >
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <h2
            id="overview-heading"
            className="text-3xl md:text-4xl font-bold mb-12 text-[var(--andromeda-text-primary)]"
          >
            Project Overview
          </h2>
        </ScrollReveal>

        <div className="space-y-8">
          <ScrollReveal delay={0.1}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--andromeda-accent-beige)]">
                Current Situation
              </h3>
              <p className="text-base md:text-lg text-[var(--andromeda-text-secondary)] leading-relaxed">
                {situation}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--andromeda-accent-beige)]">
                Proposed Solution
              </h3>
              <p className="text-base md:text-lg text-[var(--andromeda-text-secondary)] leading-relaxed">
                {solution}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="mt-12 p-6 md:p-8 rounded-lg bg-gradient-to-br from-[var(--andromeda-accent-beige)]/10 to-[var(--andromeda-accent-beige)]/5 border border-[var(--andromeda-accent-beige)]/20">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-[var(--andromeda-accent-beige)]/20">
                  <Target className="w-6 h-6 text-[var(--andromeda-accent-beige)]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] mb-2">
                    Primary Objective
                  </h3>
                  <p className="text-base md:text-lg text-[var(--andromeda-text-primary)] leading-relaxed">
                    {primaryObjective}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
