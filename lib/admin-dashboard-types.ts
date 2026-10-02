import type { ProposalAcceptance, RevisionEmailStatus } from "@/types/proposal";
import type { AgreementStatus } from "@/types/agreement";

/**
 * Dashboard row types and the UNAVAILABLE marker, kept free of server imports
 * so the client table (`components/admin/DashboardTable.tsx`) can use them
 * without pulling the Google Sheets client into the browser bundle.
 */

export const UNAVAILABLE = "unavailable" as const;
export type Source<T> = T | typeof UNAVAILABLE;

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
  /** The open change request (status `counter`), if any. */
  changeRequest: ChangeRequest | null;
  /** Required asset items checked; null when the proposal has no asset request. */
  assets: (ProgressCount & { unlocked: boolean }) | null | typeof UNAVAILABLE;
  /** Tracker milestones done; null when no tracker is configured. */
  tracker: (ProgressCount & { unlocked: boolean }) | null | typeof UNAVAILABLE;
  /** ISO timestamp used for ordering (latest response, tracker update, or issue date). */
  lastActivity: string;
  /** The agreement's state once accepted: null when none is prepared, `UNAVAILABLE` when unreadable. */
  agreement: { status: AgreementStatus; signedAt?: string } | null | typeof UNAVAILABLE;
}

export interface ChangeRequest {
  note: string;
  /** When the client sent (or last updated) the request. */
  at: string;
  /** Names of the options they picked as context, resolved from the current proposal. */
  packageName?: string;
  planName?: string;
  /** Version the request was made against; absent on pre-versioning rows. */
  version?: string;
  /** True once the proposal has been revised since the request (versions differ). */
  revised: boolean;
  /**
   * Whether the current version was published as a revision (admin "Publish
   * revision") and how its email went. Only meaningful when `revised`; null
   * when saved but not published, `UNAVAILABLE` when the log can't be read.
   */
  publication: { at: string; email: RevisionEmailStatus; emailTo?: string } | null | typeof UNAVAILABLE;
}

