"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { Server, Check, Info } from "lucide-react";

interface ProposalHostingProps {
  hosting: {
    annual: string;
    monthly: string;
    includes: string[];
    note: string;
  };
}

export function ProposalHosting({ hosting }: ProposalHostingProps) {
  // Don't render if there's no meaningful data
  if (!hosting.annual && !hosting.monthly && hosting.includes.length === 0) {
    return null;
  }

  return (
    <section
      id="hosting"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="hosting-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
              <Server className="w-6 h-6 text-[var(--andromeda-accent-beige)]" />
            </div>
            <h2
              id="hosting-heading"
              className="text-3xl md:text-4xl font-bold text-[var(--andromeda-text-primary)]"
            >
              Hosting & Infrastructure
            </h2>
          </div>
          <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            Reliable foundations for your digital presence
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Cost Column */}
          <ScrollReveal delay={0.2} className="md:col-span-1">
            <div className="p-8 rounded-xl bg-[var(--andromeda-primary)] border border-white/10 h-full">
              <h3 className="text-sm font-semibold text-[var(--andromeda-text-secondary)] uppercase tracking-wider mb-6">
                Investment
              </h3>
              
              {((hosting.annual && hosting.annual !== "N/A") || (hosting.monthly && hosting.monthly !== "N/A")) ? (
                <>
                  {hosting.annual && hosting.annual !== "N/A" && (
                    <div className="mb-6">
                      <p className="text-xs text-[var(--andromeda-text-secondary)] mb-1">Annual</p>
                      <p className="text-2xl font-bold text-[var(--andromeda-accent-beige)]">{hosting.annual}</p>
                    </div>
                  )}
                  
                  {hosting.monthly && hosting.monthly !== "N/A" && (
                    <div className="mb-6">
                      <p className="text-xs text-[var(--andromeda-text-secondary)] mb-1">Monthly</p>
                      <p className="text-2xl font-bold text-[var(--andromeda-accent-beige)]">{hosting.monthly}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mb-6">
                  <p className="text-sm text-[var(--andromeda-text-secondary)] italic">
                    Infrastructure included in standard agreement.
                  </p>
                </div>
              )}

              {hosting.note && (
                <div className="mt-8 pt-6 border-t border-white/10 flex gap-2">
                  <Info className="w-4 h-4 text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--andromeda-text-secondary)] italic">
                    {hosting.note}
                  </p>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Inclusions Column */}
          <ScrollReveal delay={0.4} className="md:col-span-2">
            <div className="p-8 rounded-xl bg-[var(--andromeda-primary)] border border-white/10 h-full">
              <h3 className="text-sm font-semibold text-[var(--andromeda-text-secondary)] uppercase tracking-wider mb-6">
                What&apos;s Included
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {hosting.includes.map((item, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <Check size={16} className="text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <span className="text-sm text-[var(--andromeda-text-primary)] leading-relaxed">
                      {item}
                    </span>
                  </motion.div>
                ))}
              </div>

              {hosting.includes.length === 0 && (
                <p className="text-sm text-[var(--andromeda-text-secondary)] italic">
                  Standard hosting infrastructure and security maintenance.
                </p>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
