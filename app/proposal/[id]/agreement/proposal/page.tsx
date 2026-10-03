import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { authorisedSigner, loadClientAgreement } from "@/lib/agreement-client";
import { loadVerifiedSnapshot } from "@/lib/agreement-basis";
import { AGREEMENT_SIGNER_COOKIE } from "@/lib/agreement-signer";
import { shortVersion } from "@/lib/proposal-version-label";
import { ProposalPrintView } from "@/components/proposals/ProposalPrintView";
import type { ProposalAcceptance } from "@/types/proposal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accepted proposal",
  robots: { index: false, follow: false },
};

/**
 * The proposal exactly as the client accepted it (Schedule 2) — the stored
 * snapshot, verified against its version, never the live page (which may have
 * been edited since). For a verified signer of the current agreement.
 */
export default async function AcceptedProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const back = `/proposal/${encodeURIComponent(id)}/agreement`;
  const agreement = await loadClientAgreement(id);
  const session = agreement.ok ? await authorisedSigner((await cookies()).get(AGREEMENT_SIGNER_COOKIE)?.value, id, agreement.record) : null;
  if (!agreement.ok || !session) redirect(back);
  const { record } = agreement;
  const snapshot = await loadVerifiedSnapshot(id, record.proposalVersion);
  if (!snapshot.ok) redirect(back);
  const acceptance: ProposalAcceptance = { status: "accepted", acceptedAt: record.acceptedAt ?? "", proposalVersion: record.proposalVersion, ...record.selection };

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)] pt-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <Link href={back} className="inline-flex items-center gap-1 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]">
          <ArrowLeft className="w-4 h-4" /> Back to the agreement
        </Link>
        <p className="mt-3 p-3 rounded-lg border border-[var(--andromeda-accent-beige)]/30 bg-[var(--andromeda-accent-beige)]/5 text-sm text-[var(--andromeda-text-secondary)]">
          The proposal as you accepted it — version <span className="font-mono">{shortVersion(record.proposalVersion)}</span>. This is what the
          agreement incorporates as Schedule 2.
        </p>
      </div>
      <ProposalPrintView
        proposalId={id}
        proposal={snapshot.snapshot}
        expiryDate={(record.acceptedAt ?? record.offerValidUntil).slice(0, 10)}
        acceptance={acceptance}
        proposalVersion={record.proposalVersion}
      />
    </main>
  );
}
