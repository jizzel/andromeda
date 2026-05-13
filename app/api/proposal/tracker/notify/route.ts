import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getProposalById, getTrackerRow, markTrackerNotified } from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { sendMilestoneEmail } from "@/lib/email";

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: NextRequest) {
  let body: { proposalId?: string; phaseId?: string; milestoneId?: string; secret?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const expectedSecret = process.env.TRACKER_WEBHOOK_SECRET;
  if (!expectedSecret || !body.secret || !constantTimeEqual(body.secret, expectedSecret)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { proposalId, phaseId, milestoneId } = body;
  if (!proposalId || !phaseId || !milestoneId) {
    return NextResponse.json(
      { success: false, error: "proposalId, phaseId, and milestoneId are required" },
      { status: 400 }
    );
  }

  const row = await getTrackerRow(proposalId, phaseId, milestoneId);
  if (!row) {
    return NextResponse.json({ success: true, skipped: "row-missing" });
  }
  if (row.state.status !== "done") {
    return NextResponse.json({ success: true, skipped: "not-done" });
  }
  if (row.notifiedAt) {
    return NextResponse.json({ success: true, skipped: "already-notified" });
  }

  const proposal = await getProposalById(proposalId);
  if (!proposal) {
    return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
  }
  const clientEmail = proposal.data.client.email;
  if (!clientEmail) {
    return NextResponse.json({ success: false, error: "Client email not configured" }, { status: 400 });
  }
  const tracker = proposal.data.tracker;
  if (!tracker) {
    return NextResponse.json({ success: false, error: "Tracker not configured" }, { status: 400 });
  }

  const phases = resolveTrackerPhases(tracker);
  const phase = phases.find((p) => p.id === phaseId);
  const milestone = phase?.milestones.find((m) => m.id === milestoneId);
  if (!phase || !milestone) {
    return NextResponse.json({ success: false, error: "Milestone not found in templates" }, { status: 400 });
  }

  try {
    await sendMilestoneEmail({
      to: clientEmail,
      clientName: proposal.data.client.name,
      proposalId,
      projectTitle: proposal.data.title,
      phaseTitle: phase.title,
      milestoneLabel: milestone.label,
      note: row.state.note,
    });
    await markTrackerNotified(proposalId, phaseId, milestoneId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tracker notify failed:", error);
    return NextResponse.json({ success: false, error: "Email send failed" }, { status: 500 });
  }
}
