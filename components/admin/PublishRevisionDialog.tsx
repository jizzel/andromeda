"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import type { PublishedRevision } from "@/types/proposal";
import { MAX_REVISION_NOTE_CHARS } from "@/lib/proposal-schema";
import { isoDate } from "@/lib/dates";
import { AdminDialog, dialogButton } from "./AdminDialog";
import { DiffView } from "./DiffView";

/** Offers close to (or past) expiry get an extension suggested. */
const EXPIRY_WARNING_DAYS = 7;
const SUGGESTED_EXTENSION_DAYS = 14;

export interface PublishOptions {
  note: string;
  notifyClient: boolean;
  extendExpiryTo?: string;
  /** Already published: only (re)send the client email. */
  resendEmail?: boolean;
}

interface PublishRevisionDialogProps {
  open: boolean;
  onClose: () => void;
  onPublish: (options: PublishOptions) => void;
  submitting: boolean;
  error: string | null;
  /** What the diff compares against, e.g. "the version the client asked to change". */
  baseLabel: string;
  baseText: string;
  draftText: string;
  clientEmail?: string;
  expiryDate: string;
  /** Set when the draft's version is already published (nothing new to record). */
  published: PublishedRevision | null;
}

const daysUntil = (date: string) => (new Date(date).getTime() - Date.now()) / 86_400_000;
const addDays = (days: number) => isoDate(new Date(Date.now() + days * 86_400_000));
const formatDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Confirms a revision before it reaches the client: what changed, an
 * optional note for them, whether to email them, and the offer window.
 * Mounted fresh each time it opens (the editor keys it), so its fields start
 * from the current draft.
 */
export function PublishRevisionDialog({
  open,
  onClose,
  onPublish,
  submitting,
  error,
  baseLabel,
  baseText,
  draftText,
  clientEmail,
  expiryDate,
  published,
}: PublishRevisionDialogProps) {
  const remaining = daysUntil(expiryDate);
  // Same rule as the access check: the offer closes at the start of its expiry date (UTC).
  const expired = remaining <= 0;
  const [note, setNote] = useState(published?.note ?? "");
  const [notify, setNotify] = useState(!!clientEmail);
  const [extend, setExtend] = useState(remaining <= EXPIRY_WARNING_DAYS);
  const [extendTo, setExtendTo] = useState(addDays(SUGGESTED_EXTENSION_DAYS));
  const tooLong = note.length > MAX_REVISION_NOTE_CHARS;
  const extensionInvalid = extend && (!extendTo || daysUntil(extendTo) <= 0);
  // "publish": a new revision. "email": published, but the client hasn't been emailed. "done": nothing left to do.
  const mode = !published ? "publish" : published.email.status === "sent" ? "done" : "email";
  const offerValid = !extensionInvalid && (!expired || extend);
  const canSubmit = !submitting && (mode === "publish" ? !tooLong && offerValid : mode === "email" && notify && !!clientEmail && offerValid);
  const extension = extend ? { extendExpiryTo: extendTo } : {};

  const submit = () => {
    if (!canSubmit) return;
    if (mode === "email") onPublish({ note: published!.note, notifyClient: true, resendEmail: true, ...extension });
    else onPublish({ note: note.trim(), notifyClient: notify && !!clientEmail, ...extension });
  };

  return (
    <AdminDialog
      open={open}
      onClose={() => !submitting && onClose()}
      title={published ? "Revision already published" : "Publish revision"}
      description={
        published ? (
          <>
            These terms were published on {new Date(published.publishedAt).toLocaleString()}
            {published.email.status === "sent" ? ` and emailed to ${published.email.to}.` : "."}{" "}
            {published.email.status === "failed" && `The email didn't go out (${published.email.error ?? "unknown error"}). `}
            {published.email.status !== "sent" && "You can email the client now."} Edit the proposal to publish another revision.
          </>
        ) : (
          <>Saves your changes and shows the client a &ldquo;Revised&rdquo; notice on their proposal.</>
        )
      }
      actions={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={dialogButton.secondary}>
            {mode === "done" ? "Close" : "Cancel"}
          </button>
          {mode !== "done" && (
            <button type="button" onClick={submit} disabled={!canSubmit} className={dialogButton.primary}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {mode === "email" ? "Email client" : notify && clientEmail ? "Publish & email" : "Publish"}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {!published && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1.5">What changed</p>
            <p className="text-xs text-[var(--andromeda-text-secondary)] mb-1.5">
              Compared with {baseLabel}: <span className="text-[var(--andromeda-error)]">−</span> before,{" "}
              <span className="text-[var(--andromeda-success)]">+</span> now.
            </p>
            <DiffView before={baseText} after={draftText} className="max-h-48" empty="No changes to the terms." />
          </div>
        )}

        {!published && (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Note to the client (optional)</span>
            <textarea
              data-autofocus
              value={note}
              rows={4}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. We've lowered the Standard package to GH₵ 11,000 and split the deposit into two payments."
              aria-invalid={tooLong}
              className={`mt-1.5 w-full px-3 py-2 rounded-lg bg-[var(--andromeda-primary)] border text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 ${
                tooLong ? "border-[var(--andromeda-error)]/60" : "border-white/10 light:border-black/10"
              }`}
            />
            <span className={`block text-right text-xs ${tooLong ? "text-[var(--andromeda-error)]" : "text-[var(--andromeda-text-secondary)]"}`}>
              {note.length}/{MAX_REVISION_NOTE_CHARS}
            </span>
          </label>
        )}

        {mode !== "done" && (
        <label className={`flex items-start gap-2 ${clientEmail ? "" : "opacity-60"}`}>
          <input type="checkbox" checked={notify && !!clientEmail} disabled={!clientEmail} onChange={(e) => setNotify(e.target.checked)} className="mt-1" />
          <span>
            {clientEmail ? (
              <>
                Email <span className="font-mono">{clientEmail}</span> a link to the revised proposal
                {note.trim() ? " with your note" : ""}
              </>
            ) : (
              "No client email — add one in Settings to email the client"
            )}
          </span>
        </label>
        )}

        {mode !== "done" && (
          <div>
            <label className="flex items-start gap-2">
              <input type="checkbox" checked={extend} disabled={expired} onChange={(e) => setExtend(e.target.checked)} className="mt-1" />
              <span>
                Extend the offer to{" "}
                <input
                  type="date"
                  value={extendTo}
                  min={addDays(1)}
                  onChange={(e) => {
                    setExtendTo(e.target.value);
                    setExtend(true);
                  }}
                  aria-invalid={extensionInvalid}
                  className="px-2 py-0.5 rounded bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 text-sm"
                />
              </span>
            </label>
            <p className={`mt-1 ml-6 text-xs ${expired ? "text-[var(--andromeda-error)]" : remaining <= EXPIRY_WARNING_DAYS ? "text-amber-500" : "text-[var(--andromeda-text-secondary)]"}`}>
              {expired
                ? `The offer expired on ${formatDay(expiryDate)} — the client can't accept until it's extended.`
                : `The offer currently runs until ${formatDay(expiryDate)}.`}
            </p>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-[var(--andromeda-error)]">
            {error}
          </p>
        )}
      </div>
    </AdminDialog>
  );
}
