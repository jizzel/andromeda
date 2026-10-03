import type { AgreementRecord } from "@/types/agreement";
import type { EngagementOverrides } from "@/lib/engagement-gates";

/**
 * Per-instance memory of the last successful engagement-state reading (the
 * agreement record and the EngagementState row) for each proposal, used by
 * `loadEngagement` (lib/engagement.ts):
 * - within FRESH_MS it's served without reading Sheets (fewer reads per hub
 *   page and API call);
 * - if a read fails, a reading up to STALE_MS old is used instead of locking
 *   the client's tabs (e.g. during a Sheets read-quota spike).
 * Writes on this instance clear it (`writeAgreement`, `writeEngagementState`);
 * other instances catch up within FRESH_MS. No imports from the Sheets layer,
 * so the writers can depend on it without a cycle.
 */

export const ENGAGEMENT_FRESH_MS = 60_000;
export const ENGAGEMENT_STALE_MS = 10 * 60_000;

export interface EngagementReading {
  agreement: AgreementRecord | null;
  overrides: EngagementOverrides | null;
  at: number;
}

const readings = new Map<string, EngagementReading>();

export function rememberEngagement(proposalId: string, reading: Omit<EngagementReading, "at">): void {
  readings.set(proposalId, { ...reading, at: Date.now() });
}

/** The remembered reading if it's at most `maxAgeMs` old. */
export function recallEngagement(proposalId: string, maxAgeMs: number): EngagementReading | null {
  const reading = readings.get(proposalId);
  return reading && Date.now() - reading.at <= maxAgeMs ? reading : null;
}

/** Forget a proposal's reading (after this instance changed its agreement or overrides). */
export function forgetEngagement(proposalId: string): void {
  readings.delete(proposalId);
}

/** Tests only. */
export function clearEngagementCache(): void {
  readings.clear();
}
