"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import type { ClientAgreementStatus, ProposalDataUnion, ProposalAcceptance, ProposalRevisionNotice as Revision } from "@/types/proposal";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { ProposalShell } from "./ProposalShell";
import { ProposalDocumentProvider } from "./ProposalDocumentContext";
import { ProposalRevisionNotice } from "./ProposalRevisionNotice";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface ProposalPageWrapperProps {
  proposalId: string;
}

export function ProposalPageWrapper({ proposalId }: ProposalPageWrapperProps) {
  const { trackProposalAccessed } = useAnalytics();
  const [proposal, setProposal] = useState<ProposalDataUnion | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);
  const [accessCode, setAccessCode] = useState<string>("");
  // `initialAcceptance` seeds the shells once on mount; `recordedAcceptance`
  // tracks what's on the sheet, including responses submitted this session,
  // so printing after accepting reflects the new selection without a reload.
  const [initialAcceptance, setInitialAcceptance] = useState<ProposalAcceptance | null>(null);
  const [recordedAcceptance, setRecordedAcceptance] = useState<ProposalAcceptance | null>(null);
  const [acceptanceLoaded, setAcceptanceLoaded] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [proposalVersion, setProposalVersion] = useState<string | undefined>(undefined);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [agreementStatus, setAgreementStatus] = useState<ClientAgreementStatus | null>(null);

  // Print mode while the browser print dialog is open — whether opened from
  // the "Print / Save as PDF" button or Ctrl/Cmd+P. flushSync makes React
  // render expanded content before the browser snapshots the page.
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

  // Load acceptance state once access is granted, before rendering content
  useEffect(() => {
    if (!proposal || !accessCode) return;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/proposal/acceptance?proposalId=${encodeURIComponent(proposalId)}&accessCode=${encodeURIComponent(accessCode)}`
        );
        const data = await res.json();
        if (data.success && data.acceptance) {
          setInitialAcceptance(data.acceptance);
          setRecordedAcceptance(data.acceptance);
        }
      } catch {
        // Non-blocking — content renders with null acceptance
      } finally {
        setAcceptanceLoaded(true);
      }
    };
    load();
  }, [proposal, accessCode, proposalId]);

  const handleAccessGranted = (
    proposalData: unknown,
    expiry?: string,
    code?: string,
    response?: Record<string, unknown>
  ) => {
    setProposal(proposalData as ProposalDataUnion);
    setExpiryDate(expiry);
    setAccessCode(code ?? "");
    setProposalVersion(typeof response?.proposalVersion === "string" ? response.proposalVersion : undefined);
    setRevision(revisionFrom(response?.revision));
    setAgreementStatus(agreementStatusFrom(response?.agreement));
    trackProposalAccessed({ proposal_id: proposalId });
  };

  // Re-fetch the latest version in place (after a "proposal was updated"
  // response) without asking the client for the access code again. The
  // acceptance effect above re-runs because `proposal` changes, and the shell
  // remounts (keyed on version) so its selection state starts fresh.
  const reloadProposal = useCallback(async () => {
    const res = await fetch("/api/proposal/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId, accessCode }),
    });
    const data = await res.json();
    if (!data.success || !data.proposal) throw new Error(data.error || "Unable to reload proposal");
    setAcceptanceLoaded(false);
    setProposal(data.proposal as ProposalDataUnion);
    setExpiryDate(data.expiryDate);
    setProposalVersion(data.proposalVersion);
    setRevision(revisionFrom(data.revision));
    setAgreementStatus(agreementStatusFrom(data.agreement));
  }, [proposalId, accessCode]);

  if (!proposal) {
    return (
      <ProposalAccessGate
        proposalId={proposalId}
        onAccessGranted={handleAccessGranted}
      />
    );
  }

  // Wait for acceptance fetch before mounting content — useState initial values only run once
  if (!acceptanceLoaded) {
    return (
      <div className="min-h-screen bg-[var(--andromeda-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--andromeda-accent-beige)]/30 border-t-[var(--andromeda-accent-beige)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--andromeda-text-secondary)]">Loading proposal…</p>
        </div>
      </div>
    );
  }

  const isExpired = expiryDate ? new Date() > new Date(expiryDate) : false;

  return (
    <ProposalDocumentProvider
      value={{
        printMode,
        proposalId,
        accessCode,
        proposalVersion,
        recordedAcceptance,
        requestPrint,
        reloadProposal,
        onAcceptanceRecorded: setRecordedAcceptance,
        agreementStatus,
      }}
    >
      {/* Accepted proposals are settled; a revision notice would only confuse. */}
      {revision && recordedAcceptance?.status !== "accepted" && (
        <ProposalRevisionNotice proposalId={proposalId} proposalVersion={proposalVersion} revision={revision} />
      )}
      <ProposalShell
        key={proposalVersion ?? "unversioned"}
        proposal={proposal}
        expiryDate={expiryDate}
        proposalId={proposalId}
        accessCode={accessCode}
        isExpired={isExpired}
        initialAcceptance={initialAcceptance}
      />
    </ProposalDocumentProvider>
  );
}

function revisionFrom(value: unknown): Revision | null {
  const r = value as Partial<Revision> | undefined;
  return r && typeof r.publishedAt === "string" ? { publishedAt: r.publishedAt, note: typeof r.note === "string" ? r.note : "" } : null;
}

function agreementStatusFrom(value: unknown): ClientAgreementStatus | null {
  const status = (value as { status?: unknown } | null | undefined)?.status;
  return status === "sent" || status === "executed" ? status : null;
}
