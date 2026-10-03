import { NextRequest, NextResponse } from "next/server";
import { getCheckedAssetItems, setAssetItemChecked } from "@/lib/google-sheets";
import { resolveClientAccess } from "@/lib/client-session";
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
  const proposalId = searchParams.get("proposalId") ?? "";
  // The hub session cookie authenticates; an explicit access code still works.
  const access = await resolveClientAccess(request, proposalId, { accessCode: searchParams.get("accessCode") });
  if (!access.ok) return NextResponse.json({ success: false, error: access.error, code: access.code }, { status: access.status });
  if (!assetsAvailable(access.proposal)) {
    return NextResponse.json({ success: false, error: ASSETS_NOT_AVAILABLE }, { status: 404 });
  }

  const checkedIds = await getCheckedAssetItems(proposalId);
  return NextResponse.json({ success: true, checkedIds });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, accessCode, itemId, checked } = body;

    if (typeof proposalId !== "string" || !proposalId || !itemId || typeof checked !== "boolean") {
      return NextResponse.json({ success: false, error: "proposalId, itemId, and checked are required" }, { status: 400 });
    }

    const access = await resolveClientAccess(request, proposalId, { accessCode: typeof accessCode === "string" ? accessCode : null });
    if (!access.ok) return NextResponse.json({ success: false, error: access.error, code: access.code }, { status: access.status });
    if (!assetsAvailable(access.proposal)) {
      return NextResponse.json({ success: false, error: ASSETS_NOT_AVAILABLE }, { status: 404 });
    }

    await setAssetItemChecked(proposalId, itemId, checked);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating asset checklist:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred" }, { status: 500 });
  }
}
