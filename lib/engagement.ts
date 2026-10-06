import { readAgreement, readEngagementState } from "@/lib/google-sheets";
import { computeEngagementGates, LOCKED_GATES, type EngagementGates, type EngagementOverrides, type GateInputs } from "@/lib/engagement-gates";
import type { AgreementRecord } from "@/types/agreement";
import { ENGAGEMENT_FRESH_MS, ENGAGEMENT_STALE_MS, recallEngagement, rememberEngagement } from "@/lib/engagement-cache";

export interface EngagementContext {
  gates: EngagementGates;
  /** The agreement record (any status), for callers that also need it — one read for both. Returned whenever it was read, even if the overrides read failed. */
  agreement: AgreementRecord | null;
  /** The EngagementState row, or null when the proposal has none. */
  overrides: EngagementOverrides | null;
  /** False when the state couldn't be read and nothing recent was remembered: gates are then locked (fail closed). */
  ok: boolean;
  /** Served from this instance's memory (fresh, or a stale fallback after a failed read). */
  cached?: "fresh" | "stale";
}

const fromReading = (data: GateInputs, agreement: AgreementRecord | null, overrides: EngagementOverrides | null) =>
  computeEngagementGates(data, agreement?.status === "executed", overrides);

/**
 * The client hub gates for one proposal (see `lib/engagement-gates.ts`): one
 * read each of Agreements and EngagementState, in parallel — or this
 * instance's reading from the last minute (lib/engagement-cache.ts). If the
 * reads fail, a reading up to 10 minutes old is used; with none, both tabs are
 * locked rather than guessed, so an "off" override is never bypassed.
 * Server-only. (Pages that act on the agreement itself read it fresh.)
 */
export async function loadEngagement(proposalId: string, data: GateInputs): Promise<EngagementContext> {
  const fresh = recallEngagement(proposalId, ENGAGEMENT_FRESH_MS);
  if (fresh) return { gates: fromReading(data, fresh.agreement, fresh.overrides), agreement: fresh.agreement, overrides: fresh.overrides, ok: true, cached: "fresh" };

  // Settled independently: the agreement drives the Agreement tab on its own,
  // so a failed overrides read must not hide it (and vice versa).
  const [agreementRead, overridesRead] = await Promise.allSettled([readAgreement(proposalId), readEngagementState(proposalId)]);
  if (agreementRead.status === "fulfilled" && overridesRead.status === "fulfilled") {
    const agreement = agreementRead.value;
    const overrides = overridesRead.value;
    rememberEngagement(proposalId, { agreement, overrides });
    return { gates: fromReading(data, agreement, overrides), agreement, overrides, ok: true };
  }

  const error = agreementRead.status === "rejected" ? agreementRead.reason : (overridesRead as PromiseRejectedResult).reason;
  const agreementNow = agreementRead.status === "fulfilled" ? agreementRead.value : null;
  const stale = recallEngagement(proposalId, ENGAGEMENT_STALE_MS);
  if (stale) {
    console.warn(`Engagement state for ${proposalId} partly unavailable; gates from this instance's reading ${Math.round((Date.now() - stale.at) / 1000)}s ago:`, error);
    // Prefer what was just read; fall back to the remembered value only for the part that failed.
    const agreement = agreementRead.status === "fulfilled" ? agreementNow : stale.agreement;
    const overrides = overridesRead.status === "fulfilled" ? overridesRead.value : stale.overrides;
    return { gates: fromReading(data, agreement, overrides), agreement, overrides, ok: true, cached: "stale" };
  }
  console.error(`Engagement state for ${proposalId} unavailable (Assets/Progress locked):`, error);
  // Assets and Progress fail closed; a successfully read agreement is still returned.
  return { gates: LOCKED_GATES, agreement: agreementNow, overrides: null, ok: false };
}
