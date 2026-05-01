import { NextRequest, NextResponse } from "next/server";
import { verifyProposalAccess } from "@/lib/google-sheets";
import { getOrSeedTracker } from "@/lib/tracker";
import { resolveTrackerPhases } from "@/constants/tracker-templates";

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
  if (!verification.success || !verification.proposal) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }

  const proposal = verification.proposal;
  if (!proposal.tracker || !proposal.trackerReady) {
    return NextResponse.json({ success: false, error: "Tracker not available for this proposal" }, { status: 404 });
  }

  const phases = resolveTrackerPhases(proposal.tracker);
  const states = await getOrSeedTracker(proposalId, proposal.tracker, proposal);

  return NextResponse.json({
    success: true,
    phases,
    states,
    config: proposal.tracker,
  });
}
