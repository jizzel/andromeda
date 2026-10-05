import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getProposalById, readAgreement } from "@/lib/google-sheets";
import { clientTitleOf } from "@/lib/agreement-templates";
import { agreementPdfResponse } from "@/lib/pdf";
import { json } from "../../edit";

export const runtime = "nodejs";
export const maxDuration = 60;

/** The executed agreement as a PDF, for Joseph. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  const { id } = await params;
  const [record, proposal] = await Promise.all([readAgreement(id), getProposalById(id)]);
  if (record?.status !== "executed" || !record.clientSignature || !record.providerSignature) return json({ success: false, error: "No executed agreement" }, 404);
  return agreementPdfResponse({
    origin: new URL(request.url).origin,
    proposalId: id,
    agreementHash: record.agreementHash,
    providerSignedAt: record.providerSignature.signedAt,
    clientSignedAt: record.clientSignature.signedAt,
    clientName: record.clientName,
    documentTitle: clientTitleOf(record),
    title: proposal?.data.title ?? id,
  });
}
