"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Project } from "@/constants/projects";
import { ProjectExpansion } from "./ProjectExpansion";
import { Badge } from "@/components/ui/badge";
import { useKeyboardNav } from "@/lib/hooks/useKeyboardNav";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded((prev) => !prev);

  // Keyboard navigation
  useKeyboardNav({
    onEnter: toggleExpanded,
    onSpace: toggleExpanded,
    onEscape: () => setIsExpanded(false),
    enabled: true,
  });

  return (
    <motion.article
      className="relative cursor-pointer"
      onClick={toggleExpanded}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleExpanded();
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={isExpanded}
      aria-label={`${project.name} project details`}
      whileHover={{
        y: -4,
        scale: 1.02,
      }}
      transition={{
        duration: 0.15,
        ease: [0.33, 1, 0.68, 1],
      }}
    >
      <div
        className="bg-[var(--andromeda-secondary-dark)] rounded-lg p-6 border border-white/10"
        style={{
          boxShadow: isExpanded
            ? "var(--shadow-2)"
            : "var(--shadow-1)",
        }}
      >
        {/* Collapsed State */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-[var(--andromeda-text-primary)]">
              {project.name}
            </h3>
            <p className="text-base text-[var(--andromeda-text-primary)] mb-2 leading-relaxed">
              {project.contextLine}
            </p>
            <p className="text-sm text-[var(--andromeda-text-secondary)] leading-relaxed">
              {project.outcomeLine}
            </p>
          </div>

          {/* Status Badge */}
          <Badge
            variant="outline"
            className="shrink-0 border-[var(--andromeda-accent-beige)]/30 text-[var(--andromeda-accent-beige)] hover:bg-transparent"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-[var(--andromeda-accent-beige)] mr-2" />
            {project.status}
          </Badge>
        </div>

        {/* Expanded State */}
        <motion.div
          initial={false}
          animate={{
            height: isExpanded ? "auto" : 0,
            opacity: isExpanded ? 1 : 0,
          }}
          transition={{
            duration: 0.25,
            ease: [0.33, 1, 0.68, 1],
          }}
          className="overflow-hidden"
        >
          {isExpanded && <ProjectExpansion project={project} />}
        </motion.div>
      </div>
    </motion.article>
  );
}
