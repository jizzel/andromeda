import {
  appendEngagementEvent,
  getProposalById,
  getUnnotifiedDoneMilestones,
  markTrackerNotified,
  readProposalEngagementEvents,
} from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { getOrSeedTracker } from "@/lib/tracker";
import { loadEngagement } from "@/lib/engagement";
import { DuplicateEmailError, sendTrackerLive } from "@/lib/email";
import { proposalVersion } from "@/lib/proposal-version";

export type TrackerLiveOutcome = "sent" | "already" | "locked" | "not_applicable" | "failed";

/**
 * When a client's Progress tab opens (the agreement is executed, or it's
 * switched on in admin), email them once: "your project tracker is live",
 * listing what's already done. Milestones completed while it was locked were
 * deliberately not emailed (`tracker/notify` skips them, unstamped); this
 * covers them in one message and marks them notified, instead of a burst of
 * late per-milestone emails. Once per proposal: a recorded send is never
 * repeated (event `tracker_live_email`, Resend key per proposal). Best-effort;
 * safe to call again.
 */
export async function announceTrackerLive(proposalId: string): Promise<TrackerLiveOutcome> {
  try {
    const proposal = await getProposalById(proposalId);
    const data = proposal?.data;
    const to = data?.client?.email?.trim();
    if (!proposal?.isActive || !data?.tracker || !to) return "not_applicable";

    const events = await readProposalEngagementEvents(proposalId);
    if (events.some((e) => e.event === "tracker_live_email" && e.detail.status === "sent")) return "already";
    if (!(await loadEngagement(proposalId, data)).gates.progress.available) return "locked";

    // Seed if needed (auto-marks accepted / agreement-signed), then list what's done in tracker order.
    const states = await getOrSeedTracker(proposalId, data.tracker, data);
    const done = new Set(states.filter((s) => s.status === "done").map((s) => `${s.phaseId}/${s.milestoneId}`));
    const completed = resolveTrackerPhases(data.tracker).flatMap((phase) =>
      phase.milestones.filter((m) => done.has(`${phase.id}/${m.id}`)).map((m) => `${phase.title} · ${m.label}`)
    );

    let status: "sent" | "failed" = "sent";
    let error: string | undefined;
    try {
      await sendTrackerLive({ to, clientName: data.client.name, proposalId, projectTitle: data.title, completed, idempotencyKey: `tracker-live:${proposalId}` });
    } catch (sendError) {
      if (!(sendError instanceof DuplicateEmailError)) {
        console.error(`Tracker-live email for ${proposalId} failed:`, sendError);
        status = "failed";
        error = sendError instanceof Error ? sendError.message.slice(0, 300) : "Unknown error";
      }
    }

    if (status === "sent") {
      // Covered by this email: don't send them individually later.
      for (const m of await getUnnotifiedDoneMilestones(proposalId)) await markTrackerNotified(proposalId, m.phaseId, m.milestoneId);
    }
    try {
      await appendEngagementEvent({
        proposalId,
        event: "tracker_live_email",
        proposalVersion: proposalVersion(data),
        detail: { status, to, completed: completed.length, ...(error && { error }) },
      });
    } catch (eventError) {
      console.error(`Couldn't record the tracker-live email for ${proposalId}:`, eventError);
    }
    return status;
  } catch (error) {
    console.error(`Tracker-live announcement for ${proposalId} failed:`, error);
    return "failed";
  }
}
