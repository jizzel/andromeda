"use client";

import { useState, useEffect, useCallback } from "react";
import { flushSync } from "react-dom";
import type { ProposalDataUnion, ProposalAcceptance } from "@/types/proposal";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { ProposalShell } from "./ProposalShell";
import { ProposalDocumentProvider } from "./ProposalDocumentContext";
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

  const handleAccessGranted = (proposalData: unknown, expiry?: string, code?: string) => {
    setProposal(proposalData as ProposalDataUnion);
    setExpiryDate(expiry);
    setAccessCode(code ?? "");
    trackProposalAccessed({ proposal_id: proposalId });
  };

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
        recordedAcceptance,
        requestPrint,
        onAcceptanceRecorded: setRecordedAcceptance,
      }}
    >
      <ProposalShell
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
