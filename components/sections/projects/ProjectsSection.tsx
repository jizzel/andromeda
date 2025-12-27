"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { projects } from "@/constants/projects";
import { ProjectCard } from "./ProjectCard";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

export function ProjectsSection() {
  const [showExpansionLayer, setShowExpansionLayer] = useState(false);

  // Split projects into main (first 3) and expansion layer (last 2)
  const mainProjects = projects.filter((p) => !p.isExpansionLayer);
  const expansionProjects = projects.filter((p) => p.isExpansionLayer);

  const visibleProjects = showExpansionLayer
    ? projects
    : mainProjects;

  return (
    <section
      className="relative w-full py-24 px-6 bg-[var(--andromeda-primary-dark)]"
      aria-labelledby="projects-heading"
    >
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <ScrollReveal>
          <h2
            id="projects-heading"
            className="text-4xl md:text-5xl font-bold mb-4 text-[var(--andromeda-text-primary)]"
          >
            Proven Work
          </h2>
          <p className="text-lg text-[var(--andromeda-text-secondary)] mb-16">
            These projects represent classes of problems solved, not isolated
            achievements.
          </p>
        </ScrollReveal>

        {/* Projects Stack */}
        <div className="space-y-12">
          {visibleProjects.map((project, index) => (
            <ScrollReveal
              key={project.id}
              delay={index * 0.1}
              threshold={0.1}
            >
              <ProjectCard project={project} />
            </ScrollReveal>
          ))}
        </div>

        {/* Show More Button */}
        {!showExpansionLayer && expansionProjects.length > 0 && (
          <ScrollReveal delay={0.3}>
            <div className="flex justify-center mt-16">
              <motion.button
                onClick={() => setShowExpansionLayer(true)}
                className="px-6 py-3 text-base font-medium text-[var(--andromeda-text-primary)] border border-white/20 rounded hover:bg-white/5 hover:border-[var(--andromeda-accent-beige)]/30 transition-all focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                Show more work
              </motion.button>
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
