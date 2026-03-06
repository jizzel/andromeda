"use client";

import type { ProposalData } from "@/types/proposal";
import { ProposalHero } from "@/components/proposals/ProposalHero";
import { ProposalOverview } from "@/components/proposals/ProposalOverview";
import { ProposalGoals } from "@/components/proposals/ProposalGoals";
import { ProposalScope } from "@/components/proposals/ProposalScope";
import { ProposalPricing } from "@/components/proposals/ProposalPricing";
import { ProposalPaymentPlans } from "@/components/proposals/ProposalPaymentPlans";
import { ProposalHosting } from "@/components/proposals/ProposalHosting";
import { ProposalMaintenance } from "@/components/proposals/ProposalMaintenance";
import { ProposalTimeline } from "@/components/proposals/ProposalTimeline";
import { ProposalRequirements } from "@/components/proposals/ProposalRequirements";
import { ProposalInspirations } from "@/components/proposals/ProposalInspirations";
import { ProposalCTA } from "@/components/proposals/ProposalCTA";
import type { ProposalInspiration } from "@/types/proposal";

interface ProposalContentProps {
  proposal: ProposalData;
}

const mapInspirationWithDefault = (item: ProposalInspiration) => ({
  ...item,
  description: item.description || "Design inspiration",
});

export function ProposalContent({ proposal }: ProposalContentProps) {
  // Flatten inspirations for the component
  const allInspirations = proposal.inspirations ? [
    ...(proposal.inspirations.items || []).map(mapInspirationWithDefault),
    ...(proposal.inspirations.hotel || []).map(mapInspirationWithDefault),
    ...(proposal.inspirations.restaurant || []).map(mapInspirationWithDefault),
  ] : [];

  const hasInspirations = allInspirations.length > 0;

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
      {proposal.goals && proposal.goals.length > 0 && <ProposalGoals goals={proposal.goals} />}

      {/* Scope of Work Section */}
      {proposal.phases && proposal.phases.length > 0 && <ProposalScope phases={proposal.phases} />}

      {/* Pricing Summary Section */}
      {proposal.packages && proposal.packages.length > 0 && <ProposalPricing packages={proposal.packages} />}

      {/* Payment Plans Section */}
      {proposal.paymentPlans && proposal.paymentPlans.length > 0 && (
        <ProposalPaymentPlans 
          plans={proposal.paymentPlans} 
          clarification={proposal.paymentClarification}
        />
      )}

      {/* Hosting & Infrastructure Section */}
      {proposal.hosting && (
        <ProposalHosting hosting={proposal.hosting} />
      )}

      {/* Support & Maintenance Section */}
      {proposal.maintenance && (
        <ProposalMaintenance maintenance={proposal.maintenance} />
      )}

      {/* Timeline Section */}
      {proposal.timeline && proposal.timeline.length > 0 && (
        <ProposalTimeline
          timeline={proposal.timeline}
        />
      )}

      {/* Client Responsibilities Section */}
      <ProposalRequirements
        requirements={proposal.clientResponsibilities}
        revisions={proposal.revisions}
        exclusions={proposal.exclusions}
      />

      {/* Design Inspirations Section */}
      {hasInspirations && <ProposalInspirations inspirations={allInspirations} />}

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
