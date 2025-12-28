import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { projectsDetail } from "@/constants/projects-detail";
import { ProjectDetailContent } from "@/components/projects/ProjectDetailContent";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import type { Metadata } from "next";

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return projectsDetail.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projectsDetail.find((p) => p.slug === slug);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  return {
    title: `${project.name} | Attakorah`,
    description: project.contextLine,
    openGraph: {
      title: `${project.name} - ${project.contextLine}`,
      description: project.fullDescription,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.name,
      description: project.contextLine,
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = projectsDetail.find((p) => p.slug === slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="relative w-full min-h-screen bg-[var(--andromeda-primary)] pt-24 pb-24 px-6">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link
          href="/#projects"
          className="inline-flex items-center gap-2 text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)] transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </Link>
      </div>

      {/* Project Header */}
      <div className="max-w-6xl mx-auto mb-12">
        <ScrollReveal>
          <div className="mb-6">
            <span
              className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                project.status === "Production"
                  ? "bg-green-500/20 text-green-400"
                  : project.status === "Development"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-purple-500/20 text-purple-400"
              }`}
            >
              {project.status}
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--andromeda-text-primary)]">
            {project.name}
          </h1>

          <p className="text-xl text-[var(--andromeda-text-secondary)] mb-6">
            {project.contextLine}
          </p>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-2">
            {project.techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 rounded text-sm bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-secondary)] border border-white/10 dark:border-white/10 light:border-black/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* Project Content */}
      <ProjectDetailContent project={project} />
    </main>
  );
}
