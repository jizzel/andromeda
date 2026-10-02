"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronRight, CopyPlus, Plus, Trash2, X } from "lucide-react";
import type { ProposalIssue } from "@/lib/proposal-schema";

/**
 * Form primitives for the admin editor. Every input carries `data-path` (the
 * same dotted path validation reports, e.g. `packages[1].totalPrice`), so the
 * issues list can find, reveal and focus the field an error points at.
 */

export const inputClass =
  "w-full px-2 py-1.5 rounded bg-[var(--andromeda-primary)] border text-sm focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/40 disabled:opacity-50";
const borderFor = (error?: string) => (error ? "border-[var(--andromeda-error)]/60" : "border-white/10 light:border-black/10");

/** Looks up errors by path: exact matches for fields, prefix counts for cards. */
export class IssueIndex {
  private readonly byPath = new Map<string, string>();
  constructor(private readonly issues: ProposalIssue[]) {
    for (const issue of issues) if (!this.byPath.has(issue.path)) this.byPath.set(issue.path, issue.message);
  }
  at(path: string): string | undefined {
    return this.byPath.get(path);
  }
  countUnder(prefix: string): number {
    return this.issues.filter((i) => i.path === prefix || i.path.startsWith(`${prefix}.`) || i.path.startsWith(`${prefix}[`)).length;
  }
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1.5">{label}</p>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-[var(--andromeda-error)]">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-[var(--andromeda-text-secondary)]">{hint}</p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  on,
  off,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  on: string;
  off: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm disabled:opacity-50"
    >
      <span className={`relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-[var(--andromeda-accent-beige)]" : "bg-white/15 light:bg-black/15"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-[var(--andromeda-primary)] transition-[left] ${checked ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {checked ? on : off}
    </button>
  );
}

interface TextProps {
  label: string;
  path: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  mono?: boolean;
}

export function TextField({ label, path, value, onChange, error, hint, placeholder, mono }: TextProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <input
        data-path={path}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${borderFor(error)} ${mono ? "font-mono" : ""}`}
      />
    </Field>
  );
}

