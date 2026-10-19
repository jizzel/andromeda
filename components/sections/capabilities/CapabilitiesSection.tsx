"use client";

import { capabilities } from "@/constants/capabilities";
import { CapabilityCard } from "./CapabilityCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export function CapabilitiesSection() {
  const { trackCTAClicked } = useAnalytics();
  return (
    <section
      className="relative w-full py-24 px-6 bg-[var(--andromeda-secondary)]"
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

        <ScrollReveal delay={0.2}>
          <div className="flex justify-center mt-12">
            <Link
              href="/capabilities"
              onClick={() => trackCTAClicked({ type: "capabilities", location: "home_capabilities" })}
              className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium text-[var(--andromeda-text-primary)] border border-[var(--andromeda-text-secondary)]/30 rounded hover:bg-[var(--andromeda-primary)] hover:border-[var(--andromeda-accent-beige)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
            >
              See everything I build <ArrowRight className="w-4 h-4" aria-hidden />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
