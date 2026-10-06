import {
  getAllAcceptances,
  getAllAgreements,
  getAllCheckedAssetsByProposal,
  getAllProposals,
  getAllEngagementEventsByProposal,
  getAllEngagementStates,
  foldRevisions,
  readAllTrackerStatesByProposal,
  type EngagementEvent,
  type ProposalRecord,
} from "@/lib/google-sheets";
import { foldAgreementActivity } from "@/lib/agreement-activity";
import { loadTemplate } from "@/lib/agreement-templates";
import { computeEngagementGates, LOCKED_GATES, type EngagementGates } from "@/lib/engagement-gates";
import { proposalVersion } from "@/lib/proposal-version";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import type { ProposalAcceptance, PublishedRevision, TrackerMilestoneState } from "@/types/proposal";
import type { AgreementRecord } from "@/types/agreement";
import { UNAVAILABLE, type ChangeRequest, type DashboardRow, type LifecycleState, type Source } from "./admin-dashboard-types";

export { UNAVAILABLE };
export type { ChangeRequest, DashboardRow, LifecycleState };

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

const EXPIRING_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveRow(
  record: ProposalRecord,
  acceptanceSource: Source<ProposalAcceptance | undefined>,
  checkedAssetsSource: Source<Set<string> | undefined>,
  trackerSource: Source<TrackerMilestoneState[] | undefined>,
  now: Date,
  revisionsSource: Source<Map<string, PublishedRevision> | undefined> = undefined,
  agreementSource: Source<AgreementRecord | undefined> = undefined,
  /** Change requests the client made against the current agreement (from its events). */
  agreementChangeRequests = 0,
  /** The client hub gates (lib/engagement-gates.ts); defaults to the proposal's own data with no agreement or overrides. */
  gates: EngagementGates = computeEngagementGates(record.data, false, null)
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
      unlocked: gates.assets.available,
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
      unlocked: gates.progress.available,
    };
  }

  const activity = [
    acceptance?.acceptedAt,
    ...(trackerStates ?? []).map((s) => s.updatedAt),
    data.issuedAt,
  ].filter((t): t is string => !!t && !isNaN(new Date(t).getTime()));
  const lastActivity = activity.sort().at(-1) ?? "";

  let changeRequest: ChangeRequest | null = null;
  if (acceptance?.status === "counter") {
    // Church proposals have neither; the default/social layouts may have both.
    const named = (list: unknown, id?: string) =>
      id && Array.isArray(list) ? (list as { id: string; name: string }[]).find((o) => o.id === id)?.name ?? id : undefined;
    changeRequest = {
      note: acceptance.counterNote ?? "",
      at: acceptance.acceptedAt,
      packageName: named((data as { packages?: unknown }).packages, acceptance.packageId),
      planName: named((data as { paymentPlans?: unknown }).paymentPlans, acceptance.paymentPlanId),
      version: acceptance.proposalVersion,
      revised: state === "revised",
      publication: (() => {
        if (revisionsSource === UNAVAILABLE) return UNAVAILABLE;
        const revision = revisionsSource?.get(currentVersion);
        return revision ? { at: revision.publishedAt, email: revision.email.status, emailTo: revision.email.to } : null;
      })(),
    };
  }

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
    changeRequest,
    agreement:
      agreementSource === UNAVAILABLE
        ? UNAVAILABLE
        : agreementSource
          ? {
              status: agreementSource.status,
              signedAt: agreementSource.providerSignature?.signedAt,
              changesRequested: agreementSource.status === "sent" && agreementChangeRequests > 0,
              // The terms file no longer matches what the agreement pinned: it can't be signed (or shown to the client).
              termsChanged:
                agreementSource.status !== "executed" &&
                loadTemplate(agreementSource.templateId, agreementSource.templateVersion)?.hash !== agreementSource.templateHash,
            }
          : null,
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

/** A proposal's events, or null when the tab couldn't be read. */
function eventsOf(source: Settled<Map<string, EngagementEvent[]>>, id: string): EngagementEvent[] | null {
  return source.ok ? (source.value.get(id) ?? []) : null;
}

function pick<T>(source: Settled<Map<string, T>>, id: string): Source<T | undefined> {
  return source.ok ? source.value.get(id) : UNAVAILABLE;
}

/** Throws if the Proposals tab itself can't be read — there's nothing to show without it. */
export async function loadDashboard(now = new Date()): Promise<DashboardData> {
  const [proposals, acceptances, assets, trackers, events, agreements, overrides] = await Promise.all([
    getAllProposals(),
    settle("ProposalAcceptance", getAllAcceptances()),
    settle("ProposalAssets", getAllCheckedAssetsByProposal()),
    settle("ProjectTracker", readAllTrackerStatesByProposal()),
    settle("EngagementEvents", getAllEngagementEventsByProposal()),
    settle("Agreements", getAllAgreements()),
    settle("EngagementState", getAllEngagementStates()),
  ]);
  const rows = proposals
    .map((record) => {
      const proposalEvents = eventsOf(events, record.id);
      const agreement = pick(agreements, record.id);
      const changeRequests =
        proposalEvents && agreement && agreement !== UNAVAILABLE ? foldAgreementActivity(proposalEvents, agreement.agreementHash).changeRequests.length : 0;
      return deriveRow(
        record,
        pick(acceptances, record.id),
        pick(assets, record.id),
        pick(trackers, record.id),
        now,
        events.ok ? foldRevisions(proposalEvents ?? []) : UNAVAILABLE,
        agreement,
        changeRequests,
        // Same rule as the client hub; locked when either input is unreadable.
        agreements.ok && overrides.ok
          ? computeEngagementGates(record.data, agreements.value.get(record.id)?.status === "executed", overrides.value.get(record.id) ?? null)
          : LOCKED_GATES
      );
    })
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
  const unavailable = [acceptances, assets, trackers, events, agreements, overrides].flatMap((source) => (source.ok ? [] : [source.tab]));
  return { rows, unavailable };
}
