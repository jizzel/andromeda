"use client";

import type { ProposalData } from "@/types/proposal";
import { ProposalHero } from "@/components/proposals/ProposalHero";
import { ProposalOverview } from "@/components/proposals/ProposalOverview";
import { ProposalGoals } from "@/components/proposals/ProposalGoals";
import { ProposalScope } from "@/components/proposals/ProposalScope";
import { ProposalPricing } from "@/components/proposals/ProposalPricing";
import { ProposalPaymentPlans } from "@/components/proposals/ProposalPaymentPlans";
import { ProposalTimeline } from "@/components/proposals/ProposalTimeline";
import { ProposalRequirements } from "@/components/proposals/ProposalRequirements";
import { ProposalInspirations } from "@/components/proposals/ProposalInspirations";
import { ProposalCTA } from "@/components/proposals/ProposalCTA";

interface ProposalContentProps {
  proposal: ProposalData;
}

export function ProposalContent({ proposal }: ProposalContentProps) {
  // Flatten inspirations for the component
  const allInspirations = [
    ...proposal.inspirations.hotel.map((item) => ({
      ...item,
      description: "Hotel website design inspiration",
    })),
    ...proposal.inspirations.restaurant.map((item) => ({
      ...item,
      description: "Restaurant website design inspiration",
    })),
  ];

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)]">
      {/* Hero Section */}
      <ProposalHero
        title={proposal.title}
        subtitle={proposal.subtitle}
        clientName={proposal.client.name}
        backgroundImage={proposal.heroImage}
      />

      {/* Overview Section */}
      <ProposalOverview
        situation={proposal.overview.situation}
        solution={proposal.overview.solution}
        primaryObjective={proposal.overview.primaryObjective}
      />

      {/* Goals Section */}
      <ProposalGoals goals={proposal.goals} />

      {/* Scope of Work Section */}
      <ProposalScope phases={proposal.phases} />

      {/* Pricing Summary Section */}
      <ProposalPricing packages={proposal.packages} />

      {/* Payment Plans Section */}
      <ProposalPaymentPlans plans={proposal.paymentPlans} />

      {/* Timeline Section */}
      <ProposalTimeline
        timeline={proposal.timeline}
        totalDuration="4-8 weeks"
      />

      {/* Client Responsibilities Section */}
      <ProposalRequirements
        requirements={proposal.clientResponsibilities}
        revisions={proposal.revisions}
        exclusions={proposal.exclusions}
      />

      {/* Design Inspirations Section */}
      <ProposalInspirations inspirations={allInspirations} />

      {/* Call to Action Section */}
      <ProposalCTA
        validity={`${proposal.validityDays} days`}
        clientName={proposal.client.name}
        contactEmail={proposal.contactEmail}
        pdfUrl={proposal.pdfUrl}
      />
    </main>
  );
}
