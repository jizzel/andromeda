"use client";

import { Award } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { SubscriptionTier } from "@/types/proposal";

interface ProposalSubscriptionTiersProps {
  tiers: SubscriptionTier[];
  averageExpected: string;
  note?: string;
}

export function ProposalSubscriptionTiers({
  tiers,
  averageExpected,
  note,
}: ProposalSubscriptionTiersProps) {
  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              SaaS Pricing Model
            </h2>
            <p className="text-[var(--andromeda-text-secondary)]">
              Recommended subscription tiers per branch
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop Table View */}
        <ScrollReveal delay={0.1}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[var(--andromeda-accent-beige)]/20 to-[var(--andromeda-accent-beige)]/10 border-b border-[var(--andromeda-accent-beige)]/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Branch Size
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Asset Range
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Monthly Fee
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Annual Fee
                  </th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, index) => {
                  const isRecommended = tier.recommended;
                  return (
                    <tr
                      key={tier.id}
                      className={`border-b border-white/10 light:border-black/10 ${
                        isRecommended
                          ? "bg-[var(--andromeda-accent-beige)]/10"
                          : "bg-[var(--andromeda-primary)]"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                            {tier.size}
                          </span>
                          {isRecommended && (
                            <Award size={14} className="text-[var(--andromeda-accent-beige)]" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-[var(--andromeda-text-secondary)]">
                          {tier.assetRange}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                          {tier.monthlyFee}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                            {tier.annualFee}
                          </span>
                          {tier.discount && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                              {tier.discount} off
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {tiers.map((tier, index) => {
            const isRecommended = tier.recommended;
            return (
              <ScrollReveal key={tier.id} delay={0.1 * (index + 1)}>
                <div
                  className={`p-6 rounded-xl border ${
                    isRecommended
                      ? "bg-[var(--andromeda-accent-beige)]/10 border-[var(--andromeda-accent-beige)]/30"
                      : "bg-[var(--andromeda-primary)] border-white/10 light:border-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] flex items-center gap-2">
                      {tier.size}
                      {isRecommended && (
                        <Award size={16} className="text-[var(--andromeda-accent-beige)]" />
                      )}
                    </h3>
                    <span className="text-sm text-[var(--andromeda-text-secondary)]">
                      {tier.assetRange}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--andromeda-text-secondary)]">
                        Monthly
                      </span>
                      <span className="text-base font-medium text-[var(--andromeda-text-primary)]">
                        {tier.monthlyFee}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--andromeda-text-secondary)]">
                        Annual
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-[var(--andromeda-text-primary)]">
                          {tier.annualFee}
                        </span>
                        {tier.discount && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                            {tier.discount} off
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Average Expected */}
        <ScrollReveal delay={0.3}>
          <div className="mt-8 p-4 rounded-lg bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/20 text-center">
            <p className="text-sm text-[var(--andromeda-text-secondary)]">
              Average expected: <span className="font-semibold text-[var(--andromeda-accent-beige)]">{averageExpected}</span>
            </p>
          </div>
        </ScrollReveal>

        {/* Note */}
        {note && (
          <ScrollReveal delay={0.4}>
            <div className="mt-6 text-center">
              <p className="text-xs text-[var(--andromeda-text-secondary)]">{note}</p>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
