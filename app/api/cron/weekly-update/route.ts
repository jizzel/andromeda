import { NextRequest, NextResponse } from "next/server";
import {
  getAllProposals,
  getAllTrackerStatesByProposal,
  getAllWeeklyNotes,
  getAllWeeklyUpdatesSent,
  markWeeklyUpdateSent,
} from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { sendWeeklyUpdate } from "@/lib/email";
import type { TrackerMilestoneState } from "@/types/proposal";

// Vercel Cron Jobs schedule: `30 16 * * 5` → Friday 16:30 UTC.
// That's 4:30pm Ghana time (UTC+0). If/when clients in other time zones are
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

  // Batch-fetch everything we need in parallel, one sheet read per dataset.
  // Each proposal then processes against in-memory data — no per-proposal I/O
  // until the (parallel) send + idempotency-stamp at the end.
  let proposals: Awaited<ReturnType<typeof getAllProposals>>;
  let statesByProposal: Map<string, TrackerMilestoneState[]>;
  let notesByKey: Map<string, string>;
  let sentKeys: Set<string>;
  try {
    [proposals, statesByProposal, notesByKey, sentKeys] = await Promise.all([
      getAllProposals(),
      getAllTrackerStatesByProposal(),
      getAllWeeklyNotes(),
      getAllWeeklyUpdatesSent(),
    ]);
  } catch (error) {
    console.error("Weekly update cron: failed to fetch batched sheet data", error);
    return NextResponse.json(
      { success: false, error: "Failed to read sheet data" },
      { status: 500 }
    );
  }

  // Process all proposals in parallel. processProposal is now self-contained
  // (in-memory filters + at most one Resend send + one append for the
  // idempotency stamp), so concurrency is bounded by Resend's rate limits
  // and Sheets API append limits — both comfortable for the proposal count
  // this site will realistically see.
  const results = await Promise.all(
    proposals.map((proposal) =>
      processProposal({
        proposal,
        weekEndingDate,
        dateRange,
        weekStart,
        now,
        states: statesByProposal.get(proposal.id) ?? [],
        note: notesByKey.get(`${proposal.id}::${weekEndingDate}`),
        alreadySent: sentKeys.has(`${proposal.id}::${weekEndingDate}`),
      })
    )
  );

  return NextResponse.json({ success: true, weekEndingDate, results });
}

interface ProcessProposalArgs {
  proposal: Awaited<ReturnType<typeof getAllProposals>>[number];
  weekEndingDate: string;
  dateRange: string;
  weekStart: Date;
  now: Date;
  states: TrackerMilestoneState[];
  note: string | undefined;
  alreadySent: boolean;
}

async function processProposal({
  proposal,
  weekEndingDate,
  dateRange,
  weekStart,
  now,
  states,
  note,
  alreadySent,
}: ProcessProposalArgs): Promise<SendResult> {
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
  if (alreadySent) {
    return { proposalId, status: "skipped", reason: "already-sent-this-week" };
  }

  const phases = resolveTrackerPhases(data.tracker);
  if (phases.length === 0) {
    return { proposalId, status: "skipped", reason: "no-phases-resolved" };
  }

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
