"use client";

import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Globe, Search, Info, Phone, Layers, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface ProposalGoalsProps {
  goals: Goal[];
}

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Search,
  Info,
  Phone,
  Layers,
};

export function ProposalGoals({ goals }: ProposalGoalsProps) {
  return (
    <section
      className="relative w-full py-24 md:py-32 px-6 bg-[var(--andromeda-secondary)]"
      aria-labelledby="goals-heading"
    >
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <h2
            id="goals-heading"
            className="text-3xl md:text-4xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Project Goals
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-12">
            What we aim to achieve together
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal, index) => {
            const Icon = iconMap[goal.icon] || Globe;
            return (
              <ScrollReveal key={goal.id} delay={0.1 * (index + 1)}>
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="h-full p-6 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 p-3 rounded-lg bg-[var(--andromeda-accent-beige)]/10">
                      <Icon className="w-5 h-5 text-[var(--andromeda-accent-beige)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--andromeda-text-primary)] mb-2">
                        {goal.title}
                      </h3>
                      <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
