"use client";

import { useState } from "react";
import type { ProposalData, ProposalDataUnion, ProposalDataChurch } from "@/types/proposal";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { ProposalContent } from "./ProposalContent";
import { ProposalContentChurch } from "./ProposalContentChurch";

interface ProposalPageWrapperProps {
  proposalId: string;
}

export function ProposalPageWrapper({ proposalId }: ProposalPageWrapperProps) {
  const [proposal, setProposal] = useState<ProposalDataUnion | null>(null);

  const handleAccessGranted = (proposalData: unknown) => {
    setProposal(proposalData as ProposalDataUnion);
  };

  if (!proposal) {
    return (
      <ProposalAccessGate
        proposalId={proposalId}
        onAccessGranted={handleAccessGranted}
      />
    );
  }

  // Type detection and routing
  if ('proposalType' in proposal && proposal.proposalType === 'church-asset-management') {
    return <ProposalContentChurch proposal={proposal as ProposalDataChurch} />;
  }

  return <ProposalContent proposal={proposal as ProposalData} />;
}
