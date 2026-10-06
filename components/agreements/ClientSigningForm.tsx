"use client";

import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Download, Loader2, MessageSquare, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { MAX_AGREEMENT_CHANGE_NOTE } from "@/constants/agreement";
import { downloadAgreementPdf } from "./download-agreement-pdf";

interface ClientSigningFormProps {
  proposalId: string;
  agreementHash: string;
  /** The client named in the proposal — the default "signing for" organisation. */
  clientName: string;
  /** The template's acceptance declaration (§29.3), verbatim markdown. */
  declaration: string;
  /** The verified address the signer's code went to. */
  signerEmail: string;
  /** Formatted "open until" date. */
  openUntil: string;
}

const fieldClass =
  "w-full px-3 py-2.5 rounded-lg bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 text-[var(--andromeda-text-primary)] placeholder:text-[var(--andromeda-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 focus:border-transparent";
const labelClass = "block text-sm font-medium text-[var(--andromeda-text-primary)] mb-1.5";

/** `**bold**` → <strong>; everything else is text. */
function inline(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-[var(--andromeda-text-primary)]">{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
  );
}

/** The declaration's lead-in paragraph and its numbered list. */
function Declaration({ text }: { text: string }) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items = lines.filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s+/, ""));
  const lead = lines.filter((l) => !/^\d+\.\s/.test(l));
  return (
    <div className="text-sm leading-relaxed text-[var(--andromeda-text-secondary)]">
      {lead.map((l, i) => (
        <p key={i} className="mb-2">
          {inline(l)}
        </p>
      ))}
      {items.length > 0 && (
        <ol className="ml-5 list-decimal space-y-1">
          {items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

/**
 * The client's side of signing (§29.3): who signs and in what capacity, the
 * template's declaration verbatim, and "Accept and Sign Agreement". Also
 * offers "Request changes", which emails Joseph and leaves the agreement open.
 */
export function ClientSigningForm({ proposalId, agreementHash, clientName, declaration, signerEmail, openUntil }: ClientSigningFormProps) {
  const router = useRouter();
  const analytics = useAnalytics();
  const hashShort = agreementHash.slice(0, 12);
  const [legalName, setLegalName] = useState("");
  const [forOrganisation, setForOrganisation] = useState(true);
  const [organisation, setOrganisation] = useState(clientName);
  const [capacity, setCapacity] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [state, setState] = useState<"form" | "signing" | "signed">("form");
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [changesOpen, setChangesOpen] = useState(false);
  const [note, setNote] = useState("");
  const [changes, setChanges] = useState<"idle" | "sending" | "sent">("idle");
  const [changesError, setChangesError] = useState<string | null>(null);

  useEffect(() => {
    analytics.trackAgreementViewed({ proposal_id: proposalId, agreement_hash_short: hashShort });
    // Once per agreement version shown; the tracker functions aren't stable identities.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposalId, hashShort]);

  const canSign = legalName.trim().length >= 2 && agreed && (!forOrganisation || (organisation.trim() && capacity.trim()));

  const sign = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSign) return;
    setState("signing");
    setError(null);
    try {
      const response = await fetch("/api/proposal/agreement/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          agreementHash,
          legalName,
          organisation: forOrganisation ? organisation : "",
          capacity: forOrganisation ? capacity : "",
          declaration: true,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!response.ok) {
        setState("form");
        setError(data.error ?? "Couldn't record your signature. Try again.");
        // Session expired or access revoked: back to the access-code step.
        if (data.code === "signed_out") router.refresh();
        return;
      }
      analytics.trackAgreementSigned({ proposal_id: proposalId, agreement_hash_short: hashShort, for_organisation: forOrganisation });
      setState("signed");
    } catch {
      setState("form");
      // The request may have reached the server: say so, and let a retry settle it
      // (a retry by the same verified signer is safe and returns the signed state).
      setError("We couldn't confirm whether your signature went through. Please try again. If it did, you'll see it as signed.");
    }
  };

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const failure = await downloadAgreementPdf(proposalId);
      if (failure) setDownloadError(failure);
      else analytics.trackAgreementPdfDownloaded({ proposal_id: proposalId, agreement_hash_short: hashShort, via: "session" });
    } finally {
      setDownloading(false);
    }
  };

  const requestChanges = async (event: FormEvent) => {
    event.preventDefault();
    setChanges("sending");
    setChangesError(null);
    try {
      const response = await fetch("/api/proposal/agreement/changes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, note }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; code?: string };
      if (!response.ok) {
        setChanges("idle");
        setChangesError(data.error ?? "Couldn't send your request. Try again.");
        if (data.code === "signed_out") router.refresh();
        return;
      }
      analytics.trackAgreementChangesRequested({ proposal_id: proposalId, agreement_hash_short: hashShort });
      setChanges("sent");
    } catch {
      setChanges("idle");
      setChangesError("Couldn't reach the server. Try again.");
    }
  };

  if (state === "signed") {
    return (
      <section aria-live="polite" className="p-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-[var(--andromeda-text-primary)]">Agreement signed. Thank you</h2>
            <p className="mt-1 text-sm text-[var(--andromeda-text-secondary)]">
              The agreement is now signed by both parties. We&apos;re emailing the executed copy to {signerEmail}, and onboarding opens on your
              proposal page.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={download} disabled={downloading} className="bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90">
                {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Download signed PDF
              </Button>
              <Button variant="outline" onClick={() => router.push(`/proposal/${encodeURIComponent(proposalId)}`)}>
                Back to the proposal
              </Button>
            </div>
            {downloadError && <p className="mt-2 text-sm text-red-400">{downloadError}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Sign the agreement" className="p-5 sm:p-6 rounded-xl border border-[var(--andromeda-accent-beige)]/30 bg-[var(--andromeda-secondary)]">
      <h2 className="text-lg font-semibold text-[var(--andromeda-text-primary)] flex items-center gap-2">
        <PenLine className="w-5 h-5 text-[var(--andromeda-accent-beige)]" /> Accept and sign
      </h2>
      <p className="mt-1 text-sm text-[var(--andromeda-text-secondary)]">
        Verified as {signerEmail}. Open for signing until {openUntil}.
      </p>

      <form onSubmit={sign} className="mt-5 space-y-4">
        <div>
          <label htmlFor="legalName" className={labelClass}>
            Your full legal name
          </label>
          <input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} className={fieldClass} autoComplete="name" maxLength={200} required />
        </div>

        <fieldset>
          <legend className={labelClass}>Signing</legend>
          <div className="flex flex-wrap gap-4 text-sm text-[var(--andromeda-text-secondary)]">
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="signingAs" checked={forOrganisation} onChange={() => setForOrganisation(true)} className="accent-[var(--andromeda-accent-beige)]" />
              On behalf of an organisation
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="signingAs" checked={!forOrganisation} onChange={() => setForOrganisation(false)} className="accent-[var(--andromeda-accent-beige)]" />
              As an individual
            </label>
          </div>
        </fieldset>

        {forOrganisation && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="organisation" className={labelClass}>
                Organisation
              </label>
              <input id="organisation" value={organisation} onChange={(e) => setOrganisation(e.target.value)} className={fieldClass} autoComplete="organization" maxLength={200} required />
            </div>
            <div>
              <label htmlFor="capacity" className={labelClass}>
                Your role
              </label>
              <input id="capacity" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g. Director" className={fieldClass} autoComplete="organization-title" maxLength={200} required />
            </div>
          </div>
        )}

        <div className="p-4 rounded-lg border border-white/10 light:border-black/10 bg-[var(--andromeda-primary)]">
          <Declaration text={declaration} />
          <label className="mt-4 flex items-start gap-3 text-sm text-[var(--andromeda-text-primary)]">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[var(--andromeda-accent-beige)]" />
            I confirm each of the statements above.
          </label>
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {error}{" "}
              {error.includes("Reload") && (
                <button type="button" onClick={() => router.refresh()} className="underline">
                  Reload
                </button>
              )}
            </span>
          </div>
        )}

        <Button
          type="submit"
          disabled={!canSign || state === "signing"}
          className="w-full bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "signing" ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing…
            </>
          ) : (
            "Accept and Sign Agreement"
          )}
        </Button>
        <p className="text-xs text-[var(--andromeda-text-secondary)]">
          Typing your name and selecting &ldquo;Accept and Sign Agreement&rdquo; is your electronic signature. We record your name, the
          document versions, the time, and how your email was verified.
        </p>
      </form>

      <div className="mt-6 pt-5 border-t border-white/10 light:border-black/10">
        {changes === "sent" ? (
          <p role="status" className="text-sm text-[var(--andromeda-text-secondary)] flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
            Thanks, your request has been sent. We&apos;ll be in touch, and you&apos;ll get an email when a revised agreement is ready.
          </p>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={changesOpen}
              aria-controls="agreement-changes"
              onClick={() => setChangesOpen(!changesOpen)}
              className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
            >
              <MessageSquare className="w-4 h-4" /> Something needs changing? Request changes instead
            </button>
            <form id="agreement-changes" hidden={!changesOpen} onSubmit={requestChanges} className="mt-3 space-y-3">
              <label htmlFor="changeNote" className={labelClass}>
                What would you like changed?
              </label>
              <textarea
                id="changeNote"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={MAX_AGREEMENT_CHANGE_NOTE}
                className={fieldClass}
              />
              {changesError && <p className="text-sm text-red-400">{changesError}</p>}
              <Button type="submit" variant="outline" disabled={!note.trim() || changes === "sending"}>
                {changes === "sending" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send request
              </Button>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
