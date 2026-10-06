import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { verifyPrintToken } from "@/lib/pdf-token";
import { loadExecutedAgreement } from "@/lib/executed-agreement";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { ProposalPrintView } from "@/components/proposals/ProposalPrintView";

/**
 * Print rendition of the executed agreement, loaded only by the headless
 * browser in `lib/pdf.ts` with a short-lived token for purpose "agreement"
 * (a proposal print token doesn't open it). Rendered entirely from the signed
 * snapshot: the agreement, then the full accepted proposal as an appendix.
 */

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

const load = cache(loadExecutedAgreement);

export async function generateMetadata({ params, searchParams }: PrintPageProps): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;
  const executed = verifyPrintToken(id, token, "agreement") ? await load(id) : null;
  return {
    title: executed ? `${executed.template.clientTitle}: ${executed.proposal.title} (${executed.proposal.client.name})` : "Agreement",
    robots: { index: false, follow: false },
  };
}

export default async function AgreementPrintPage({ params, searchParams }: PrintPageProps) {
  const { id } = await params;
  const { token } = await searchParams;
  if (!verifyPrintToken(id, token, "agreement")) notFound();
  const executed = await load(id);
  if (!executed) notFound();
  const { record, template, proposal, acceptance } = executed;

  return (
    <div className="pdf-document">
      <div className="max-w-3xl mx-auto px-6 py-10">
        <AgreementDocument record={record} template={template} proposal={proposal} />
      </div>
      <section aria-label="Appendix: the accepted proposal" className="print:break-before-page">
        <div className="max-w-3xl mx-auto px-6 pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)]">Appendix to Schedule 2</p>
          <h2 className="mt-1 text-xl font-bold text-[var(--andromeda-text-primary)]">The accepted proposal</h2>
          <p className="mt-1 text-sm text-[var(--andromeda-text-secondary)]">
            As accepted, version <span className="font-mono">{record.proposalVersion}</span>.
          </p>
        </div>
        <ProposalPrintView
          proposalId={id}
          proposal={proposal}
          expiryDate={(record.acceptedAt ?? record.offerValidUntil).slice(0, 10)}
          acceptance={acceptance}
          proposalVersion={record.proposalVersion}
        />
      </section>
    </div>
  );
}
