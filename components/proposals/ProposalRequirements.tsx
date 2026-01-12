"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { motion } from "framer-motion";
import { FileText, User, MessageSquare, Camera, AlertTriangle } from "lucide-react";

interface Requirement {
  title: string;
  description: string;
}

interface Revision {
  major: number;
  minor: number;
  note: string;
}

interface ProposalRequirementsProps {
  requirements: Requirement[];
  revisions: Revision;
  exclusions: string[];
}

const requirementIcons: Record<string, typeof FileText> = {
  "Content Provision": FileText,
  "Single Point of Contact": User,
  "Timely Feedback": MessageSquare,
  "Photography": Camera,
};

export function ProposalRequirements({ requirements, revisions, exclusions }: ProposalRequirementsProps) {
  return (
    <section
      id="requirements"
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-primary)]"
      aria-labelledby="requirements-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="requirements-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Client Responsibilities
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12">
            What we need from you to ensure project success
          </p>
        </ScrollReveal>

        {/* Requirements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {requirements.map((req, index) => {
            const Icon = requirementIcons[req.title] || FileText;
            return (
              <ScrollReveal key={index} delay={0.1 * (index + 1)}>
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
                      <Icon className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] mb-2">
                        {req.title}
                      </h3>
                      <p className="text-sm text-[var(--andromeda-text-secondary)]">
                        {req.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>

        {/* Revisions & Exclusions Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Revisions */}
          <ScrollReveal delay={0.5}>
            <div className="p-6 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] mb-4">
                Revisions Policy
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--andromeda-text-secondary)]">Major revisions</span>
                  <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">{revisions.major} round</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--andromeda-text-secondary)]">Minor revisions</span>
                  <span className="text-sm font-medium text-[var(--andromeda-text-primary)]">{revisions.minor} rounds</span>
                </div>
                <p className="text-xs text-[var(--andromeda-text-secondary)] pt-2 border-t border-white/10 light:border-black/10">
                  {revisions.note}
                </p>
              </div>
            </div>
          </ScrollReveal>

          {/* Exclusions */}
          <ScrollReveal delay={0.6}>
            <div className="p-6 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)]">
                  Exclusions
                </h3>
              </div>
              <ul className="space-y-2">
                {exclusions.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)]">
                    <span className="w-1 h-1 rounded-full bg-[var(--andromeda-text-secondary)]" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-[var(--andromeda-text-secondary)] mt-4 pt-2 border-t border-white/10 light:border-black/10">
                These can be added later if required.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
