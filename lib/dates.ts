/**
 * Date utilities used across the app. All `Date` math lives here so when we
 * eventually migrate to Temporal (https://tc39.es/proposal-temporal/), the
 * change is contained to this file. Until then: keep arithmetic UTC-anchored
 * and avoid mutating Dates in place.
 */

/** Long human format, e.g. "May 22, 2026". Used in the tracker UI and proposal pages. */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Short human format, e.g. "22 May". Used in compact contexts like emails.
 *
 * Anchored to UTC: this helper is called from server-side code (cron, emails)
 * whose output should not depend on the host machine's timezone. Vercel
 * currently runs serverless functions in UTC, but that's not contractually
 * guaranteed — explicit `timeZone: "UTC"` makes the contract local to this
 * function. For client-side display, see `formatDate` which respects the
 * viewer's local timezone.
 */
export function friendlyDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** YYYY-MM-DD in UTC. Stable key for Sheet rows that need a day identifier. */
export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Snap a date to the most recent Friday 16:30 UTC. Used by the weekly-update
 * cron so the data window, displayed date, and idempotency key stay anchored
 * to the *intended* report time regardless of when the route actually runs
 * (Vercel retries, manual replay, etc.).
 *
 * If the input is Friday before 16:30 UTC, this still snaps to that same
 * Friday at 16:30 UTC. The window will then look slightly into the future,
 * which is harmless — `completedAt` filtering uses a `<=` comparison.
 */
export function mostRecentFridayAt1630Utc(from: Date): Date {
  // UTC days: 0=Sun, 1=Mon, …, 5=Fri, 6=Sat.
  // Days since most recent Friday: Fri→0, Sat→1, Sun→2, Mon→3, …, Thu→6.
  const daysSinceFriday = (from.getUTCDay() + 2) % 7;
  const snapped = new Date(from.getTime() - daysSinceFriday * 24 * 60 * 60 * 1000);
  snapped.setUTCHours(16, 30, 0, 0);
  return snapped;
}

/** Returns a Date `days` days before `from`. Non-mutating. */
export function daysBefore(from: Date, days: number): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}
