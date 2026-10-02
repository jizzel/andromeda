import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalAcceptance, getProposalRowForEdit, getProposalSnapshot } from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import { shortVersion } from "@/lib/proposal-version-label";
import { ProposalPrintView } from "@/components/proposals/ProposalPrintView";
import type { ProposalDataUnion } from "@/types/proposal";

export const dynamic = "force-dynamic";

/**
 * A stored proposal version (from `ProposalSnapshots`), rendered in full with
 * the live components in their static, expanded print mode — e.g. the exact
 * terms a client accepted, which the agreement incorporates, even after the
 * live proposal has been edited.
 */
export default async function AdminProposalVersionPage({ params }: { params: Promise<{ id: string; version: string }> }) {
  await requireAdminPage();
  const { id, version } = await params;
  if (!/^[0-9a-f]{64}$/.test(version)) notFound();
  const [json, row, acceptance] = await Promise.all([getProposalSnapshot(id, version), getProposalRowForEdit(id), getProposalAcceptance(id)]);
  if (!json || !row) notFound();
  // Only render terms that still hash to their version: a hand-edited
  // snapshot is reported, never shown as what the client accepted.
  let proposal: ProposalDataUnion | null = null;
  try {
    proposal = JSON.parse(json) as ProposalDataUnion;
  } catch {
    proposal = null;
  }
  if (!proposal || proposalVersion(proposal) !== version) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div role="alert" className="p-4 rounded-xl border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm">
          The stored terms for version <span className="font-mono">{shortVersion(version)}</span> no longer match that version — the snapshot was
          altered or corrupted, so it isn&apos;t shown. Agreements can&apos;t be prepared or signed against it.
        </div>
      </main>
    );
  }
  const isAccepted = acceptance?.status === "accepted" && acceptance.proposalVersion === version;
  const isLive = proposalVersion(row.record.data) === version;

  return (
    <div>
      <div className="sticky top-0 z-30 border-b border-white/10 light:border-black/10 bg-[var(--andromeda-primary)]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link
            href={`/admin/proposals/${encodeURIComponent(id)}/agreement`}
            className="inline-flex items-center gap-1 text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
          >
            <ArrowLeft className="w-4 h-4" /> Agreement
          </Link>
          <p className="font-semibold">
            {isAccepted ? "Accepted version" : "Stored version"} <span className="font-mono">{shortVersion(version)}</span>
            {isAccepted && " — exactly as the client accepted it"}
          </p>
          <p className="text-[var(--andromeda-text-secondary)]">
            {isLive ? "Same as the live proposal." : "The live proposal has changed since; this is the stored version."}
          </p>
        </div>
      </div>
      <ProposalPrintView
        proposalId={id}
        proposal={proposal}
        expiryDate={row.record.expiryDate}
        acceptance={isAccepted ? acceptance : null}
        proposalVersion={version}
      />
    </div>
  );
}
