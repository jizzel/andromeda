"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  computeEngagementGates,
  effectiveOverrides,
  gateExplanation,
  type EngagementOverride,
  type EngagementOverrides,
  type GateInputs,
} from "@/lib/engagement-gates";
import { Field } from "./forms/fields";

export interface EngagementStateInitial {
  /** The EngagementState row, or null when the proposal has none (legacy flags / auto apply). */
  overrides: EngagementOverrides | null;
  agreementExecuted: boolean;
}

interface EngagementSwitchesProps {
  proposalId: string;
  /** The editor's current data draft (config presence and legacy flags). */
  data: GateInputs;
  /** Null when the engagement state couldn't be read. */
  initial: EngagementStateInitial | null;
  disabled?: boolean;
  /** Once an override row exists the legacy JSON flags no longer count: drop them from the draft. */
  onLegacyFlagsSuperseded: () => void;
}

const OPTIONS: { value: EngagementOverride; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
];

/**
 * The client hub's Assets and Progress switches: Auto (open once the
 * agreement is signed), On or Off. Saved straight away to the EngagementState
 * tab — separately from the proposal JSON — with a live hint of the result.
 */
export function EngagementSwitches({ proposalId, data, initial, disabled, onLegacyFlagsSuperseded }: EngagementSwitchesProps) {
  const [row, setRow] = useState<EngagementOverrides | null>(initial?.overrides ?? null);
  const [saving, setSaving] = useState<"assets" | "tracker" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!initial) {
    return (
      <p role="alert" className="text-xs text-[var(--andromeda-error)]">
        Couldn&apos;t read the Assets / Progress switches. Reload to try again. Until then both tabs stay locked for the client.
      </p>
    );
  }

  const { overrides } = effectiveOverrides(data, row);
  const gates = computeEngagementGates(data, initial.agreementExecuted, row);

  const change = async (key: "assets" | "tracker", value: EngagementOverride) => {
    if (overrides[key] === value && row) return;
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}/engagement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const body = await res.json().catch(() => ({}));
      if (!body.success) {
        setError(body.error || "Couldn't save the switch.");
        return;
      }
      const hadLegacy = !row && (!!data.assetsReady || !!data.trackerReady);
      setRow(body.overrides as EngagementOverrides);
      if (hadLegacy) onLegacyFlagsSuperseded();
    } catch {
      setError("Connection failed. The switch wasn't saved.");
    } finally {
      setSaving(null);
    }
  };

  const control = (key: "assets" | "tracker", label: string, gate: typeof gates.assets) => (
    <Field label={label} hint={gateExplanation(gate)}>
      <div role="radiogroup" aria-label={label} className="inline-flex items-center rounded-lg border border-white/10 light:border-black/10 p-0.5">
        {OPTIONS.map((option) => {
          const active = overrides[key] === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled || saving !== null}
              onClick={() => void change(key, option.value)}
              className={`px-3 py-1 text-xs rounded-md transition-colors disabled:opacity-50 ${
                active ? "bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] font-semibold" : "text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
        {saving === key && <Loader2 className="w-3.5 h-3.5 mx-1.5 animate-spin text-[var(--andromeda-text-secondary)]" aria-label="Saving" />}
      </div>
    </Field>
  );

  return (
    <>
      {control("assets", "Asset checklist", gates.assets)}
      {control("tracker", "Project tracker", gates.progress)}
      {error && (
        <p role="alert" className="text-xs text-[var(--andromeda-error)]">
          {error}
        </p>
      )}
    </>
  );
}
