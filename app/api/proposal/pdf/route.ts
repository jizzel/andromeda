import { NextRequest, NextResponse } from "next/server";
import { getProposalAcceptance } from "@/lib/google-sheets";
import { resolveClientAccess } from "@/lib/client-session";
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
  if (typeof proposalId !== "string" || !proposalId) {
    return NextResponse.json({ success: false, error: "proposalId is required" }, { status: 400 });
  }

  const access = await resolveClientAccess(request, proposalId, { accessCode: typeof accessCode === "string" ? accessCode : null });
  if (!access.ok) return NextResponse.json({ success: false, error: access.error, code: access.code }, { status: access.status });
  const verification = { proposal: access.proposal, expiryDate: access.expiryDate };

  return proposalPdfResponse({
    // Render against this deployment's own origin, so previews print themselves.
    origin: new URL(request.url).origin,
    proposalId,
    proposal: verification.proposal,
    expiryDate: verification.expiryDate,
    acceptance: await getProposalAcceptance(proposalId),
  });
}
