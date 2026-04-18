import { NextRequest, NextResponse } from "next/server";
import { verifyProposalAccess, getCheckedAssetItems, setAssetItemChecked } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");
  const accessCode = searchParams.get("accessCode");

  if (!proposalId || !accessCode) {
    return NextResponse.json({ success: false, error: "proposalId and accessCode are required" }, { status: 400 });
  }

  const verification = await verifyProposalAccess(proposalId, accessCode);
  if (!verification.success) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
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

    const verification = await verifyProposalAccess(proposalId, accessCode);
    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
    }

    await setAssetItemChecked(proposalId, itemId, checked);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating asset checklist:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
