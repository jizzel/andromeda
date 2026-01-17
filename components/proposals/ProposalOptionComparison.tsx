"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, AlertCircle, ChevronDown, Server, Cloud, Clock } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { ProposalOption } from "@/types/proposal";

interface ProposalOptionComparisonProps {
  options: ProposalOption[];
}

export function ProposalOptionComparison({ options }: ProposalOptionComparisonProps) {
  const [expandedOptions, setExpandedOptions] = useState<Record<string, boolean>>({});

  const toggleExpanded = (optionId: string) => {
    setExpandedOptions((prev) => ({
      ...prev,
      [optionId]: !prev[optionId],
    }));
  };

  const getOptionBadgeColor = (index: number) => {
    return index === 0
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : "bg-amber-500/20 text-amber-300 border-amber-500/30";
  };

  const getOptionIconColor = (index: number) => {
    return index === 0 ? "text-blue-400" : "text-amber-400";
  };

  return (
    <section className="w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)] mb-4">
              Two Distinct Paths
            </h2>
            <p className="text-[var(--andromeda-text-secondary)] max-w-2xl mx-auto">
              Choose the implementation approach that aligns with your strategic vision, budget
              constraints, and long-term operational capacity.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {options.map((option, index) => (
            <ScrollReveal key={option.id} delay={0.1 * (index + 1)}>
              <div className="relative rounded-xl bg-gradient-to-b from-[var(--andromeda-primary)] to-[var(--andromeda-secondary)] p-6 border border-white/10 light:border-black/10">
                {/* Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getOptionBadgeColor(
                      index
                    )}`}
                  >
                    {index === 0 ? <Server size={14} /> : <Cloud size={14} />}
                    {option.label}
                  </span>
                  {option.badge && (
                    <span className="text-xs text-[var(--andromeda-accent-beige)] font-medium">
                      {option.badge}
                    </span>
                  )}
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-[var(--andromeda-text-primary)] mb-2">
                  {option.title}
                </h3>
                <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4 leading-relaxed">
                  {option.description}
                </p>

                {/* Timeline Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 light:bg-black/5 border border-white/10 light:border-black/10 mb-6">
                  <Clock size={14} className="text-[var(--andromeda-accent-beige)]" />
                  <span className="text-xs font-medium text-[var(--andromeda-text-primary)]">
                    {option.timeline}
                  </span>
                </div>

                {/* Capabilities */}
                {option.capabilities && option.capabilities.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-3">
                      Core Capabilities
                    </h4>
                    <ul className="space-y-2">
                      {option.capabilities.map((capability, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                          <Check size={16} className={`flex-shrink-0 mt-0.5 ${getOptionIconColor(index)}`} />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusions */}
                {option.exclusions && option.exclusions.length > 0 && (
                  <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={16} className="text-red-400" />
                      <h4 className="text-sm font-semibold text-red-300">What This Option Excludes</h4>
                    </div>
                    <ul className="space-y-2">
                      {option.exclusions.map((exclusion, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-200/80">
                          <X size={14} className="flex-shrink-0 mt-0.5" />
                          <span>{exclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advantages */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-3">
                    Advantages
                  </h4>
                  <ul className="space-y-2">
                    {option.advantages.map((advantage, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                        <Check size={16} className={`flex-shrink-0 mt-0.5 text-green-400`} />
                        <span>{advantage}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limitations */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-3">
                    Limitations
                  </h4>
                  <ul className="space-y-2">
                    {option.limitations.map((limitation, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                        <X size={16} className={`flex-shrink-0 mt-0.5 text-orange-400`} />
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cost Breakdown - Expandable */}
                <div className="border-t border-white/10 light:border-black/10 pt-6">
                  <button
                    onClick={() => toggleExpanded(option.id)}
                    className="w-full flex items-center justify-between text-left hover:opacity-80 transition-opacity"
                  >
                    <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)]">
                      Cost Breakdown
                    </h4>
                    <motion.div
                      animate={{ rotate: expandedOptions[option.id] ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={18} className="text-[var(--andromeda-text-secondary)]" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {expandedOptions[option.id] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-4">
                          {/* One-time Cost */}
                          {option.costBreakdown.oneTime && (
                            <div>
                              <div className="flex items-baseline justify-between mb-2">
                                <h5 className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                                  {option.costBreakdown.oneTime.description}
                                </h5>
                                <span className="text-base font-bold text-[var(--andromeda-accent-beige)]">
                                  {option.costBreakdown.oneTime.amount}
                                </span>
                              </div>
                              <ul className="space-y-1 ml-4">
                                {option.costBreakdown.oneTime.details.map((detail, i) => (
                                  <li key={i} className="text-xs text-[var(--andromeda-text-secondary)]">
                                    • {detail}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Recurring Costs */}
                          {option.costBreakdown.recurring.items.map((item, i) => (
                            <div key={i}>
                              <div className="flex items-baseline justify-between mb-2">
                                <h5 className="text-sm font-medium text-[var(--andromeda-text-primary)]">
                                  {item.category}
                                </h5>
                                <span className="text-sm font-bold text-[var(--andromeda-accent-beige)]">
                                  {item.cost}
                                </span>
                              </div>
                              {item.details && (
                                <ul className="space-y-1 ml-4">
                                  {item.details.map((detail, j) => (
                                    <li key={j} className="text-xs text-[var(--andromeda-text-secondary)]">
                                      • {detail}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}

                          {/* Commercial Model */}
                          {option.costBreakdown.commercial && (
                            <div className="pt-4 border-t border-white/10 light:border-black/10">
                              <h5 className="text-sm font-medium text-[var(--andromeda-text-primary)] mb-2">
                                {option.costBreakdown.commercial.description}
                              </h5>
                              <p className="text-sm text-[var(--andromeda-accent-beige)] font-medium mb-2">
                                {option.costBreakdown.commercial.pricing}
                              </p>
                              {option.costBreakdown.commercial.terms && (
                                <ul className="space-y-1 ml-4">
                                  {option.costBreakdown.commercial.terms.map((term, i) => (
                                    <li key={i} className="text-xs text-[var(--andromeda-text-secondary)]">
                                      • {term}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Note */}
                {option.note && (
                  <div className="mt-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-xs text-amber-200/90">{option.note}</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
