import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProposalById, getProposalAcceptance } from "@/lib/google-sheets";
import { verifyPrintToken } from "@/lib/pdf-token";
import { ProposalPrintView } from "@/components/proposals/ProposalPrintView";

/**
 * Print rendition of a proposal, loaded only by the headless browser in
 * `lib/pdf.ts`. Authorised by a short-lived signed token minted by
 * `/api/proposal/pdf` after it verified the client's access code — never
 * reachable with the access code itself, and 404s without a valid token.
 */

export const dynamic = "force-dynamic";

interface PrintPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

// Dedupe the Sheets read between generateMetadata and the page.
const loadProposal = cache(getProposalById);

export async function generateMetadata({ params, searchParams }: PrintPageProps): Promise<Metadata> {
  const { id } = await params;
  const { token } = await searchParams;
  const record = verifyPrintToken(id, token) ? await loadProposal(id) : null;
  return {
    // Becomes the PDF's document title.
    title: record ? `${record.data.title} — ${record.data.client.name}` : "Proposal",
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPrintPage({ params, searchParams }: PrintPageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  if (!verifyPrintToken(id, token)) notFound();

  const record = await loadProposal(id);
  if (!record || !record.isActive) notFound();

  const acceptance = await getProposalAcceptance(id);

  return (
    <ProposalPrintView
      proposalId={id}
      proposal={record.data}
      expiryDate={record.expiryDate}
      acceptance={acceptance}
    />
  );
}
