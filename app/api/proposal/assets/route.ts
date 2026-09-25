import { NextRequest, NextResponse } from "next/server";
import { verifyEngagementAccess, getCheckedAssetItems, setAssetItemChecked } from "@/lib/google-sheets";
import type { ProposalData } from "@/types/proposal";

const ASSETS_NOT_AVAILABLE = "Asset checklist not available for this proposal";

// `assetsReady` is flipped on the sheet once the service agreement is signed.
// Enforced here (not just by hiding the link) so the checklist can't be opened
// or written to early by visiting /assets directly.
function assetsAvailable(proposal: ProposalData): boolean {
  return !!proposal.assets && !!proposal.assetsReady;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");
  const accessCode = searchParams.get("accessCode");

  if (!proposalId || !accessCode) {
    return NextResponse.json({ success: false, error: "proposalId and accessCode are required" }, { status: 400 });
  }

  const verification = await verifyEngagementAccess(proposalId, accessCode);
  if (!verification.success || !verification.proposal) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }
  if (!assetsAvailable(verification.proposal)) {
    return NextResponse.json({ success: false, error: ASSETS_NOT_AVAILABLE }, { status: 404 });
  }

  const checkedIds = await getCheckedAssetItems(proposalId);
  return NextResponse.json({ success: true, checkedIds });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, accessCode, itemId, checked } = body;

    if (!proposalId || !accessCode || !itemId || typeof checked !== "boolean") {
      return NextResponse.json(
        { success: false, error: "proposalId, accessCode, itemId, and checked are required" },
        { status: 400 }
      );
    }

    const verification = await verifyEngagementAccess(proposalId, accessCode);
    if (!verification.success || !verification.proposal) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
    }
    if (!assetsAvailable(verification.proposal)) {
      return NextResponse.json({ success: false, error: ASSETS_NOT_AVAILABLE }, { status: 404 });
    }

    await setAssetItemChecked(proposalId, itemId, checked);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating asset checklist:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
