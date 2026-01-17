"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";

interface TimelinePhase {
  phase: string;
  duration: string;
  description: string;
}

interface ProposalTimelineProps {
  timeline: TimelinePhase[];
  totalDuration?: string;
  note?: string;
}

export function ProposalTimeline({ timeline, totalDuration = "4-8 weeks", note = "Actual Timeline: To be Determined" }: ProposalTimelineProps) {
  return (
    <section
      id="timeline"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="timeline-heading"
    >
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <h2
            id="timeline-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-center text-[var(--andromeda-text-primary)]"
          >
            Project Timeline
          </h2>
          {note &&
              <div className="mt-6 mb-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <p className="text-sm text-red-200/90 font-medium">
                  {note}
                </p>
              </div>
          }
          {!note &&
              <p className="text-lg text-[var(--andromeda-text-secondary)] text-center mb-4">
                Estimated delivery: <span className="text-[var(--andromeda-accent-beige)] font-semibold">{totalDuration}</span> from contract signing
              </p>
          }
          {!note &&
            <p className="text-sm text-[var(--andromeda-text-secondary)] text-center mb-12">
            Assuming timely content delivery
            </p>
          }
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--andromeda-accent-beige)] via-[var(--andromeda-accent-beige)]/50 to-transparent" />

          {/* Timeline Items */}
          <div className="space-y-8 md:space-y-12">
            {timeline.map((item, index) => (
              <ScrollReveal key={index} delay={0.1 * (index + 1)}>
                <div className={`relative flex items-start gap-6 md:gap-8 ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}>
                  {/* Content */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-1 ml-12 md:ml-0 p-6 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 ${
                      index % 2 === 0 ? "md:mr-8" : "md:ml-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-[var(--andromeda-text-primary)]">
                        {item.phase}
                      </h3>
                      <span className="text-sm font-medium text-[var(--andromeda-accent-beige)] bg-[var(--andromeda-accent-beige)]/10 px-3 py-1 rounded-full">
                        {item.duration}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--andromeda-text-secondary)]">
                      {item.description}
                    </p>
                  </motion.div>

                  {/* Timeline Dot */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-[var(--andromeda-accent-beige)] flex items-center justify-center text-[var(--andromeda-primary)] font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block flex-1" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
