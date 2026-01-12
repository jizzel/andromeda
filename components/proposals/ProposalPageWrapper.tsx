"use client";

import { useState } from "react";
import type { ProposalData } from "@/types/proposal";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { ProposalContent } from "./ProposalContent";

interface ProposalPageWrapperProps {
  proposalId: string;
}

export function ProposalPageWrapper({ proposalId }: ProposalPageWrapperProps) {
  const [proposal, setProposal] = useState<ProposalData | null>(null);

  const handleAccessGranted = (proposalData: unknown) => {
    setProposal(proposalData as ProposalData);
  };

  if (!proposal) {
    return (
      <ProposalAccessGate
        proposalId={proposalId}
        onAccessGranted={handleAccessGranted}
      />
    );
  }

  return <ProposalContent proposal={proposal} />;
}
