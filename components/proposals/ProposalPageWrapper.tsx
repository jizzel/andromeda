"use client";

import { useState, useEffect } from "react";
import type { ProposalData, ProposalDataUnion, ProposalDataChurch, ProposalDataSocial, ProposalAcceptance } from "@/types/proposal";
import { ProposalAccessGate } from "./ProposalAccessGate";
import { ProposalContent } from "./ProposalContent";
import { ProposalContentChurch } from "./ProposalContentChurch";
import { ProposalContentSocial } from "./social/ProposalContentSocial";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface ProposalPageWrapperProps {
  proposalId: string;
}

export function ProposalPageWrapper({ proposalId }: ProposalPageWrapperProps) {
  const { trackProposalAccessed } = useAnalytics();
  const [proposal, setProposal] = useState<ProposalDataUnion | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);
  const [accessCode, setAccessCode] = useState<string>("");
  const [initialAcceptance, setInitialAcceptance] = useState<ProposalAcceptance | null>(null);
  const [acceptanceLoaded, setAcceptanceLoaded] = useState(false);

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

  if ('proposalType' in proposal && proposal.proposalType === 'church-asset-management') {
    return (
      <ProposalContentChurch
        proposal={proposal as ProposalDataChurch}
        expiryDate={expiryDate}
        proposalId={proposalId}
        accessCode={accessCode}
        isExpired={isExpired}
        initialAcceptance={initialAcceptance}
      />
    );
  }

  if ('proposalType' in proposal && proposal.proposalType === 'social-media-engagement') {
    return (
      <ProposalContentSocial
        proposal={proposal as ProposalDataSocial}
        expiryDate={expiryDate}
        proposalId={proposalId}
        accessCode={accessCode}
        isExpired={isExpired}
        initialAcceptance={initialAcceptance}
      />
    );
  }

  return (
    <ProposalContent
      proposal={proposal as ProposalData}
      expiryDate={expiryDate}
      proposalId={proposalId}
      accessCode={accessCode}
      isExpired={isExpired}
      initialAcceptance={initialAcceptance}
    />
  );
}
