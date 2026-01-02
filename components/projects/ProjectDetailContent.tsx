"use client";

import { useEffect } from "react";
import { ExternalLink, Github, FileText, BookOpen, Users } from "lucide-react";
import type { ProjectDetail } from "@/constants/projects-detail";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { ScreenshotGallery } from "./ScreenshotGallery";

interface ProjectDetailContentProps {
  project: ProjectDetail;
}

export function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const { trackProjectCaseStudyViewed } = useAnalytics();

  useEffect(() => {
    trackProjectCaseStudyViewed({
      project_slug: project.slug,
      entry_point: "direct",
    });
  }, [project.slug, trackProjectCaseStudyViewed]);

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Overview */}
      <ScrollReveal delay={0.1}>
        <section>
          <h2 className="text-3xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
            Overview
          </h2>
          <p className="text-lg leading-relaxed text-[var(--andromeda-text-primary)]">
            {project.fullDescription}
          </p>
        </section>
      </ScrollReveal>

      {/* Research Publications */}
      {project.publications && project.publications.length > 0 && (
        <ScrollReveal delay={0.12}>
          <section className="bg-gradient-to-br from-[var(--andromeda-secondary)] to-[var(--andromeda-primary)] rounded-lg border-2 border-[var(--andromeda-accent-beige)]/30 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded bg-[var(--andromeda-accent-beige)]/10">
                  <FileText size={24} className="text-[var(--andromeda-accent-beige)]" />
                </div>
                <h2 className="text-3xl font-bold text-[var(--andromeda-text-primary)]">
                  Research Publications
                </h2>
              </div>

              {project.publications.map((publication, index) => (
                <div key={index} className="space-y-4">
                  {/* Publication Title */}
                  <h3 className="text-2xl font-bold text-[var(--andromeda-text-primary)] leading-tight">
                    {publication.title}
                  </h3>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--andromeda-text-secondary)]">
                    <span className="font-medium text-[var(--andromeda-accent-beige)]">
                      {publication.authors.join(", ")}
                    </span>
                    <span className="text-[var(--andromeda-text-secondary)]">•</span>
                    <span className="italic">{publication.venue}</span>
                    <span className="text-[var(--andromeda-text-secondary)]">•</span>
                    <span>{publication.year}</span>
                    <span className="text-[var(--andromeda-text-secondary)]">•</span>
                    <a
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--andromeda-highlight)] hover:underline font-mono text-xs"
                    >
                      DOI: {publication.doi}
                    </a>
                  </div>

                  {/* Abstract */}
                  <div className="pt-4 border-t border-white/10 light:border-black/10">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-3">
                      Abstract
                    </h4>
                    <p className="text-base leading-relaxed text-[var(--andromeda-text-primary)] text-justify">
                      {publication.abstract}
                    </p>
                  </div>

                  {/* Read Publication Button */}
                  <div className="pt-6">
                    <a
                      href={publication.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] font-semibold hover:bg-[var(--andromeda-highlight)] hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <FileText size={18} />
                      <span>Read Full Publication</span>
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Context → Problem → Approach → Outcome */}
      <ScrollReveal delay={0.15}>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10">
            <h3 className="text-xl font-semibold mb-3 text-[var(--andromeda-text-primary)]">
              Context
            </h3>
            <p className="text-[var(--andromeda-text-secondary)] leading-relaxed">
              {project.context}
            </p>
          </div>

          <div className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10">
            <h3 className="text-xl font-semibold mb-3 text-[var(--andromeda-text-primary)]">
              Problem
            </h3>
            <p className="text-[var(--andromeda-text-secondary)] leading-relaxed">
              {project.problem}
            </p>
          </div>

          <div className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10">
            <h3 className="text-xl font-semibold mb-3 text-[var(--andromeda-text-primary)]">
              Approach
            </h3>
            <p className="text-[var(--andromeda-text-secondary)] leading-relaxed">
              {project.approach}
            </p>
          </div>

          <div className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10">
            <h3 className="text-xl font-semibold mb-3 text-[var(--andromeda-text-primary)]">
              Outcome
            </h3>
            <p className="text-[var(--andromeda-text-secondary)] leading-relaxed">
              {project.outcome}
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Challenges */}
      {project.challenges && project.challenges.length > 0 && (
        <ScrollReveal delay={0.2}>
          <section>
            <h2 className="text-3xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
              Challenges
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.challenges.map((challenge, index) => (
                <div
                  key={index}
                  className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10"
                >
                  <h3 className="text-lg font-semibold mb-2 text-[var(--andromeda-text-primary)]">
                    {challenge.title}
                  </h3>
                  <p className="text-[var(--andromeda-text-secondary)] leading-relaxed">
                    {challenge.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Solutions */}
      {project.solutions && project.solutions.length > 0 && (
        <ScrollReveal delay={0.25}>
          <section>
            <h2 className="text-3xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
              Solutions
            </h2>
            <div className="space-y-6">
              {project.solutions.map((solution, index) => (
                <div
                  key={index}
                  className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10"
                >
                  <h3 className="text-xl font-semibold mb-3 text-[var(--andromeda-text-primary)]">
                    {solution.title}
                  </h3>
                  <p className="text-[var(--andromeda-text-secondary)] leading-relaxed mb-3">
                    {solution.description}
                  </p>
                  {solution.impact && (
                    <div className="pt-3 border-t border-white/10 light:border-black/10">
                      <p className="text-sm text-[var(--andromeda-accent-beige)] font-medium">
                        Impact: {solution.impact}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Metrics */}
      {project.metrics && project.metrics.length > 0 && (
        <ScrollReveal delay={0.3}>
          <section>
            <h2 className="text-3xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
              Key Metrics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {project.metrics.map((metric, index) => (
                <div
                  key={index}
                  className="bg-[var(--andromeda-secondary)] rounded-lg p-6 border border-white/10 light:border-black/10 text-center"
                >
                  <div className="text-4xl font-bold mb-2 text-[var(--andromeda-highlight)]">
                    {metric.value}
                  </div>
                  <div className="text-sm font-semibold mb-2 text-[var(--andromeda-text-primary)]">
                    {metric.label}
                  </div>
                  <div className="text-xs text-[var(--andromeda-text-secondary)]">
                    {metric.description}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* Screenshots */}
      {project.screenshots && project.screenshots.length > 0 && (
        <ScrollReveal delay={0.35}>
          <section>
            <h2 className="text-3xl font-bold mb-6 text-[var(--andromeda-text-primary)]">
              Screenshots
            </h2>
            <ScreenshotGallery screenshots={project.screenshots} projectSlug={project.slug} />
          </section>
        </ScrollReveal>
      )}

      {/* External Links & Academic Resources */}
      {(project.repositoryUrl || project.caseStudyUrl || (project.academicResources && project.academicResources.length > 0)) && (
        <ScrollReveal delay={0.4}>
          <section className="pt-8 border-t border-white/10 light:border-black/10 space-y-8">
            {/* Academic Resources */}
            {project.academicResources && project.academicResources.length > 0 && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-[var(--andromeda-text-primary)]">
                  Academic Resources
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.academicResources.map((resource, index) => {
                    const iconMap = {
                      book: BookOpen,
                      organization: Users,
                      repository: Github
                    };
                    const Icon = iconMap[resource.type];

                    return (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-[var(--andromeda-secondary)] rounded-lg p-5 border border-white/10 light:border-black/10 hover:border-[var(--andromeda-accent-beige)] transition-all duration-200 hover:shadow-lg"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="p-2 rounded bg-[var(--andromeda-accent-beige)]/10 group-hover:bg-[var(--andromeda-accent-beige)]/20 transition-colors">
                            <Icon size={20} className="text-[var(--andromeda-accent-beige)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-[var(--andromeda-text-primary)] group-hover:text-[var(--andromeda-highlight)] transition-colors leading-tight">
                                {resource.label}
                              </h4>
                              <ExternalLink size={14} className="text-[var(--andromeda-text-secondary)] group-hover:text-[var(--andromeda-highlight)] transition-colors flex-shrink-0 mt-0.5" />
                            </div>
                            {resource.description && (
                              <p className="text-sm text-[var(--andromeda-text-secondary)] mt-2 leading-relaxed">
                                {resource.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Standard External Links */}
            {(project.repositoryUrl || project.caseStudyUrl) && (
              <div>
                <h3 className="text-xl font-semibold mb-4 text-[var(--andromeda-text-primary)]">
                  Additional Links
                </h3>
                <div className="flex flex-wrap gap-4">
                  {project.repositoryUrl && !project.academicResources?.some(r => r.url === project.repositoryUrl) && (
                    <a
                      href={project.repositoryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-primary)] border border-white/10 light:border-black/10 hover:bg-[var(--andromeda-highlight)] hover:text-white transition-colors"
                    >
                      <Github size={20} />
                      <span>View Repository</span>
                    </a>
                  )}
                  {project.caseStudyUrl && (
                    <a
                      href={project.caseStudyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-primary)] border border-white/10 light:border-black/10 hover:bg-[var(--andromeda-highlight)] hover:text-white transition-colors"
                    >
                      <ExternalLink size={20} />
                      <span>Read Full Case Study</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}
