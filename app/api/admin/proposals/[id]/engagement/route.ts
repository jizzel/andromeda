import { after, type NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import { getProposalById, readAgreement, readEngagementState, withProposalLock, writeEngagementState } from "@/lib/google-sheets";
import { computeEngagementGates, effectiveOverrides, ENGAGEMENT_OVERRIDES, type EngagementOverride } from "@/lib/engagement-gates";
import { announceTrackerLive } from "@/lib/tracker-live";
import { busy, json, readJsonBody } from "../edit";

type Params = { params: Promise<{ id: string }> };

const isOverride = (value: unknown): value is EngagementOverride => typeof value === "string" && (ENGAGEMENT_OVERRIDES as readonly string[]).includes(value);

/**
 * Sets the client hub's Assets / Progress overrides (`auto | on | off`) in
 * the EngagementState tab, under the proposal lock. Starts from the overrides
 * in force — the row, or the legacy JSON flags when there's none — so changing
 * one switch keeps the other's effective value. Once a row exists the legacy
 * flags no longer count (the editor removes them from the JSON on its next save).
 */
export async function PUT(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);
  if ((body.assets !== undefined && !isOverride(body.assets)) || (body.tracker !== undefined && !isOverride(body.tracker))) {
    return json({ success: false, error: "Each switch must be auto, on or off." }, 400);
  }

  const locked = await withProposalLock(id, async (lock) => {
    const [proposal, row, agreement] = await Promise.all([getProposalById(id), readEngagementState(id), readAgreement(id)]);
    if (!proposal) return null;
    const { overrides: current } = effectiveOverrides(proposal.data, row);
    const next = {
      assets: isOverride(body.assets) ? body.assets : current.assets,
      tracker: isOverride(body.tracker) ? body.tracker : current.tracker,
    };
    const executed = agreement?.status === "executed";
    const before = computeEngagementGates(proposal.data, executed, row);
    await writeEngagementState(id, next, lock);
    const gates = computeEngagementGates(proposal.data, executed, next);
    return { overrides: next, gates, progressOpened: !before.progress.available && gates.progress.available };
  });
  if (locked.status === "busy") return busy();
  if (!locked.value) return json({ success: false, error: "Proposal not found" }, 404);
  const { progressOpened, ...result } = locked.value;
  // Progress just opened: the "tracker is live" email (once per proposal), after the response.
  if (progressOpened) after(() => announceTrackerLive(id).then(() => undefined));
  return json({ success: true, ...result });
}
