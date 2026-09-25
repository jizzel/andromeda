import { NextRequest, NextResponse } from "next/server";
import {
  verifyProposalAccess,
  verifyEngagementAccess,
  getProposalAcceptance,
  setProposalAcceptance,
} from "@/lib/google-sheets";
import { sendProposalResponseNotice } from "@/lib/email";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");
  const accessCode = searchParams.get("accessCode");

  if (!proposalId || !accessCode) {
    return NextResponse.json(
      { success: false, error: "proposalId and accessCode are required" },
      { status: 400 }
    );
  }

  // Read-only: an accepted client can still see their acceptance after the
  // offer expires. Submitting (POST) stays on the stricter offer check.
  const verification = await verifyEngagementAccess(proposalId, accessCode);
  if (!verification.success) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }

  const acceptance = await getProposalAcceptance(proposalId);
  return NextResponse.json({ success: true, acceptance });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, accessCode, status, counterNote, packageId, paymentPlanId } = body;

    if (!proposalId || !accessCode || !status) {
      return NextResponse.json(
        { success: false, error: "proposalId, accessCode, and status are required" },
        { status: 400 }
      );
    }

    if (status !== "accepted" && status !== "counter") {
      return NextResponse.json(
        { success: false, error: "status must be 'accepted' or 'counter'" },
        { status: 400 }
      );
    }

    if (status === "counter" && !counterNote?.trim()) {
      return NextResponse.json(
        { success: false, error: "counterNote is required when status is 'counter'" },
        { status: 400 }
      );
    }

    const verification = await verifyProposalAccess(proposalId, accessCode);
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
    }

    // Once accepted, the deal is closed — reject further submissions
    const existing = await getProposalAcceptance(proposalId);
    if (existing?.status === "accepted") {
      return NextResponse.json(
        { success: false, error: "This proposal has already been accepted" },
        { status: 409 }
      );
    }

    const trimmedNote = status === "counter" ? counterNote.trim() : undefined;
    const trimmedPackageId = packageId?.trim() || undefined;
    const trimmedPlanId = paymentPlanId?.trim() || undefined;

    await setProposalAcceptance(proposalId, {
      status,
      counterNote: trimmedNote,
      packageId: trimmedPackageId,
      paymentPlanId: trimmedPlanId,
    });

    // Joseph-facing notification. Best-effort — if email fails, the response
    // is still recorded; we log and return success.
    const proposal = verification.proposal;
    if (proposal) {
      try {
        await sendProposalResponseNotice({
          kind: status === "accepted" ? "accepted" : existing?.status === "counter" ? "counter-updated" : "counter",
          clientName: proposal.client.name,
          proposalId,
          projectTitle: proposal.title,
          packageName: proposal.packages?.find((p) => p.id === trimmedPackageId)?.name ?? trimmedPackageId,
          paymentPlanName: proposal.paymentPlans?.find((p) => p.id === trimmedPlanId)?.name ?? trimmedPlanId,
          counterNote: trimmedNote,
          submittedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Proposal response notice email failed:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving proposal acceptance:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
