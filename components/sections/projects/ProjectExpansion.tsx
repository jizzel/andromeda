"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Project } from "@/constants/projects";
import { projectsDetail } from "@/constants/projects-detail";

interface ProjectExpansionProps {
  project: Project;
}

export function ProjectExpansion({ project }: ProjectExpansionProps) {
  const projectDetail = projectsDetail.find((p) => p.id === project.id);

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

      {/* View Full Case Study Link */}
      {projectDetail && (
        <div className="pt-4 border-t border-white/10">
          <Link
            href={`/projects/${projectDetail.slug}`}
            className="inline-flex items-center gap-2 text-[var(--andromeda-highlight)] hover:text-[var(--andromeda-highlight)]/80 transition-colors font-medium"
          >
            <span>View Full Case Study</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
