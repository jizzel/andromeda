import { NextRequest, NextResponse } from "next/server";
import { resolveClientAccess } from "@/lib/client-session";
import { getOrSeedTracker } from "@/lib/tracker";
import { resolveTrackerPhases } from "@/constants/tracker-templates";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId") ?? "";
  const access = await resolveClientAccess(request, proposalId, { accessCode: searchParams.get("accessCode") });
  if (!access.ok) return NextResponse.json({ success: false, error: access.error, code: access.code }, { status: access.status });

  const proposal = access.proposal;
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
