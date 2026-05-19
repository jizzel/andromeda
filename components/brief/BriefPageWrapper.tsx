"use client";

import { useState } from "react";
import type { CreativeBriefData } from "@/types/brief";
import { ProposalAccessGate } from "@/components/proposals/ProposalAccessGate";
import { BriefContent } from "./BriefContent";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface BriefPageWrapperProps {
  briefId: string;
}

export function BriefPageWrapper({ briefId }: BriefPageWrapperProps) {
  const { trackBriefAccessed } = useAnalytics();
  const [brief, setBrief] = useState<CreativeBriefData | null>(null);
  const [expiryDate, setExpiryDate] = useState<string | undefined>(undefined);

  if (!brief) {
    return (
      <ProposalAccessGate
        proposalId={briefId}
        label="brief"
        verifyUrl="/api/brief/verify"
        idBodyKey="briefId"
        responseDataKey="brief"
        onAccessGranted={(data, expiry) => {
          setBrief(data as CreativeBriefData);
          setExpiryDate(expiry);
          trackBriefAccessed({ brief_id: briefId });
        }}
      />
    );
  }

  return <BriefContent brief={brief} expiryDate={expiryDate} />;
}
