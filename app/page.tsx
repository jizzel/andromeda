import { HeroSection } from "@/components/sections/hero/HeroSection";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { BusinessCardProvider } from "@/components/layout/BusinessCardContext";

export default function Home() {
  return (
    <BusinessCardProvider>
      <main className="min-h-screen">
        <HeroSection />
        <BusinessCard />

        {/* Placeholder for future sections */}
        <section className="min-h-screen bg-[var(--andromeda-secondary-dark)] flex items-center justify-center">
          <p className="text-[var(--andromeda-text-secondary)]">
            Projects Section (Coming in Phase 2)
          </p>
        </section>
      </main>
    </BusinessCardProvider>
  );
}
