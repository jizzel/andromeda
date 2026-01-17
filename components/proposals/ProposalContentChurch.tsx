"use client";

import { ProposalHero } from "./ProposalHero";
import { ProposalOverview } from "./ProposalOverview";
import { ProposalOptionComparison } from "./ProposalOptionComparison";
import { ProposalDecisionFramework } from "./ProposalDecisionFramework";
import { ProposalSubscriptionTiers } from "./ProposalSubscriptionTiers";
import { ProposalRevenueProjections } from "./ProposalRevenueProjections";
import { ProposalCriticalFactors } from "./ProposalCriticalFactors";
import { ProposalTimeline } from "./ProposalTimeline";
import { ProposalIPRights } from "./ProposalIPRights";
import { ProposalCTA } from "./ProposalCTA";
import type { ProposalDataChurch } from "@/types/proposal";

interface ProposalContentChurchProps {
  proposal: ProposalDataChurch;
}

export function ProposalContentChurch({ proposal }: ProposalContentChurchProps) {
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

      {/* Options Comparison */}
      <ProposalOptionComparison options={proposal.options} />

      {/* Decision Framework */}
      <ProposalDecisionFramework
        option1Criteria={proposal.decisionCriteria.option1}
        option2Criteria={proposal.decisionCriteria.option2}
        warnings={proposal.decisionCriteria.warnings}
      />

      {/* Subscription Tiers (conditional) */}
      {proposal.subscriptionTiers && (
        <ProposalSubscriptionTiers
          tiers={proposal.subscriptionTiers}
          averageExpected={proposal.subscriptionTiersAverageExpected || "GHS 400/month per branch"}
        />
      )}

      {/* Revenue Projections (conditional) */}
      {proposal.revenueProjections && (
        <ProposalRevenueProjections
          scenarios={proposal.revenueProjections.scenarios}
          breakEven={proposal.revenueProjections.breakEven}
          caveats={proposal.revenueProjections.caveats}
        />
      )}

      {/* Critical Success Factors (conditional) */}
      {proposal.criticalFactors && (
        <ProposalCriticalFactors
          title={proposal.criticalFactorsTitle || "Critical Success Factors"}
          subtitle={proposal.criticalFactorsSubtitle || "For Option 2 to succeed, the following must be in place:"}
          factors={proposal.criticalFactors}
        />
      )}

      {/* Next Steps Timeline */}
      <ProposalTimeline timeline={proposal.timeline} note={"Actual Timeline: To be Determined"} />

      {/* IP Rights & Revenue Sharing */}
      <ProposalIPRights
        option1Terms={proposal.ipRights.option1}
        option2Terms={proposal.ipRights.option2}
        warningMessage={proposal.ipRights.warningMessage}
      />

      {/* Call to Action */}
      <ProposalCTA
        validity={`${proposal.validityDays} days`}
        clientName={proposal.client.name}
        contactEmail={proposal.contactEmail}
        pdfUrl={proposal.pdfUrl}
      />
    </main>
  );
}
