"use client";

import { useState, useCallback } from "react";
import type { ProposalDataSocial, ProposalAcceptance as AcceptanceData } from "@/types/proposal";
import { ProposalHero } from "@/components/proposals/ProposalHero";
import { ProposalOverview } from "@/components/proposals/ProposalOverview";
import { ProposalGoals } from "@/components/proposals/ProposalGoals";
import { ProposalPricing } from "@/components/proposals/ProposalPricing";
import { ProposalRequirements } from "@/components/proposals/ProposalRequirements";
import { ProposalCTA } from "@/components/proposals/ProposalCTA";
import { ProposalAcceptance } from "@/components/proposals/ProposalAcceptance";
import { ContentPillarsSection } from "./ContentPillarsSection";
import { ScopeOfServicesSection } from "./ScopeOfServicesSection";
import { AddOnsSection } from "./AddOnsSection";
import { EngagementTermsSection } from "./EngagementTermsSection";
import { CrossSellSection } from "./CrossSellSection";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useProposalDocument } from "@/components/proposals/ProposalDocumentContext";

interface ProposalContentSocialProps {
  proposal: ProposalDataSocial;
  expiryDate?: string;
  proposalId: string;
  accessCode: string;
  isExpired: boolean;
  initialAcceptance: AcceptanceData | null;
}

export function ProposalContentSocial({
  proposal,
  expiryDate,
  proposalId,
  accessCode,
  isExpired,
  initialAcceptance,
}: ProposalContentSocialProps) {
  const { trackProposalPackageSelected } = useAnalytics();

  // Start from the recorded selection only if that option still exists — a
  // revision after a change request may have removed or replaced it. The
  // shell remounts per version, so this re-runs after every revision.
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(() => {
    const id = initialAcceptance?.packageId;
    return id && proposal.packages?.some((p) => p.id === id) ? id : null;
  });

  // Lock selection once the proposal is accepted — including in this session,
  // which `initialAcceptance` (mount-time only) doesn't reflect. While changes
  // are requested the cards stay selectable, so a revision can be accepted
  // with a new choice.
  const { recordedAcceptance } = useProposalDocument();
  const locked = (recordedAcceptance ?? initialAcceptance)?.status === "accepted";

  const handlePackageSelect = useCallback(
    (id: string) => {
      setSelectedPackageId(id);
      const pkg = proposal.packages?.find((p) => p.id === id);
      if (pkg) {
        trackProposalPackageSelected({ proposal_id: proposalId, package_id: id, package_name: pkg.name });
      }
    },
    [proposal.packages, proposalId, trackProposalPackageSelected]
  );

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

      {proposal.contentPillars && proposal.contentPillars.length > 0 && (
        <ContentPillarsSection pillars={proposal.contentPillars} />
      )}

      {proposal.scopeOfServices && proposal.scopeOfServices.length > 0 && (
        <ScopeOfServicesSection areas={proposal.scopeOfServices} />
      )}

      {proposal.packages && proposal.packages.length > 0 && (
        <ProposalPricing
          packages={proposal.packages}
          selectedId={selectedPackageId}
          onSelect={handlePackageSelect}
          locked={locked}
        />
      )}

      {proposal.addOns && proposal.addOns.length > 0 && <AddOnsSection addOns={proposal.addOns} />}

      {proposal.engagement && <EngagementTermsSection engagement={proposal.engagement} />}

      <ProposalRequirements
        requirements={proposal.clientResponsibilities}
        revisions={proposal.revisions}
        exclusions={proposal.exclusions}
      />

      {proposal.crossSell && <CrossSellSection crossSell={proposal.crossSell} />}

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
        packages={proposal.packages ?? []}
        selectedPackageId={selectedPackageId}
        selectedPlanId={null}
      />
    </main>
  );
}
