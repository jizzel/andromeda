"use client";

import { FileText, Scale, AlertOctagon } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { IPTerms } from "@/types/proposal";

interface ProposalIPRightsProps {
  option1Terms: IPTerms;
  option2Terms: IPTerms;
  warningMessage: string;
}

export function ProposalIPRights({ option1Terms, option2Terms, warningMessage }: ProposalIPRightsProps) {
  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Scale size={24} className="text-[var(--andromeda-accent-beige)]" />
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)]">
                Intellectual Property & Revenue Sharing
              </h2>
            </div>
            <p className="text-[var(--andromeda-text-secondary)]">
              Clear ownership and revenue terms must be established before proceeding
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Option 1 Terms */}
          <ScrollReveal delay={0.1}>
            <div className="p-6 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-blue-400" />
                <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)]">
                  For {option1Terms.optionName}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-2">
                    Ownership
                  </h4>
                  <ul className="space-y-2">
                    {option1Terms.ownership.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-2">
                    Terms
                  </h4>
                  <ul className="space-y-2">
                    {option1Terms.terms.map((term, i) => (
                      <li key={i} className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                        • {term}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Option 2 Terms */}
          <ScrollReveal delay={0.2}>
            <div className="p-6 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-amber-400" />
                <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)]">
                  For {option2Terms.optionName}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-2">
                    Requires Explicit Agreement On
                  </h4>
                  <ul className="space-y-2">
                    {option2Terms.ownership.map((item, i) => (
                      <li key={i} className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-2">
                    Terms
                  </h4>
                  <ul className="space-y-2">
                    {option2Terms.terms.map((term, i) => (
                      <li key={i} className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                        • {term}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Warning Banner */}
        <ScrollReveal delay={0.3}>
          <div className="p-6 rounded-xl bg-red-500/20 border-2 border-red-500/40">
            <div className="flex items-center justify-center gap-3">
              <AlertOctagon size={24} className="text-red-300 flex-shrink-0" />
              <p className="text-lg font-bold text-red-200 text-center">{warningMessage}</p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
