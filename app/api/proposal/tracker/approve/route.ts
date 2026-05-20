import { NextRequest, NextResponse } from "next/server";
import {
  getProposalById,
  getTrackerRow,
  setTrackerMilestone,
  verifyProposalAccess,
} from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { sendClientApprovalNotice } from "@/lib/email";

export async function POST(request: NextRequest) {
  let body: { proposalId?: string; phaseId?: string; milestoneId?: string; accessCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { proposalId, phaseId, milestoneId, accessCode } = body;
  if (!proposalId || !phaseId || !milestoneId || !accessCode) {
    return NextResponse.json(
      { success: false, error: "proposalId, phaseId, milestoneId, and accessCode are required" },
      { status: 400 }
    );
  }

  const verification = await verifyProposalAccess(proposalId, accessCode);
  if (!verification.success) {
    return NextResponse.json({ success: false, error: verification.error }, { status: 401 });
  }

  const proposal = await getProposalById(proposalId);
  if (!proposal) {
    return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });
  }
  const tracker = proposal.data.tracker;
  if (!tracker || !proposal.data.trackerReady) {
    return NextResponse.json({ success: false, error: "Tracker not enabled" }, { status: 404 });
  }

  const phases = resolveTrackerPhases(tracker);
  const phase = phases.find((p) => p.id === phaseId);
  const milestone = phase?.milestones.find((m) => m.id === milestoneId);
  if (!phase || !milestone) {
    return NextResponse.json({ success: false, error: "Milestone not found" }, { status: 404 });
  }
  if (!milestone.clientApprovable) {
    return NextResponse.json(
      { success: false, error: "This milestone cannot be approved by the client" },
      { status: 403 }
    );
  }

  const existing = await getTrackerRow(proposalId, phaseId, milestoneId);
  if (existing?.state.status === "done") {
    return NextResponse.json({ success: false, error: "Milestone is already approved" }, { status: 409 });
  }

  const approvedAt = new Date().toISOString();
  const stamp = `Approved by client via tracker on ${approvedAt}`;
  const existingNote = existing?.state.note?.trim();
  const note = existingNote ? `${existingNote}\n${stamp}` : stamp;

  await setTrackerMilestone(proposalId, phaseId, milestoneId, {
    status: "done",
    completedAt: approvedAt,
    note,
  });

  // Joseph-facing notification. Best-effort — if email fails, the approval
  // is still recorded; we log and return success.
  try {
    await sendClientApprovalNotice({
      clientName: proposal.data.client.name,
      proposalId,
      projectTitle: proposal.data.title,
      phaseTitle: phase.title,
      milestoneLabel: milestone.label,
      approvedAt,
    });
  } catch (error) {
    console.error("Client approval notice email failed:", error);
  }

  return NextResponse.json({ success: true, approvedAt });
}
