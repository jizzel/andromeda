"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Plus } from "lucide-react";
import type { AddOn } from "@/types/proposal";

interface AddOnsSectionProps {
  addOns: AddOn[];
}

export function AddOnsSection({ addOns }: AddOnsSectionProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="addons-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="addons-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Optional Add-Ons
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12 max-w-3xl">
            Services available alongside any package. Quoted separately based on scope.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addOns.map((addOn, idx) => (
            <ScrollReveal key={addOn.id} delay={0.08 * (idx + 1)}>
              <div className="h-full p-5 rounded-lg bg-[var(--andromeda-secondary)]/60 border border-white/10 light:border-black/10">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-shrink-0 mt-0.5 p-1.5 rounded-md bg-[var(--andromeda-accent-beige)]/10">
                    <Plus className="w-3.5 h-3.5 text-[var(--andromeda-accent-beige)]" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--andromeda-text-primary)] leading-tight">
                    {addOn.title}
                  </h3>
                </div>
                {addOn.description && (
                  <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed mb-2">
                    {addOn.description}
                  </p>
                )}
                {addOn.pricingNote && (
                  <p className="text-xs text-[var(--andromeda-accent-beige)]/80 mt-2">
                    {addOn.pricingNote}
                  </p>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
