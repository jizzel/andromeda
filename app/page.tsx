import { HeroSection } from "@/components/sections/hero/HeroSection";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { BusinessCardProvider } from "@/components/layout/BusinessCardContext";
import { ProjectsSection } from "@/components/sections/projects/ProjectsSection";
import { CapabilitiesSection } from "@/components/sections/capabilities/CapabilitiesSection";
import { ConnectSection } from "@/components/sections/connect/ConnectSection";

export default function Home() {
  return (
    <BusinessCardProvider>
      <main className="min-h-screen">
        <HeroSection />
        <BusinessCard />
        <ProjectsSection />
        <CapabilitiesSection />
        <ConnectSection />
      </main>
    </BusinessCardProvider>
  );
}
