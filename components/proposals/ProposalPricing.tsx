"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Package {
  id: string;
  name: string;
  recommended: boolean;
  totalPrice: string;
  includes: string[];
  comment: string;
}

interface ProposalPricingProps {
  packages: Package[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  locked?: boolean;
}

export function ProposalPricing({ packages, selectedId, onSelect, locked }: ProposalPricingProps) {
  const interactive = !!onSelect && !locked;
  return (
    <section
      id="pricing"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="pricing-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="pricing-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-[var(--andromeda-text-primary)]"
          >
            Pricing Summary
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-12 max-w-2xl mx-auto">
            {interactive ? "Select the package that best fits your current needs" : "Choose the package that best fits your current needs"}
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {packages.map((pkg, index) => {
            const isSelected = selectedId === pkg.id;
            const dimmed = interactive && selectedId !== null && selectedId !== undefined && !isSelected;
            return (
              <ScrollReveal key={pkg.id} delay={0.1 * (index + 1)}>
                <motion.div
                  whileHover={interactive ? { y: -4 } : {}}
                  whileTap={interactive ? { scale: 0.99 } : {}}
                  transition={{ duration: 0.2 }}
                  onClick={() => interactive && onSelect(pkg.id)}
                  role={interactive ? "button" : undefined}
                  tabIndex={interactive ? 0 : undefined}
                  onKeyDown={(e) => interactive && (e.key === "Enter" || e.key === " ") && onSelect(pkg.id)}
                  aria-pressed={interactive ? isSelected : undefined}
                  className={`relative h-full rounded-xl p-8 transition-all duration-200 ${
                    interactive ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--andromeda-accent-beige)]/50" : ""
                  } ${
                    isSelected
                      ? "bg-gradient-to-br from-[var(--andromeda-accent-beige)]/20 to-[var(--andromeda-accent-beige)]/5 border-2 border-[var(--andromeda-accent-beige)]"
                      : pkg.recommended && !interactive
                        ? "bg-gradient-to-br from-[var(--andromeda-accent-beige)]/20 to-[var(--andromeda-accent-beige)]/5 border-2 border-[var(--andromeda-accent-beige)]/50"
                        : "bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10"
                  } ${dimmed ? "opacity-40" : ""}`}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[var(--andromeda-accent-beige)] flex items-center justify-center"
                    >
                      <Check size={12} className="text-[var(--andromeda-primary)]" strokeWidth={3} />
                    </motion.div>
                  )}

                  {/* Recommended Badge */}
                  {pkg.recommended && !isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] px-4 py-1">
                        <Star size={14} className="mr-1" />
                        Recommended
                      </Badge>
                    </div>
                  )}

                  {/* Package Name */}
                  <h3 className="text-xl font-bold text-[var(--andromeda-text-primary)] mb-2 mt-2">
                    {pkg.name}
                  </h3>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[var(--andromeda-accent-beige)]">
                      {pkg.totalPrice}
                    </span>
                  </div>

                  {/* Includes */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-[var(--andromeda-text-secondary)] uppercase tracking-wider mb-3">
                      Includes
                    </h4>
                    <ul className="space-y-3">
                      {pkg.includes.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="flex-shrink-0 p-1 rounded-full bg-[var(--andromeda-accent-beige)]/20">
                            <Check size={12} className="text-[var(--andromeda-accent-beige)]" />
                          </div>
                          <span className="text-sm text-[var(--andromeda-text-primary)]">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-[var(--andromeda-text-secondary)] italic border-t border-white/10 light:border-black/10 pt-4">
                    {pkg.comment}
                  </p>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
