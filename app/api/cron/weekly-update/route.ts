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
import {
  daysBefore,
  friendlyDate,
  isoDate,
  mostRecentFridayAt1630Utc,
} from "@/lib/dates";
import type { TrackerMilestoneState } from "@/types/proposal";

// Vercel Cron Jobs schedule: `30 16 * * 5` → Friday 16:30 UTC.
// That's 4:30pm Ghana time (UTC+0). If/when clients in other time zones are
// added, the schedule should be per-client or moved to a queue model.

// Day of the week the report covers. Surfaced in the email as
// "Week ending {WEEKLY_REPORT_DAY}, {date}". If the schedule above is ever
// changed, update this constant to match — they're a paired contract.
const WEEKLY_REPORT_DAY = "Friday";

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

  // The cron is scheduled for Friday 16:30 UTC but Vercel may retry late or a
  // human may replay manually mid-week. Snap to the most recent Friday 16:30
  // UTC so the data window, the displayed date, and the idempotency key all
  // anchor to the *intended* report time rather than the actual execution time.
  const reportDate = mostRecentFridayAt1630Utc(new Date());
  const weekEndingDate = isoDate(reportDate);
  // Data window: rolling 7 days back from the intended Friday. Includes
  // weekend completions so they aren't silently dropped between reports.
  const dataWindowStart = daysBefore(reportDate, 7);
  // Display range: the email's framing for the client, e.g. "22 May".
  // Paired with the WEEKLY_REPORT_DAY constant below so the email reads
  // "Week ending Friday, 22 May" without hardcoding the weekday in the template.
  const dateRange = friendlyDate(reportDate);

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
        weekEndingDay: WEEKLY_REPORT_DAY,
        dataWindowStart,
        reportDate,
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
  weekEndingDay: string;
  dataWindowStart: Date;
  /** The intended Friday 16:30 UTC — used as the upper bound for completedAt
   *  filtering. Distinct from `new Date()` to keep the data window stable on
   *  late or replayed cron runs. */
  reportDate: Date;
  states: TrackerMilestoneState[];
  note: string | undefined;
  alreadySent: boolean;
}

async function processProposal({
  proposal,
  weekEndingDate,
  dateRange,
  weekEndingDay,
  dataWindowStart,
  reportDate,
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
        // Window is `(dataWindowStart, reportDate]` — strict lower bound, inclusive
        // upper. A milestone completed exactly at the previous week's reportDate
        // belongs to *that* week's report (it matches `<=` there), not this one.
        const completedAt = state?.completedAt;
        if (completedAt) {
          const t = new Date(completedAt).getTime();
          if (!isNaN(t) && t > dataWindowStart.getTime() && t <= reportDate.getTime()) {
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
      weekEndingDay,
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

