"use client";

import type { ProposalDataUnion, ProposalAcceptance } from "@/types/proposal";
import { ProposalDocumentProvider } from "./ProposalDocumentContext";
import { ProposalShell } from "./ProposalShell";

interface ProposalPrintViewProps {
  proposalId: string;
  proposal: ProposalDataUnion;
  expiryDate: string;
  acceptance: ProposalAcceptance | null;
}

/**
 * The proposal as a document: same shell and sections as the live page, in
 * print mode. Rendered by the token-gated `/proposal/[id]/print` route that
 * the headless browser in `lib/pdf.ts` loads.
 */
export function ProposalPrintView({ proposalId, proposal, expiryDate, acceptance }: ProposalPrintViewProps) {
  const isExpired = new Date() > new Date(expiryDate);

  return (
    <ProposalDocumentProvider value={{ printMode: true, proposalId, recordedAcceptance: acceptance }}>
      {/* `pdf-document` scopes print CSS that compensates for the export's page scale. */}
      <div className="pdf-document">
        <ProposalShell
          proposal={proposal}
          expiryDate={expiryDate}
          proposalId={proposalId}
          accessCode=""
          isExpired={isExpired}
          initialAcceptance={acceptance}
        />
      </div>
    </ProposalDocumentProvider>
  );
}
