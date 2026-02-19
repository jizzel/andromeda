import { HeroSection } from "@/components/sections/hero/HeroSection";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { ProjectsSection } from "@/components/sections/projects/ProjectsSection";
import { CapabilitiesSection } from "@/components/sections/capabilities/CapabilitiesSection";
import { PerspectiveSection } from "@/components/sections/perspective/PerspectiveSection";
import { ConnectSection } from "@/components/sections/connect/ConnectSection";

export default function Home() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <BusinessCard />
      <ProjectsSection />
      <CapabilitiesSection />
      <PerspectiveSection />
      <ConnectSection />
    </main>
  );
}
