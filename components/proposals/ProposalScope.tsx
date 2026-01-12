"use client";

import { useState } from "react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, AlertCircle } from "lucide-react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface PhaseOption {
  id: string;
  name: string;
  price: string;
  recommended?: boolean;
  addon?: boolean;
  deliverables: string[];
  purpose: string[];
  note?: string;
}

interface Phase {
  id: string;
  label: string;
  title: string;
  description: string;
  price?: string;
  deliverables?: string[];
  purpose?: string[];
  note?: string;
  options?: PhaseOption[];
  image: string;
}

interface ProposalScopeProps {
  phases: Phase[];
}

function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <ScrollReveal delay={0.1 * (index + 1)}>
      <motion.div
        className="rounded-xl overflow-hidden bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10"
        whileHover={{ y: -2 }}
        transition={{ duration: 0.2 }}
      >
        {/* Phase Header with Image */}
        <div className="relative h-48 overflow-hidden">
          <Image
            src={phase.image}
            alt={phase.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--andromeda-primary)] via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <Badge className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]">
              {phase.label}
            </Badge>
          </div>
          {phase.price && (
            <div className="absolute bottom-4 right-4">
              <span className="text-lg font-bold text-white">{phase.price}</span>
            </div>
          )}
        </div>

        {/* Phase Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-[var(--andromeda-text-primary)] mb-2">
            {phase.title}
          </h3>
          <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4">
            {phase.description}
          </p>

          {/* Expand Toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-[var(--andromeda-accent-beige)] hover:text-[var(--andromeda-accent-beige)]/80 transition-colors text-sm font-medium"
          >
            <span>{isExpanded ? "Hide Details" : "View Details"}</span>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} />
            </motion.div>
          </button>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 space-y-6">
                  {/* Single Phase Deliverables */}
                  {phase.deliverables && (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-3 uppercase tracking-wider">
                        Deliverables
                      </h4>
                      <ul className="space-y-2">
                        {phase.deliverables.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                            <Check size={16} className="text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Single Phase Purpose */}
                  {phase.purpose && (
                    <div>
                      <h4 className="text-sm font-semibold text-[var(--andromeda-text-primary)] mb-3 uppercase tracking-wider">
                        Purpose
                      </h4>
                      <ul className="space-y-2">
                        {phase.purpose.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--andromeda-accent-beige)] flex-shrink-0 mt-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Phase Options (for Phase 1B) */}
                  {phase.options && (
                    <div className="space-y-6">
                      {phase.options.map((option) => (
                        <div
                          key={option.id}
                          className={`p-4 rounded-lg border ${
                            option.recommended
                              ? "border-[var(--andromeda-accent-beige)]/50 bg-[var(--andromeda-accent-beige)]/5"
                              : "border-white/10 light:border-black/10"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <h5 className="font-semibold text-[var(--andromeda-text-primary)]">
                                {option.name}
                              </h5>
                              {option.recommended && (
                                <Badge className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] text-xs">
                                  Recommended
                                </Badge>
                              )}
                              {option.addon && (
                                <Badge variant="outline" className="text-xs border-[var(--andromeda-text-secondary)]/30">
                                  Add-on
                                </Badge>
                              )}
                            </div>
                            <span className="font-bold text-[var(--andromeda-accent-beige)]">
                              {option.price}
                            </span>
                          </div>

                          <ul className="space-y-1.5 mb-3">
                            {option.deliverables.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                                <Check size={14} className="text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>

                          {option.note && (
                            <p className="text-xs text-[var(--andromeda-text-secondary)] italic">
                              {option.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {phase.note && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--andromeda-secondary)]">
                      <AlertCircle size={16} className="text-[var(--andromeda-accent-beige)] flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-[var(--andromeda-text-secondary)]">
                        {phase.note}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

export function ProposalScope({ phases }: ProposalScopeProps) {
  return (
    <section
      id="scope"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="scope-heading"
    >
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <h2
            id="scope-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Scope of Work
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12">
            Phase 1 deliverables designed for immediate impact
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {phases.map((phase, index) => (
            <PhaseCard key={phase.id} phase={phase} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
