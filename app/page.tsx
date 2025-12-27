import { HeroSection } from "@/components/sections/hero/HeroSection";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { BusinessCardProvider } from "@/components/layout/BusinessCardContext";
import { ProjectsSection } from "@/components/sections/projects/ProjectsSection";

export default function Home() {
  return (
    <BusinessCardProvider>
      <main className="min-h-screen">
        <HeroSection />
        <BusinessCard />
        <ProjectsSection />

        {/* Placeholder for future sections */}
        <section className="min-h-screen bg-[var(--andromeda-secondary-dark)] flex items-center justify-center">
          <p className="text-[var(--andromeda-text-secondary)]">
            Capabilities & Connect Sections (Coming in Phase 3)
          </p>
        </section>
      </main>
    </BusinessCardProvider>
  );
}
