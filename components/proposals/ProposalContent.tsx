"use client";

import { plansFor } from "@/lib/payment-plans";
import { useState, useCallback } from "react";
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
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useProposalDocument } from "@/components/proposals/ProposalDocumentContext";

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
  const { trackProposalPackageSelected, trackProposalPaymentPlanSelected } = useAnalytics();

  // Start from the recorded selection only if that option still exists — a
  // revision after a change request may have removed or replaced it. The
  // shell remounts per version, so this re-runs after every revision.
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    const id = initialAcceptance?.packageId;
    return id && proposal.packages?.some((p) => p.id === id) ? id : null;
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() => {
    const id = initialAcceptance?.paymentPlanId;
    return id && proposal.paymentPlans?.some((p) => p.id === id) ? id : null;
  });

  // Lock selection once the proposal is accepted — including in this session,
  // which `initialAcceptance` (mount-time only) doesn't reflect. While changes
  // are requested the cards stay selectable, so a revision can be accepted
  // with a new choice.
  const { recordedAcceptance, printMode } = useProposalDocument();
  const locked = (recordedAcceptance ?? initialAcceptance)?.status === "accepted";

  const handlePackageSelect = useCallback((id: string) => {
    setSelectedPackageId(id);
    // Plans can be tied to packages (`packageIds`): drop a plan that doesn't
    // apply to the new package, and pick the plan when only one applies.
    const applicable = plansFor(proposal.paymentPlans ?? [], id);
    setSelectedPlanId((current) =>
      current && applicable.some((p) => p.id === current) ? current : applicable.length === 1 ? applicable[0].id : null
    );
    const pkg = proposal.packages?.find((p) => p.id === id);
    if (pkg) trackProposalPackageSelected({ proposal_id: proposalId, package_id: id, package_name: pkg.name });
  }, [proposal.packages, proposal.paymentPlans, proposalId, trackProposalPackageSelected]);

  const handlePlanSelect = useCallback((id: string) => {
    setSelectedPlanId(id);
    const plan = proposal.paymentPlans?.find((p) => p.id === id);
    if (plan) trackProposalPaymentPlanSelected({ proposal_id: proposalId, plan_id: id, plan_name: plan.name });
  }, [proposal.paymentPlans, proposalId, trackProposalPaymentPlanSelected]);

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
          onSelect={handlePackageSelect}
          locked={locked}
        />
      )}

      {proposal.paymentPlans && proposal.paymentPlans.length > 0 && (
        <ProposalPaymentPlans
          // Only the plans for the chosen package (all, before a choice). Print follows the recorded
          // package only — never an unsaved click — and shows every plan without one (like the server PDF).
          plans={plansFor(proposal.paymentPlans, printMode ? (recordedAcceptance?.packageId ?? null) : selectedPackageId)}
          clarification={proposal.paymentClarification}
          selectedId={selectedPlanId}
          onSelect={handlePlanSelect}
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

      {hasInspirations && (
        <ProposalInspirations
          inspirations={allInspirations}
          heading={proposal.inspirations?.heading}
          subheading={proposal.inspirations?.subheading}
          footnote={proposal.inspirations?.footnote ?? (proposal.inspirations?.heading ? null : undefined)}
        />
      )}

      <ProposalCTA
        expiryDate={expiryDate}
        clientName={proposal.client.name}
        contactEmail={proposal.contactEmail}
        proposalId={proposalId}
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
