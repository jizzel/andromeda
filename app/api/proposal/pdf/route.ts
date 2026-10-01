import { NextRequest, NextResponse } from "next/server";
import { verifyEngagementAccess, getProposalAcceptance } from "@/lib/google-sheets";
import { proposalPdfResponse } from "@/lib/pdf";

// Headless Chromium needs Node APIs and more than the default few seconds.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: { proposalId?: unknown; accessCode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { proposalId, accessCode } = body;
  if (typeof proposalId !== "string" || !proposalId || typeof accessCode !== "string" || !accessCode) {
    return NextResponse.json(
      { success: false, error: "proposalId and accessCode are required" },
      { status: 400 }
    );
  }

  const verification = await verifyEngagementAccess(proposalId, accessCode.trim());
  if (!verification.success || !verification.proposal) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }

  return proposalPdfResponse({
    // Render against this deployment's own origin, so previews print themselves.
    origin: new URL(request.url).origin,
    proposalId,
    proposal: verification.proposal,
    expiryDate: verification.expiryDate,
    acceptance: await getProposalAcceptance(proposalId),
  });
}
