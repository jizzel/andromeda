import type { ReactNode } from "react";
import { getProposalAcceptance, getPublishedRevision } from "@/lib/google-sheets";
import { hubAccess } from "@/lib/client-session";
import { clientAgreementStatusOf } from "@/lib/agreement-client";
import { loadEngagement } from "@/lib/engagement";
import { proposalVersion } from "@/lib/proposal-version";
import { ClientHubProvider } from "@/components/proposals/hub/ClientHubProvider";
import { ClientHubHeader } from "@/components/proposals/hub/ClientHubHeader";
import { HubAccessGate } from "@/components/proposals/hub/HubAccessGate";
import type { ProposalDataUnion } from "@/types/proposal";

export const dynamic = "force-dynamic";

/**
 * The client hub: one access code, then Proposal / Agreement / Assets /
 * Progress tabs at the same URLs as before (so emailed links keep working).
 * Without a valid session every tab shows the access gate; with one, this
 * loads what the tabs share once — acceptance, agreement status and any
 * published revision — and the tabs render from it.
 *
 * The layout is NOT re-rendered when the client moves between tabs, so its
 * check only covers what it renders itself. Any page that loads protected data
 * on the server (the Agreement pages) must call `hubAccess` itself; client-side
 * tabs only fetch through APIs, which check the session on every request.
 */
export default async function ClientHubLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await hubAccess(id);
  if (!access) return <HubAccessGate proposalId={id} />;

  const proposal = access.proposal as ProposalDataUnion;
  const version = proposalVersion(proposal);
  const [acceptance, engagement, revision] = await Promise.all([
    getProposalAcceptance(id),
    // Agreement + overrides: the Assets/Progress gates and the Agreement tab, one read each.
    loadEngagement(id, proposal),
    // Only a revision published for exactly these terms.
    getPublishedRevision(id, version),
  ]);

  return (
    <ClientHubProvider
      value={{
        proposalId: id,
        proposal,
        expiryDate: access.expiryDate,
        proposalVersion: version,
        acceptance,
        agreementStatus: clientAgreementStatusOf(engagement.agreement),
        revision: revision ? { publishedAt: revision.publishedAt, note: revision.note } : null,
        gates: engagement.gates,
      }}
    >
      <ClientHubHeader />
      {/* In-page anchors (e.g. #next-steps) land below the sticky header. */}
      <div className="bg-[var(--andromeda-primary)] [&_[id]]:scroll-mt-36">{children}</div>
    </ClientHubProvider>
  );
}
