"use client";

import { CheckCircle, AlertTriangle } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { DecisionCriteria } from "@/types/proposal";

interface ProposalDecisionFrameworkProps {
  option1Criteria: DecisionCriteria;
  option2Criteria: DecisionCriteria;
  warnings: string[];
}

export function ProposalDecisionFramework({
  option1Criteria,
  option2Criteria,
  warnings,
}: ProposalDecisionFrameworkProps) {
  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              Decision Framework
            </h2>
            <p className="text-[var(--andromeda-text-secondary)] max-w-2xl mx-auto">
              Use these criteria to determine which implementation approach best serves your
              organization's needs.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Option 1 Criteria */}
          <ScrollReveal delay={0.1}>
            <div className="p-6 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-4">
                Choose {option1Criteria.optionName} If:
              </h3>
              <ul className="space-y-3">
                {option1Criteria.criteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="flex-shrink-0 mt-0.5 text-blue-400" />
                    <span className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                      {criterion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Option 2 Criteria */}
          <ScrollReveal delay={0.2}>
            <div className="p-6 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-4">
                Choose {option2Criteria.optionName} If:
              </h3>
              <ul className="space-y-3">
                {option2Criteria.criteria.map((criterion, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle size={18} className="flex-shrink-0 mt-0.5 text-amber-400" />
                    <span className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                      {criterion}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {/* Warnings */}
        <ScrollReveal delay={0.3}>
          <div className="p-6 rounded-xl bg-red-500/10 border-2 border-red-500/30">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="text-lg font-bold text-red-300">Do NOT Attempt To:</h3>
            </div>
            <ul className="space-y-3">
              {warnings.map((warning, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-300 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-red-200/90 leading-relaxed">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
