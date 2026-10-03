/**
 * Whether a client's Assets and Progress tabs are open — one rule, used by
 * the hub, its APIs, the weekly-update cron, milestone emails and the admin
 * dashboard (roadmap mid-term #2, PR B). Pure and client-safe.
 *
 * A tab is open when its config exists in the proposal (`assets` /
 * `tracker`) and either:
 * - its override is `on`, or
 * - its override is `auto` (the default) and the agreement is executed.
 * `off` always locks it. Overrides live in the `EngagementState` tab; a
 * proposal with no row there falls back to the legacy `assetsReady` /
 * `trackerReady` JSON flags (true = `on`) until it's migrated.
 */

export type EngagementOverride = "auto" | "on" | "off";

export interface EngagementOverrides {
  assets: EngagementOverride;
  tracker: EngagementOverride;
  /**
   * Switches whose sheet cell held an unrecognised, non-blank value (e.g. a
   * typo). They read as `off` and lock their tab with reason
   * `invalid_override` — never as `auto`, which could open a tab that was
   * meant to stay locked.
   */
  invalid?: ("assets" | "tracker")[];
}

export const ENGAGEMENT_OVERRIDES: readonly EngagementOverride[] = ["auto", "on", "off"];

export type GateReason =
  | "agreement_executed" // auto, and the agreement is signed by both parties
  | "override_on"
  | "legacy_flag" // no EngagementState row; the old JSON switch is on
  | "override_off"
  | "awaiting_agreement" // auto, agreement not executed yet
  | "invalid_override" // unrecognised value in the EngagementState tab — locked
  | "not_configured" // no checklist / tracker in the proposal
  | "unavailable"; // state couldn't be read — locked (fail closed)

export interface Gate {
  available: boolean;
  reason: GateReason;
}

export interface EngagementGates {
  assets: Gate;
  progress: Gate;
}

/** Both tabs locked: used when the state behind them can't be read. */
export const LOCKED_GATES: EngagementGates = {
  assets: { available: false, reason: "unavailable" },
  progress: { available: false, reason: "unavailable" },
};

/** The parts of a proposal's data the gates look at (any layout). */
export interface GateInputs {
  assets?: unknown;
  tracker?: unknown;
  assetsReady?: boolean;
  trackerReady?: boolean;
}

/**
 * The overrides in force: the EngagementState row when there is one
 * (it always wins), else the legacy JSON flags (true = on), else auto.
 */
export function effectiveOverrides(data: GateInputs, row: EngagementOverrides | null): { overrides: EngagementOverrides; legacy: { assets: boolean; tracker: boolean } } {
  if (row) return { overrides: row, legacy: { assets: false, tracker: false } };
  const legacy = { assets: !!data.assetsReady, tracker: !!data.trackerReady };
  return { overrides: { assets: legacy.assets ? "on" : "auto", tracker: legacy.tracker ? "on" : "auto" }, legacy };
}

function gate(configured: boolean, override: EngagementOverride, legacy: boolean, agreementExecuted: boolean, invalid: boolean): Gate {
  if (!configured) return { available: false, reason: "not_configured" };
  if (invalid) return { available: false, reason: "invalid_override" };
  if (override === "off") return { available: false, reason: "override_off" };
  if (override === "on") return { available: true, reason: legacy ? "legacy_flag" : "override_on" };
  return agreementExecuted ? { available: true, reason: "agreement_executed" } : { available: false, reason: "awaiting_agreement" };
}

export function computeEngagementGates(data: GateInputs, agreementExecuted: boolean, row: EngagementOverrides | null): EngagementGates {
  const { overrides, legacy } = effectiveOverrides(data, row);
  return {
    assets: gate(!!data.assets, overrides.assets, legacy.assets, agreementExecuted, !!overrides.invalid?.includes("assets")),
    progress: gate(!!data.tracker, overrides.tracker, legacy.tracker, agreementExecuted, !!overrides.invalid?.includes("tracker")),
  };
}

/** Short admin-facing explanation of a gate. */
export function gateExplanation(g: Gate): string {
  switch (g.reason) {
    case "agreement_executed":
      return "Open — the agreement is signed";
    case "override_on":
      return "Open — switched on manually";
    case "legacy_flag":
      return "Open — switched on (older setting)";
    case "override_off":
      return "Locked — switched off manually";
    case "awaiting_agreement":
      return "Locked until the agreement is signed";
    case "invalid_override":
      return "Locked — unrecognised value in the EngagementState tab (choose a setting to fix it)";
    case "not_configured":
      return "Not set up in this proposal";
    case "unavailable":
      return "Locked — couldn't read its state";
  }
}
