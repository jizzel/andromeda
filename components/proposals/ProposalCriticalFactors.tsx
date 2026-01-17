"use client";

import { Target, DollarSign, Users, TrendingUp, Clock, Shield, LucideIcon } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { CriticalFactor } from "@/types/proposal";

interface ProposalCriticalFactorsProps {
  title: string;
  subtitle: string;
  factors: CriticalFactor[];
}

const iconMap: Record<string, LucideIcon> = {
  Target,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  Shield,
};

export function ProposalCriticalFactors({ title, subtitle, factors }: ProposalCriticalFactorsProps) {
  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              {title}
            </h2>
            <p className="text-[var(--andromeda-text-secondary)] max-w-2xl mx-auto">{subtitle}</p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {factors.map((factor, index) => {
            const Icon = iconMap[factor.icon] || Target;
            return (
              <ScrollReveal key={factor.id} delay={0.1 * (index + 1)}>
                <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 hover:border-amber-500/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <Icon size={20} className="text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-amber-300 mb-2">{factor.title}</h3>
                      <p className="text-sm text-amber-200/80 leading-relaxed">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
