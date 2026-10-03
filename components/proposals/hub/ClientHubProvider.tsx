"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ClientAgreementStatus, ProposalAcceptance, ProposalDataUnion, ProposalRevisionNotice } from "@/types/proposal";

/**
 * What the client hub layout loaded for the signed-in proposal, shared by the
 * header and every tab — so tabs don't re-verify or re-fetch on their own.
 * Refreshed with `router.refresh()` (e.g. after a response is recorded).
 */
export interface ClientHub {
  proposalId: string;
  proposal: ProposalDataUnion;
  expiryDate: string;
  proposalVersion: string;
  acceptance: ProposalAcceptance | null;
  agreementStatus: ClientAgreementStatus | null;
  revision: ProposalRevisionNotice | null;
}

export type HubTab = "proposal" | "agreement" | "assets" | "progress";

/** Which tabs this engagement offers. Assets and Progress follow today's unlock switches. */
export function availableTabs(hub: Pick<ClientHub, "proposal" | "agreementStatus">): Record<HubTab, boolean> {
  return {
    proposal: true,
    agreement: !!hub.agreementStatus,
    assets: !!hub.proposal.assets && !!hub.proposal.assetsReady,
    progress: !!hub.proposal.tracker && !!hub.proposal.trackerReady,
  };
}

export const hubTabHref = (proposalId: string, tab: HubTab) => {
  const base = `/proposal/${encodeURIComponent(proposalId)}`;
  return tab === "proposal" ? base : `${base}/${tab === "progress" ? "tracker" : tab}`;
};

const ClientHubContext = createContext<ClientHub | null>(null);

export function ClientHubProvider({ value, children }: { value: ClientHub; children: ReactNode }) {
  return <ClientHubContext.Provider value={value}>{children}</ClientHubContext.Provider>;
}

export function useClientHub(): ClientHub {
  const hub = useContext(ClientHubContext);
  if (!hub) throw new Error("useClientHub must be used inside the client hub layout");
  return hub;
}
