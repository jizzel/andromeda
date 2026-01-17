"use client";

import { TrendingUp, AlertCircle } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { RevenueScenario, BreakEvenAnalysis } from "@/types/proposal";

interface ProposalRevenueProjectionsProps {
  scenarios: RevenueScenario[];
  breakEven: BreakEvenAnalysis;
  caveats: string[];
}

export function ProposalRevenueProjections({
  scenarios,
  breakEven,
  caveats,
}: ProposalRevenueProjectionsProps) {
  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              Revenue Projections
            </h2>
            <p className="text-[var(--andromeda-text-secondary)]">
              Conservative adoption scenario for SaaS platform
            </p>
          </div>
        </ScrollReveal>

        {/* Revenue Scenarios Table */}
        <ScrollReveal delay={0.1}>
          <div className="overflow-x-auto mb-12">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-[var(--andromeda-accent-beige)]/20 to-[var(--andromeda-accent-beige)]/10 border-b border-[var(--andromeda-accent-beige)]/30">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Branches
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Monthly Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
                    Annual Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)]"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                        {scenario.branches} branches
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-[var(--andromeda-text-secondary)]">
                        {scenario.monthlyRevenue}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[var(--andromeda-accent-beige)]">
                        {scenario.annualRevenue}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScrollReveal>

        {/* Break-Even Analysis */}
        <ScrollReveal delay={0.2}>
          <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/5 border-2 border-green-500/30 mb-12">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-green-400" />
              <h3 className="text-lg font-bold text-green-300">
                Break-Even Analysis ({breakEven.branches} branches)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-green-200/60 mb-1">Annual Revenue</p>
                <p className="text-lg font-bold text-green-300">{breakEven.annualRevenue}</p>
              </div>
              <div>
                <p className="text-xs text-green-200/60 mb-1">Annual Operating Costs</p>
                <p className="text-lg font-bold text-green-300">{breakEven.annualCosts}</p>
              </div>
              <div>
                <p className="text-xs text-green-200/60 mb-1">Net Annual Margin</p>
                <p className="text-lg font-bold text-green-400">{breakEven.netMargin}</p>
              </div>
              <div>
                <p className="text-xs text-green-200/60 mb-1">Break-even on Development</p>
                <p className="text-lg font-bold text-green-400">{breakEven.breakEvenTime}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Caveats */}
        <ScrollReveal delay={0.3}>
          <div className="p-6 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={20} className="text-amber-400" />
              <h3 className="text-lg font-bold text-amber-300">Important Caveats</h3>
            </div>
            <ul className="space-y-2">
              {caveats.map((caveat, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-amber-200/80 leading-relaxed">{caveat}</span>
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
