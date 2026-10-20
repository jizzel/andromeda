import { NextRequest, NextResponse } from "next/server";
import { resolveClientAccess } from "@/lib/client-session";
import { loadEngagement } from "@/lib/engagement";
import { getOrSeedTracker } from "@/lib/tracker";
import { resolveTrackerPhases } from "@/constants/tracker-templates";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId") ?? "";
  const access = await resolveClientAccess(request, proposalId, { accessCode: searchParams.get("accessCode") });
  if (!access.ok) return NextResponse.json({ success: false, error: access.error, code: access.code }, { status: access.status });

  const proposal = access.proposal;
  // Open once the agreement is executed (or switched on in admin) — lib/engagement-gates.ts.
  if (!proposal.tracker || !(await loadEngagement(proposalId, proposal)).gates.progress.available) {
    return NextResponse.json({ success: false, error: "Tracker not available for this proposal" }, { status: 404 });
  }

  const phases = resolveTrackerPhases(proposal.tracker);
  let states;
  try {
    states = await getOrSeedTracker(proposalId, proposal.tracker, proposal);
  } catch (error) {
    // The tracker couldn't be read; never seed from a failed read (it would duplicate milestones).
    console.error(`Tracker for ${proposalId} unavailable:`, error);
    return NextResponse.json({ success: false, error: "Couldn't load the project tracker. Please try again in a moment." }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    phases,
    states,
    config: proposal.tracker,
  });
}