export function TextArea({ label, path, value, onChange, error, hint, placeholder }: TextProps) {
  return (
    <Field label={label} error={error} hint={hint}>
      <textarea
        data-path={path}
        value={value}
        rows={3}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${borderFor(error)} resize-y`}
      />
    </Field>
  );
}

/** A string field whose blank value is stored as `null` (e.g. `premium`, milestone `amount`). */
export function NullableTextField({ value, onChange, ...rest }: Omit<TextProps, "value" | "onChange"> & { value: string | null; onChange: (value: string | null) => void }) {
  return <TextField {...rest} value={value ?? ""} onChange={(v) => onChange(v === "" ? null : v)} placeholder={rest.placeholder ?? "Not set"} />;
}

/** One input per entry; Enter adds a row below. */
export function StringListField({
  label,
  path,
  items,
  onChange,
  issues,
  addLabel = "Add line",
}: {
  label: string;
  path: string;
  items: string[];
  onChange: (items: string[]) => void;
  issues: IssueIndex;
  addLabel?: string;
}) {
  const listError = issues.at(path);
  const set = (index: number, value: string) => onChange(items.map((item, i) => (i === index ? value : item)));
  const insertAfter = (index: number) => {
    onChange([...items.slice(0, index + 1), "", ...items.slice(index + 1)]);
    // Focus the new row once it renders.
    setTimeout(() => document.querySelector<HTMLInputElement>(`[data-path="${path}[${index + 1}]"]`)?.focus(), 0);
  };
  return (
    <Field label={label} error={listError}>
      <div data-path={path} className="space-y-1.5">
        {items.map((item, index) => {
          const error = issues.at(`${path}[${index}]`);
          return (
            <div key={index} className="flex items-center gap-1">
              <input
                data-path={`${path}[${index}]`}
                value={item}
                aria-invalid={!!error}
                aria-label={`${label} ${index + 1}`}
                onChange={(e) => set(index, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertAfter(index);
                  }
                }}
                className={`${inputClass} ${borderFor(error)}`}
              />
              <MiniButton title="Move up" disabled={index === 0} onClick={() => onChange(move(items, index, -1))}>
                <ArrowUp className="w-3.5 h-3.5" />
              </MiniButton>
              <MiniButton title="Move down" disabled={index === items.length - 1} onClick={() => onChange(move(items, index, 1))}>
                <ArrowDown className="w-3.5 h-3.5" />
              </MiniButton>
              <MiniButton title="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))}>
                <X className="w-3.5 h-3.5" />
              </MiniButton>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => insertAfter(items.length - 1)}
          className="inline-flex items-center gap-1 text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
        >
          <Plus className="w-3.5 h-3.5" /> {addLabel}
        </button>
      </div>
    </Field>
  );
}

export function MiniButton({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="p-1 rounded text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)] hover:bg-white/5 light:hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

/** Dispatched on a card (`[data-card]`) to expand it, e.g. before focusing a field inside. */
export const REVEAL_CARD_EVENT = "andromeda:reveal-card";

/**
 * A collapsible card for one list item: a disclosure button for the title,
 * actions beside it, and a body that's `hidden` (still in the DOM, so the
 * issues list can find a field, reveal its card and focus it). A card with
 * errors inside stays open.
 */
export function ItemCard({
  title,
  summary,
  badge,
  errorCount,
  index,
  count,
  onMove,
  onDuplicate,
  onDelete,
  children,
}: {
  title: string;
  summary?: string;
  badge?: ReactNode;
  errorCount: number;
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyId = useId();
  const expanded = open || errorCount > 0;

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const reveal = () => setOpen(true);
    card.addEventListener(REVEAL_CARD_EVENT, reveal);
    return () => card.removeEventListener(REVEAL_CARD_EVENT, reveal);
  }, []);

  return (
    <div ref={cardRef} data-card className="rounded-lg border border-white/10 light:border-black/10 bg-[var(--andromeda-primary)]/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={bodyId}
          onClick={() => setOpen(!expanded)}
          className="flex flex-1 min-w-0 items-center gap-2 text-left"
        >
          <ChevronRight className={`w-4 h-4 shrink-0 transition-transform text-[var(--andromeda-text-secondary)] ${expanded ? "rotate-90" : ""}`} />
          <span className="min-w-0 flex-1">
            <span className="font-medium text-sm truncate block">{title || <em className="text-[var(--andromeda-text-secondary)]">Untitled</em>}</span>
            {summary && <span className="text-xs text-[var(--andromeda-text-secondary)] truncate block">{summary}</span>}
          </span>
        </button>
        {badge}
        {errorCount > 0 && (
          <span className="shrink-0 px-1.5 rounded-full text-[11px] leading-5 bg-[var(--andromeda-error)]/20 text-[var(--andromeda-error)]">
            {errorCount} {errorCount === 1 ? "error" : "errors"}
          </span>
        )}
        <span className="shrink-0 flex items-center">
          <MiniButton title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp className="w-3.5 h-3.5" />
          </MiniButton>
          <MiniButton title="Move down" disabled={index === count - 1} onClick={() => onMove(1)}>
            <ArrowDown className="w-3.5 h-3.5" />
          </MiniButton>
          {onDuplicate && (
            <MiniButton title="Duplicate" onClick={onDuplicate}>
              <CopyPlus className="w-3.5 h-3.5" />
            </MiniButton>
          )}
          <MiniButton title="Delete" onClick={onDelete}>
            <Trash2 className="w-3.5 h-3.5" />
          </MiniButton>
        </span>
      </div>
      <div id={bodyId} hidden={!expanded} className="px-3 pb-3 pt-1 space-y-3">
        {children}
      </div>
    </div>
  );
}

export function move<T>(items: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** First free `<prefix>-<n>` id. */
export function nextId(prefix: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  let n = 1;
  while (used.has(`${prefix}-${n}`)) n++;
  return `${prefix}-${n}`;
}

/**
 * Item ids are referenced by clients' recorded responses, so they're shown
 * read-only behind an "Edit id" disclosure rather than as an ordinary field.
 * Always editable when the id has an error (e.g. a duplicate).
 */
export function IdField({ path, value, onChange, error, warning }: { path: string; value: string; onChange: (value: string) => void; error?: string; warning?: string }) {
  const [editing, setEditing] = useState(false);
  if (!editing && !error) {
    return (
      <p className="text-xs text-[var(--andromeda-text-secondary)]">
        Id <code className="font-mono text-[var(--andromeda-text-primary)]">{value || "—"}</code>{" "}
        <button type="button" onClick={() => setEditing(true)} className="underline hover:text-[var(--andromeda-accent-beige)]">
          Edit id
        </button>
      </p>
    );
  }
  return (
    <TextField
      label="Id"
      path={path}
      value={value}
      onChange={onChange}
      error={error}
      mono
      hint={warning ?? "Used to record which option the client picked. Change only before anyone has responded."}
    />
  );
}
