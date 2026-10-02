"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, Loader2 } from "lucide-react";
import { proposalIdProblem, PROPOSAL_ID_HINT } from "@/lib/proposal-id";
import { AdminDialog, dialogButton } from "./AdminDialog";

interface DuplicateButtonProps {
  proposalId: string;
  /** Ids already on the sheet, for an instant "taken" check (the server re-checks). */
  existingIds: string[];
}

/** Starts a new Draft proposal from this one (new id + access code, 30-day offer). */
export function DuplicateButton({ proposalId, existingIds }: DuplicateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const problem = proposalIdProblem(newId, existingIds);
  const showProblem = touched && !!problem;

  const openDialog = () => {
    // Suggest the first free "<id>-copy[-n]".
    let suggestion = `${proposalId}-copy`;
    for (let n = 2; existingIds.includes(suggestion); n++) suggestion = `${proposalId}-copy-${n}`;
    setNewId(suggestion);
    setTouched(false);
    setServerError(null);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (problem || submitting) return;
    setSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newId }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) {
        setOpen(false);
        router.push(`/admin/proposals/${encodeURIComponent(body.id)}`);
        return;
      }
      setServerError(body.error || "Couldn't duplicate the proposal.");
    } catch {
      setServerError("Connection failed — try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10"
      >
        <CopyPlus className="w-3.5 h-3.5" />
        Duplicate
      </button>

      <AdminDialog
        open={open}
        onClose={() => !submitting && setOpen(false)}
        title="Duplicate proposal"
        description={
          <>
            Copies the content of <code className="font-mono text-[var(--andromeda-text-primary)]">{proposalId}</code> into a
            new proposal.
          </>
        }
      >
        <form onSubmit={submit} noValidate>
          <label htmlFor={`dup-${proposalId}`} className="block text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1.5">
            New proposal id
          </label>
          <input
            id={`dup-${proposalId}`}
            value={newId}
            onChange={(e) => {
              setNewId(e.target.value.trim());
              setTouched(true);
              setServerError(null);
            }}
            data-autofocus
            spellCheck={false}
            autoComplete="off"
            aria-invalid={showProblem || !!serverError}
            aria-describedby={`dup-${proposalId}-hint`}
            className={`w-full px-3 py-2 rounded-lg font-mono text-sm bg-[var(--andromeda-primary)] border focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 ${
              showProblem || serverError ? "border-[var(--andromeda-error)]/60" : "border-white/10 light:border-black/10"
            }`}
          />
          <p
            id={`dup-${proposalId}-hint`}
            role={showProblem || serverError ? "alert" : undefined}
            className={`mt-1.5 text-xs ${showProblem || serverError ? "text-[var(--andromeda-error)]" : "text-[var(--andromeda-text-secondary)]"}`}
          >
            {serverError ?? (showProblem ? problem : `Client link: /proposal/${newId || "…"} — ${PROPOSAL_ID_HINT}.`)}
          </p>

          <ul className="mt-4 space-y-1 text-sm text-[var(--andromeda-text-secondary)] list-disc pl-5">
            <li>Starts as a <span className="text-[var(--andromeda-text-primary)]">Draft</span>, hidden from clients until you activate it</li>
            <li>Gets a new access code and a 30-day offer window</li>
            <li>Asset checklist and tracker start locked</li>
          </ul>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setOpen(false)} disabled={submitting} className={dialogButton.secondary}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || (touched && !!problem)} className={dialogButton.primary}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create draft
            </button>
          </div>
        </form>
      </AdminDialog>
    </>
  );
}
