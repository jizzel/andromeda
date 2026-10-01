import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { getProposalAcceptance, getProposalById } from "@/lib/google-sheets";
import { proposalPdfResponse } from "@/lib/pdf";

// Headless Chromium needs Node APIs and more than the default few seconds.
export const runtime = "nodejs";
export const maxDuration = 60;

/** Admin download of any proposal's PDF — session-gated, no access code needed. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const record = await getProposalById(id);
  if (!record) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });

  return proposalPdfResponse({
    origin: new URL(request.url).origin,
    proposalId: id,
    proposal: record.data,
    expiryDate: record.expiryDate,
    acceptance: await getProposalAcceptance(id),
  });
}
