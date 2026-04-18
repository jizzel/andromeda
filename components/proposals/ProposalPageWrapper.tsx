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
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);

  const handleAccessGranted = (proposalData: unknown, expiry?: string) => {
    setProposal(proposalData as ProposalDataUnion);
    setExpiryDate(expiry);
    // accessCode arg intentionally ignored here — used only in AssetsPageWrapper
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
    return <ProposalContentChurch proposal={proposal as ProposalDataChurch} expiryDate={expiryDate} proposalId={proposalId} />;
  }

  return <ProposalContent proposal={proposal as ProposalData} expiryDate={expiryDate} proposalId={proposalId} />;
}
