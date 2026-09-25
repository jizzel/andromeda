import { NextRequest, NextResponse } from "next/server";
import { verifyEngagementAccess, getProposalAcceptance } from "@/lib/google-sheets";
import { renderProposalPdf, getOrRenderPdf, pdfCacheKey, proposalPdfFilename } from "@/lib/pdf";

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

  const proposal = verification.proposal;
  const acceptance = await getProposalAcceptance(proposalId);
  const key = pdfCacheKey({
    proposalId,
    data: proposal,
    expiryDate: verification.expiryDate,
    acceptance,
  });

  try {
    // Render against this deployment's own origin, so previews print themselves.
    const origin = new URL(request.url).origin;
    const pdf = await getOrRenderPdf(key, () => renderProposalPdf(origin, proposalId));

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${proposalPdfFilename(proposal.client.name, proposal.title)}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Proposal PDF generation failed:", error);
    return NextResponse.json({ success: false, error: "PDF generation failed" }, { status: 500 });
  }
}
