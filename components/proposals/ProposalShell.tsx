"use client";

import type {
  ProposalData,
  ProposalDataUnion,
  ProposalDataChurch,
  ProposalDataSocial,
  ProposalAcceptance,
} from "@/types/proposal";
import { ProposalContent } from "./ProposalContent";
import { ProposalContentChurch } from "./ProposalContentChurch";
import { ProposalContentSocial } from "./social/ProposalContentSocial";

interface ProposalShellProps {
  proposal: ProposalDataUnion;
  expiryDate?: string;
  proposalId: string;
  accessCode: string;
  isExpired: boolean;
  initialAcceptance: ProposalAcceptance | null;
}

/**
 * Picks the content shell for a proposal's `proposalType`. Shared by the live
 * page (`ProposalPageWrapper`) and the PDF print route (`ProposalPrintView`)
 * so both render the identical component tree.
 */
export function ProposalShell({ proposal, ...props }: ProposalShellProps) {
  if ("proposalType" in proposal && proposal.proposalType === "church-asset-management") {
    return <ProposalContentChurch proposal={proposal as ProposalDataChurch} {...props} />;
  }

  if ("proposalType" in proposal && proposal.proposalType === "social-media-engagement") {
    return <ProposalContentSocial proposal={proposal as ProposalDataSocial} {...props} />;
  }

  return <ProposalContent proposal={proposal as ProposalData} {...props} />;
}
