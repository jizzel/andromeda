"use client";

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import type { ProposalAcceptance } from "@/types/proposal";
import { ProposalDocumentProvider } from "../ProposalDocumentContext";
import { ProposalRevisionNotice } from "../ProposalRevisionNotice";
import { ProposalShell } from "../ProposalShell";
import { useClientHub } from "./ClientHubProvider";

/**
 * The Proposal tab: the live proposal from the hub (no second access check).
 * Keyed by version: when "Reload proposal" (or any refresh) brings a new
 * version, the view remounts — the response form, package/plan selections and
 * recorded acceptance start fresh from the new terms, as on a full load. A
 * refresh at the same version (e.g. after the client's own response) keeps state.
 */
export function ProposalTab() {
  const hub = useClientHub();
  return <ProposalTabView key={hub.proposalVersion} hub={hub} />;
}

function ProposalTabView({ hub }: { hub: ReturnType<typeof useClientHub> }) {
  const router = useRouter();
  const { proposalId, proposal, expiryDate, proposalVersion, acceptance, agreementStatus, revision } = hub;
  // What's on the sheet, including a response submitted in this view, so
  // printing right after accepting reflects it without a reload.
  const [recordedAcceptance, setRecordedAcceptance] = useState<ProposalAcceptance | null>(acceptance);
  const [printMode, setPrintMode] = useState(false);

  // Print mode while the browser print dialog is open (button or Ctrl/Cmd+P).
  // flushSync renders expanded content before the browser snapshots the page.
  useEffect(() => {
    const onBeforePrint = () => flushSync(() => setPrintMode(true));
    const onAfterPrint = () => setPrintMode(false);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    return () => {
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, []);

  const requestPrint = useCallback(() => window.print(), []);
  // A newer version (or the client's own response) reloads the hub's data in place.
  const reloadProposal = useCallback(async () => router.refresh(), [router]);
  const recordAcceptance = useCallback(
    (next: ProposalAcceptance) => {
      setRecordedAcceptance(next);
      router.refresh(); // tabs (agreement, assets…) may change with the response
    },
    [router]
  );

  return (
    <ProposalDocumentProvider
      value={{
        printMode,
        proposalId,
        // The hub session authenticates the APIs; no access code is held in the page.
        accessCode: "",
        proposalVersion,
        recordedAcceptance,
        requestPrint,
        reloadProposal,
        onAcceptanceRecorded: recordAcceptance,
        agreementStatus,
      }}
    >
      {/* Accepted proposals are settled; a revision notice would only confuse. */}
      {revision && recordedAcceptance?.status !== "accepted" && (
        <ProposalRevisionNotice proposalId={proposalId} proposalVersion={proposalVersion} revision={revision} />
      )}
      <ProposalShell
        proposal={proposal}
        expiryDate={expiryDate}
        proposalId={proposalId}
        accessCode=""
        isExpired={new Date() > new Date(expiryDate)}
        initialAcceptance={acceptance}
      />
    </ProposalDocumentProvider>
  );
}
