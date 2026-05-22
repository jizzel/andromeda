import { NextRequest, NextResponse } from "next/server";
import {
  getAllProposals,
  getTrackerStates,
  getWeeklyNote,
  hasWeeklyUpdateBeenSent,
  markWeeklyUpdateSent,
} from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { sendWeeklyUpdate } from "@/lib/email";
import type { TrackerMilestoneState } from "@/types/proposal";

// Vercel Cron Jobs schedule: `0 20 * * 5` → Friday 20:00 UTC.
// That's 8pm Ghana time (UTC+0). If/when clients in other time zones are
// added, the schedule should be per-client or moved to a queue model.

interface SendResult {
  proposalId: string;
  status: "sent" | "skipped";
  reason?: string;
}

export async function GET(request: NextRequest) {
  // Vercel injects `Authorization: Bearer <CRON_SECRET>` on scheduled runs.
  // Manual hits without the secret are rejected. Same pattern as the tracker
  // notify webhook.
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekEndingDate = isoDate(now);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const dateRange = `${friendlyDate(weekStart)} – ${friendlyDate(now)}`;

  let proposals;
  try {
    proposals = await getAllProposals();
  } catch (error) {
    console.error("Weekly update cron: failed to read proposals", error);
    return NextResponse.json(
      { success: false, error: "Failed to read proposals" },
      { status: 500 }
    );
  }

  const results: SendResult[] = [];

  for (const proposal of proposals) {
    const result = await processProposal(proposal, weekEndingDate, dateRange, weekStart, now);
    results.push(result);
  }

  return NextResponse.json({ success: true, weekEndingDate, results });
}

async function processProposal(
  proposal: Awaited<ReturnType<typeof getAllProposals>>[number],
  weekEndingDate: string,
  dateRange: string,
  weekStart: Date,
  now: Date
): Promise<SendResult> {
  const { id: proposalId, data } = proposal;

  if (!data.trackerReady || !data.tracker) {
    return { proposalId, status: "skipped", reason: "tracker-not-ready" };
  }
  if (!data.client.email) {
    return { proposalId, status: "skipped", reason: "no-client-email" };
  }
  if (!proposal.isActive) {
    return { proposalId, status: "skipped", reason: "proposal-inactive" };
  }

  // Idempotency guard — re-running the cron for the same week is a no-op.
  const alreadySent = await hasWeeklyUpdateBeenSent(proposalId, weekEndingDate);
  if (alreadySent) {
    return { proposalId, status: "skipped", reason: "already-sent-this-week" };
  }

  const phases = resolveTrackerPhases(data.tracker);
  if (phases.length === 0) {
    return { proposalId, status: "skipped", reason: "no-phases-resolved" };
  }

  const states = await getTrackerStates(proposalId);
  const stateByKey = new Map<string, TrackerMilestoneState>();
  for (const s of states) stateByKey.set(`${s.phaseId}::${s.milestoneId}`, s);

  const completed: { label: string; date?: string }[] = [];
  const inProgress: { label: string }[] = [];
  const comingUp: { label: string }[] = [];

  for (const phase of phases) {
    for (const milestone of phase.milestones) {
      const state = stateByKey.get(`${phase.id}::${milestone.id}`);
      const status = state?.status ?? "pending";

      if (status === "done") {
        // Only include in "completed this week" if completedAt is in the last 7 days.
        const completedAt = state?.completedAt;
        if (completedAt) {
          const t = new Date(completedAt).getTime();
          if (!isNaN(t) && t >= weekStart.getTime() && t <= now.getTime()) {
            completed.push({ label: milestone.label, date: friendlyDate(new Date(completedAt)) });
          }
        }
      } else if (status === "in_progress") {
        inProgress.push({ label: milestone.label });
      } else if (status === "pending" && comingUp.length < 3) {
        comingUp.push({ label: milestone.label });
      }
    }
  }

  // Skip-on-no-news: if nothing happened this week AND nothing's in flight,
  // emailing the client would advertise inactivity. Stay quiet.
  if (completed.length === 0 && inProgress.length === 0) {
    return { proposalId, status: "skipped", reason: "no-activity-this-week" };
  }

  const note = (await getWeeklyNote(proposalId, weekEndingDate)) ?? undefined;

  try {
    await sendWeeklyUpdate({
      to: data.client.email,
      clientName: data.client.name,
      proposalId,
      projectTitle: data.title,
      dateRange,
      weekEndingDate,
      completed,
      inProgress,
      comingUp,
      note,
    });
    await markWeeklyUpdateSent(proposalId, weekEndingDate);
    return { proposalId, status: "sent" };
  } catch (error) {
    console.error(`Weekly update send failed for ${proposalId}:`, error);
    return { proposalId, status: "skipped", reason: "send-error" };
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function friendlyDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
