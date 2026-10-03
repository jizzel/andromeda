"use client";

import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { ProposalAccessGate } from "../ProposalAccessGate";
import { tabOfPath } from "./ClientHubHeader";
import { HubBrand } from "./HubBrand";

/**
 * The hub's front door: the access code once, which opens a 12-hour session
 * for every tab (whichever tab URL was opened — e.g. from an email — is shown
 * once signed in).
 */
export function HubAccessGate({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { trackProposalAccessed } = useAnalytics();
  const tab = tabOfPath(pathname, proposalId);
  const label = tab === "progress" ? "tracker" : tab;

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 sm:px-6 pt-4">
        <HubBrand />
        <ThemeToggle inline />
      </div>
      <ProposalAccessGate
        proposalId={proposalId}
        label={label}
        verifyUrl="/api/proposal/session"
        responseDataKey="session"
        onAccessGranted={() => {
          trackProposalAccessed({ proposal_id: proposalId });
          router.refresh();
        }}
      />
    </div>
  );
}
