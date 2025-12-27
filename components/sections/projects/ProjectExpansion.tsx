"use client";

import { Project } from "@/constants/projects";

interface ProjectExpansionProps {
  project: Project;
}

export function ProjectExpansion({ project }: ProjectExpansionProps) {
  return (
    <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
      {/* Context */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
          Context
        </h4>
        <p className="text-base text-[var(--andromeda-text-primary)] leading-relaxed">
          {project.context}
        </p>
      </div>

      {/* Problem */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
          Problem
        </h4>
        <p className="text-base text-[var(--andromeda-text-primary)] leading-relaxed">
          {project.problem}
        </p>
      </div>

      {/* Approach */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
          Approach
        </h4>
        <p className="text-base text-[var(--andromeda-text-primary)] leading-relaxed">
          {project.approach}
        </p>
      </div>

      {/* Outcome */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
          Outcome
        </h4>
        <p className="text-base text-[var(--andromeda-text-primary)] leading-relaxed">
          {project.outcome}
        </p>
      </div>

      {/* Tech Stack */}
      <div>
        <h4 className="text-xs uppercase tracking-wide text-[var(--andromeda-text-secondary)] mb-2">
          Tech Stack
        </h4>
        <p className="text-sm text-[var(--andromeda-text-secondary)]">
          {project.techStack.join(" · ")}
        </p>
      </div>
    </div>
  );
}
