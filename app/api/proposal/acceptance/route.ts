import { NextRequest, NextResponse } from "next/server";
import {
  verifyProposalAccess,
  getProposalAcceptance,
  setProposalAcceptance,
} from "@/lib/google-sheets";

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

  const verification = await verifyProposalAccess(proposalId, accessCode);
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

    await setProposalAcceptance(proposalId, {
      status,
      counterNote: status === "counter" ? counterNote.trim() : undefined,
      packageId: packageId?.trim() || undefined,
      paymentPlanId: paymentPlanId?.trim() || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving proposal acceptance:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
