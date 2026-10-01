import {
  getAllAcceptances,
  getAllCheckedAssetsByProposal,
  getAllProposals,
  readAllTrackerStatesByProposal,
  type ProposalRecord,
} from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import type { ProposalAcceptance, TrackerMilestoneState } from "@/types/proposal";

/**
 * Admin dashboard model: one row per proposal with its lifecycle state,
 * derived from the Proposals, ProposalAcceptance, ProposalAssets and
 * ProjectTracker tabs (four batched reads, no per-proposal lookups).
 *
 * A failed read is never shown as empty data: an unreadable response tab would
 * otherwise turn accepted proposals into "sent"/"expired", and unreadable
 * assets/tracker tabs into 0% progress. Each source that fails is passed as
 * `UNAVAILABLE` and the affected fields render as unavailable.
 */

export const UNAVAILABLE = "unavailable" as const;
type Source<T> = T | typeof UNAVAILABLE;

export type LifecycleState =
  | "draft" // isActive = false
  | "sent" // live offer, no response yet
  | "expiring" // live offer, ≤ 3 days left
  | "expired" // offer window closed without acceptance
  | "changes_requested" // client asked for changes; awaiting Joseph's revision
  | "revised" // Joseph revised after a change request; awaiting the client
  | "accepted"
  | "unknown"; // responses couldn't be read, so the state can't be trusted

export interface ProgressCount {
  done: number;
  total: number;
}

export interface DashboardRow {
  id: string;
  clientName: string;
  title: string;
  type: string;
  accessCode: string;
  state: LifecycleState;
  expiryDate: string;
  /** Days until expiry (negative once past); null for an unparseable date. */
  daysLeft: number | null;
  response: { status: ProposalAcceptance["status"]; at: string } | null | typeof UNAVAILABLE;
  /** Accepted against a version that no longer matches the current terms. */
  termsChangedSinceAcceptance: boolean;
  /** Required asset items checked; null when the proposal has no asset request. */
  assets: (ProgressCount & { unlocked: boolean }) | null | typeof UNAVAILABLE;
  /** Tracker milestones done; null when no tracker is configured. */
  tracker: (ProgressCount & { unlocked: boolean }) | null | typeof UNAVAILABLE;
  /** ISO timestamp used for ordering (latest response, tracker update, or issue date). */
  lastActivity: string;
}

const EXPIRING_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveRow(
  record: ProposalRecord,
  acceptanceSource: Source<ProposalAcceptance | undefined>,
  checkedAssetsSource: Source<Set<string> | undefined>,
  trackerSource: Source<TrackerMilestoneState[] | undefined>,
  now: Date
): DashboardRow {
  const responsesKnown = acceptanceSource !== UNAVAILABLE;
  const acceptance = responsesKnown ? acceptanceSource : undefined;
  const checkedAssets = checkedAssetsSource === UNAVAILABLE ? undefined : checkedAssetsSource;
  const trackerStates = trackerSource === UNAVAILABLE ? undefined : trackerSource;
  const data = record.data;
  const currentVersion = proposalVersion(data);
  const expiry = new Date(record.expiryDate);
  const daysLeft = isNaN(expiry.getTime()) ? null : Math.ceil((expiry.getTime() - now.getTime()) / DAY_MS);
  const offerOpen = daysLeft !== null && expiry.getTime() >= now.getTime();

  let state: LifecycleState;
  if (!record.isActive) state = "draft";
  else if (!responsesKnown) state = "unknown";
  else if (acceptance?.status === "accepted") state = "accepted";
  else if (acceptance?.status === "counter") {
    // Same rule as the client page: a different current version means a revision is out.
    const revised = !!acceptance.proposalVersion && acceptance.proposalVersion !== currentVersion;
    state = revised ? "revised" : "changes_requested";
  } else if (!offerOpen) state = "expired";
  else if (daysLeft !== null && daysLeft <= EXPIRING_DAYS) state = "expiring";
  else state = "sent";

  let assets: DashboardRow["assets"] = null;
  if (data.assets && checkedAssetsSource === UNAVAILABLE) assets = UNAVAILABLE;
  else if (data.assets) {
    const required = data.assets.categories.flatMap((c) =>
      c.items.filter((item) => (item.priority ?? "required") === "required")
    );
    assets = {
      done: required.filter((item) => checkedAssets?.has(item.id)).length,
      total: required.length,
      unlocked: !!data.assetsReady,
    };
  }

  let tracker: DashboardRow["tracker"] = null;
  if (data.tracker && trackerSource === UNAVAILABLE) tracker = UNAVAILABLE;
  else if (data.tracker) {
    const milestoneKeys = resolveTrackerPhases(data.tracker).flatMap((phase) =>
      phase.milestones.map((m) => `${phase.id}/${m.id}`)
    );
    const done = new Set(
      (trackerStates ?? []).filter((s) => s.status === "done").map((s) => `${s.phaseId}/${s.milestoneId}`)
    );
    tracker = {
      done: milestoneKeys.filter((key) => done.has(key)).length,
      total: milestoneKeys.length,
      unlocked: !!data.trackerReady,
    };
  }

  const activity = [
    acceptance?.acceptedAt,
    ...(trackerStates ?? []).map((s) => s.updatedAt),
    data.issuedAt,
  ].filter((t): t is string => !!t && !isNaN(new Date(t).getTime()));
  const lastActivity = activity.sort().at(-1) ?? "";

  return {
    id: record.id,
    clientName: data.client?.name ?? record.id,
    title: data.title ?? "",
    type: data.proposalType ?? "website",
    accessCode: record.accessCode,
    state,
    expiryDate: record.expiryDate,
    daysLeft,
    response: !responsesKnown ? UNAVAILABLE : acceptance ? { status: acceptance.status, at: acceptance.acceptedAt } : null,
    termsChangedSinceAcceptance:
      acceptance?.status === "accepted" && !!acceptance.proposalVersion && acceptance.proposalVersion !== currentVersion,
    assets,
    tracker,
    lastActivity,
  };
}

export interface DashboardData {
  rows: DashboardRow[];
  /** Sheet tabs that couldn't be read for this load. */
  unavailable: string[];
}

type Settled<T> = { ok: true; value: T } | { ok: false; tab: string };

function settle<T>(tab: string, read: Promise<T>): Promise<Settled<T>> {
  return read.then(
    (value) => ({ ok: true as const, value }),
    (error) => {
      console.error(`Admin dashboard: failed to read ${tab}:`, error);
      return { ok: false as const, tab };
    }
  );
}

function pick<T>(source: Settled<Map<string, T>>, id: string): Source<T | undefined> {
  return source.ok ? source.value.get(id) : UNAVAILABLE;
}

/** Throws if the Proposals tab itself can't be read — there's nothing to show without it. */
export async function loadDashboard(now = new Date()): Promise<DashboardData> {
  const [proposals, acceptances, assets, trackers] = await Promise.all([
    getAllProposals(),
    settle("ProposalAcceptance", getAllAcceptances()),
    settle("ProposalAssets", getAllCheckedAssetsByProposal()),
    settle("ProjectTracker", readAllTrackerStatesByProposal()),
  ]);
  const rows = proposals
    .map((record) =>
      deriveRow(record, pick(acceptances, record.id), pick(assets, record.id), pick(trackers, record.id), now)
    )
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  const unavailable = [acceptances, assets, trackers].flatMap((source) => (source.ok ? [] : [source.tab]));
  return { rows, unavailable };
}
