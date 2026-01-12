import { Metadata } from "next";
import { njoyHotelProposal } from "@/constants/proposals/njoy-hotel";
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

export const metadata: Metadata = {
  title: `${njoyHotelProposal.title} | ${njoyHotelProposal.client.name}`,
  description: `Digital visibility proposal for ${njoyHotelProposal.client.name} - ${njoyHotelProposal.subtitle}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function NJoyHotelProposalPage() {
  const proposal = njoyHotelProposal;

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
        backgroundImage="https://lh3.googleusercontent.com/gps-cs-s/AG0ilSx9710J2AI9FBNe3hD0KlalZBc_UCkPjX7yfginbUEeILC4ZT7dD4XdoVsIPUg_cZG91FH5Km7xttshmNDdFK8Qc2F-CzVQg79HNDmoVnNLw0eWMCa-6LHBXLU7gkHQEXrYPnkOHNtX488I=s1360-w1360-h1020-rw"
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
        contactEmail="joseph@attakorah.com"
      />
    </main>
  );
}
