"use client";

import type { ReactNode } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import type { ProposalAcceptance } from "@/types/proposal";
import type { IssueIndex } from "./fields";

/** Edits the parsed draft in place; the editor re-serialises it into the JSON text. */
export type Mutate = (data: Record<string, unknown>) => void;

export interface DeleteRequest {
  /** What's being deleted, e.g. `package "Standard"`. */
  label: string;
  /** Set when the client's recorded response picked this item. */
  clientChoice?: string;
  confirm: () => void;
}

export interface SectionProps {
  data: Record<string, unknown>;
  issues: IssueIndex;
  onChange: (mutate: Mutate) => void;
  acceptance: ProposalAcceptance | null;
  requestDelete: (request: DeleteRequest) => void;
}

/** A recorded response that still matters to the terms (accepted, or an open change request). */
export function recordedResponse(acceptance: ProposalAcceptance | null) {
  return acceptance && (acceptance.status === "accepted" || acceptance.status === "counter") ? acceptance : null;
}

/** Returns the array at `data[key]`, creating it if missing, for in-place edits. */
export function listAt<T>(data: Record<string, unknown>, key: string): T[] {
  if (!Array.isArray(data[key])) data[key] = [];
  return data[key] as T[];
}

export function Section({
  title,
  description,
  path,
  error,
  warning,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  path: string;
  error?: string;
  warning?: ReactNode;
  addLabel: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section data-path={path} className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-xs text-[var(--andromeda-text-secondary)]">{description}</p>
      </div>
      {error && (
        <p role="alert" className="text-xs text-[var(--andromeda-error)]">
          {error}
        </p>
      )}
      {warning && (
        <p className="flex items-start gap-2 text-xs p-2 rounded bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
          <span>{warning}</span>
        </p>
      )}
      <div className="space-y-2">{children}</div>
      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-dashed border-white/20 light:border-black/20 hover:border-[var(--andromeda-accent-beige)]/60 hover:text-[var(--andromeda-accent-beige)]"
      >
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </section>
  );
}

export function ChoiceBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 px-1.5 rounded-full text-[11px] leading-5 bg-[var(--andromeda-accent-beige)]/15 text-[var(--andromeda-accent-beige)]">
      {children}
    </span>
  );
}
