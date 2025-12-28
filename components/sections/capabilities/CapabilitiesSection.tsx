"use client";

import { capabilities } from "@/constants/capabilities";
import { CapabilityCard } from "./CapabilityCard";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function CapabilitiesSection() {
  return (
    <section
      className="relative w-full py-24 px-6 bg-[var(--andromeda-secondary-dark)]"
      aria-labelledby="capabilities-heading"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <ScrollReveal>
          <h2
            id="capabilities-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Capabilities
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-16">
            I build systems for real operational environments. I value clarity,
            reliability, and long-term maintainability over novelty and trend
            chasing.
          </p>
        </ScrollReveal>

        {/* Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((capability, index) => (
            <ScrollReveal
              key={capability.id}
              delay={index * 0.1}
              threshold={0.1}
            >
              <CapabilityCard capability={capability} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
