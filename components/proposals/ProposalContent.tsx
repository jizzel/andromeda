"use client";

import { useState } from "react";
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
import { ProposalAcceptance } from "@/components/proposals/ProposalAcceptance";
import type { ProposalInspiration, ProposalAcceptance as AcceptanceData } from "@/types/proposal";

interface ProposalContentProps {
  proposal: ProposalData;
  expiryDate?: string;
  proposalId: string;
  accessCode: string;
  isExpired: boolean;
  initialAcceptance: AcceptanceData | null;
}

const mapInspirationWithDefault = (item: ProposalInspiration) => ({
  ...item,
  description: item.description || "Design inspiration",
});

export function ProposalContent({ proposal, expiryDate, proposalId, accessCode, isExpired, initialAcceptance }: ProposalContentProps) {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialAcceptance?.packageId ?? null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(
    initialAcceptance?.paymentPlanId ?? null
  );

  const locked = !!initialAcceptance;

  const allInspirations = proposal.inspirations ? [
    ...(proposal.inspirations.items || []).map(mapInspirationWithDefault),
    ...(proposal.inspirations.hotel || []).map(mapInspirationWithDefault),
    ...(proposal.inspirations.restaurant || []).map(mapInspirationWithDefault),
    ...(proposal.inspirations.website || []).map(mapInspirationWithDefault),
  ] : [];

  const hasInspirations = allInspirations.length > 0;

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)]">
      <ProposalHero
        title={proposal.title}
        subtitle={proposal.subtitle}
        clientName={proposal.client.name}
        backgroundImage={proposal.heroImage}
        issuedAt={proposal.issuedAt}
      />

      <ProposalOverview
        situation={proposal.overview.situation}
        solution={proposal.overview.solution}
        primaryObjective={proposal.overview.primaryObjective}
      />

      {proposal.goals && proposal.goals.length > 0 && <ProposalGoals goals={proposal.goals} />}

      {proposal.phases && proposal.phases.length > 0 && <ProposalScope phases={proposal.phases} />}

      {proposal.packages && proposal.packages.length > 0 && (
        <ProposalPricing
          packages={proposal.packages}
          selectedId={selectedPackageId}
          onSelect={setSelectedPackageId}
          locked={locked}
        />
      )}

      {proposal.paymentPlans && proposal.paymentPlans.length > 0 && (
        <ProposalPaymentPlans
          plans={proposal.paymentPlans}
          clarification={proposal.paymentClarification}
          selectedId={selectedPlanId}
          onSelect={setSelectedPlanId}
          locked={locked}
        />
      )}

      {proposal.hosting && <ProposalHosting hosting={proposal.hosting} />}

      {proposal.maintenance && <ProposalMaintenance maintenance={proposal.maintenance} />}

      {proposal.timeline && proposal.timeline.length > 0 && (
        <ProposalTimeline
          timeline={proposal.timeline}
          totalDuration={proposal.totalDuration}
        />
      )}

      <ProposalRequirements
        requirements={proposal.clientResponsibilities}
        revisions={proposal.revisions}
        exclusions={proposal.exclusions}
      />

      {hasInspirations && <ProposalInspirations inspirations={allInspirations} />}

      <ProposalCTA
        expiryDate={expiryDate}
        clientName={proposal.client.name}
        contactEmail={proposal.contactEmail}
        pdfUrl={proposal.pdfUrl}
        proposalId={proposalId}
        assetsReady={proposal.assetsReady}
      />

      <ProposalAcceptance
        proposalId={proposalId}
        accessCode={accessCode}
        clientName={proposal.client.name}
        isExpired={isExpired}
        initialAcceptance={initialAcceptance}
        packages={proposal.packages}
        paymentPlans={proposal.paymentPlans}
        selectedPackageId={selectedPackageId}
        selectedPlanId={selectedPlanId}
      />
    </main>
  );
}
