"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { ShieldCheck, Check, X, Info, Settings } from "lucide-react";
import type { ProposalMaintenance as ProposalMaintenanceType } from "@/types/proposal";

interface ProposalMaintenanceProps {
  maintenance: ProposalMaintenanceType;
}

export function ProposalMaintenance({ maintenance }: ProposalMaintenanceProps) {
  // Don't render if there's no meaningful data
  if (!maintenance.title && maintenance.includes.length === 0 && maintenance.excludes.length === 0 && maintenance.plans.length === 0) {
    return null;
  }

  return (
    <section
      id="maintenance"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="maintenance-heading"
    >
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
              <ShieldCheck className="w-6 h-6 text-[var(--andromeda-accent-beige)]" />
            </div>
            <h2
              id="maintenance-heading"
              className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)]"
            >
              {maintenance.title}
            </h2>
          </div>
          <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-12 max-w-3xl mx-auto leading-relaxed">
            {maintenance.description}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Inclusions Column */}
          <ScrollReveal delay={0.2} className="lg:col-span-1">
            <div className="p-8 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                <h3 className="text-sm font-semibold text-[var(--andromeda-text-primary)] uppercase tracking-wider">
                  What&apos;s Included
                </h3>
              </div>
              
              <ul className="space-y-4">
                {maintenance.includes.map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Check size={16} className="text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <span className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Exclusions Column */}
          <ScrollReveal delay={0.4} className="lg:col-span-1">
            <div className="p-8 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 h-full">
              <div className="flex items-center gap-2 mb-6">
                <X className="w-5 h-5 text-red-400" />
                <h3 className="text-sm font-semibold text-[var(--andromeda-text-primary)] uppercase tracking-wider">
                  Does Not Include
                </h3>
              </div>
              
              <ul className="space-y-4">
                {maintenance.excludes.map((item, index) => (
                  <motion.li 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <X size={16} className="text-red-400/50" />
                    </div>
                    <span className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed line-through decoration-red-400/20">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Plans Column */}
          <ScrollReveal delay={0.6} className="lg:col-span-1">
            <div className="space-y-6 h-full flex flex-col">
              {maintenance.plans.map((plan, index) => (
                <div key={index} className="p-8 rounded-xl bg-gradient-to-br from-[var(--andromeda-accent-beige)]/10 to-transparent border border-[var(--andromeda-accent-beige)]/20">
                  <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)] mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-3xl font-bold text-[var(--andromeda-accent-beige)]">{plan.price}</span>
                  </div>
                  <p className="text-sm text-[var(--andromeda-text-secondary)] mb-0">{plan.billing}</p>
                </div>
              ))}
              
              {maintenance.note && (
                <div className="mt-auto p-6 rounded-xl bg-[var(--andromeda-secondary)] border border-white/10 flex gap-3">
                  <Info className="w-5 h-5 text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--andromeda-text-secondary)] leading-relaxed italic">
                    {maintenance.note}
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
