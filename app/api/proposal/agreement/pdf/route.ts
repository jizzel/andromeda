import type { NextRequest } from "next/server";
import { getProposalById, verifyEngagementAccess } from "@/lib/google-sheets";
import { agreementPdfResponse } from "@/lib/pdf";
import { clientJson, loadClientAgreement, signerFor } from "@/lib/agreement-client";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * The executed agreement as a PDF, for the client: with the proposal access
 * code, or — right after signing — the signer session that signed it.
 */
export async function POST(request: NextRequest) {
  let body: { proposalId?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return clientJson({ success: false, error: "Invalid request" }, 400);
  }
  const proposalId = typeof body.proposalId === "string" ? body.proposalId.trim() : "";
  const accessCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";

  const agreement = await loadClientAgreement(proposalId);
  const record = agreement.ok ? agreement.record : null;
  if (!record || record.status !== "executed" || !record.clientSignature || !record.providerSignature) {
    return clientJson({ success: false, error: "There's no signed agreement for this proposal yet." }, 404);
  }
  let title: string;
  if (accessCode) {
    const access = await verifyEngagementAccess(proposalId, accessCode);
    if (!access.success || !access.proposal) return clientJson({ success: false, error: access.error ?? "Invalid access code." }, 401);
    title = access.proposal.title;
  } else if (await signerFor(request, proposalId, record)) {
    title = (await getProposalById(proposalId))?.data.title ?? "";
  } else {
    return clientJson({ success: false, error: "Enter your access code to download the agreement." }, 401);
  }

  return agreementPdfResponse({
    origin: new URL(request.url).origin,
    proposalId,
    agreementHash: record.agreementHash,
    providerSignedAt: record.providerSignature.signedAt,
    clientSignedAt: record.clientSignature.signedAt,
    clientName: record.clientName,
    title,
  });
}
