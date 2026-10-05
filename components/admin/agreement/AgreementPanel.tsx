"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Download, Loader2, Mail, MessageSquare, PenLine, Plus, Save, Send, X } from "lucide-react";
import { isProviderSigned, type AgreementActivity, type AgreementRecord, type SpecialTerm } from "@/types/agreement";
import type { TemplateSummary } from "@/lib/agreement-templates";
import { followUpIncomplete } from "@/lib/agreement-activity";
import { MAX_SPECIAL_TERM_CHARS, MAX_SPECIAL_TERMS, providerSigningDeclaration } from "@/constants/agreement";
import { shortVersion } from "@/lib/proposal-version-label";
import { AdminDialog, dialogButton } from "../AdminDialog";
import { Field, inputClass } from "../forms/fields";

interface AgreementPanelProps {
  proposalId: string;
  record: AgreementRecord | null;
  templates: TemplateSummary[];
  /** The terms that go with the accepted package (`PACKAGE_TEMPLATES`), else the General Service Agreement. */
  suggestedTemplateId: string;
  /** The pinned template file no longer matches its stored hash (the file was edited). */
  templateChanged: boolean;
  providerName: string;
  providerRole: string;
  /** Organisations an agreement can name after Joseph's role. */
  organisations: readonly string[];
  defaultOfferValidUntil: string;
  /** Sends, change requests, executed-copy emails and onboarding for the current agreement; null if unreadable. */
  activity: AgreementActivity | null;
  /** The saved proposal's `client.email` — where the signing link goes. */
  clientEmail: string | null;
  /** Null when client signing is enabled; otherwise why it's off (shown instead of "Send"). */
  clientSigningOff: string | null;
}

type Draft = { templateId: string; templateVersion: number; organisation: string; offerValidUntil: string; specialTerms: SpecialTerm[] };

const draftOf = (record: AgreementRecord | null, fallback: Draft): Draft =>
  record
    ? { templateId: record.templateId, templateVersion: record.templateVersion, organisation: record.provider.organisation ?? "", offerValidUntil: record.offerValidUntil, specialTerms: record.specialTerms }
    : fallback;

const borderClass = "border-white/10 light:border-black/10";

/**
 * Prepare and sign the agreement. Edits are saved as a draft (the preview on
 * the right renders the saved draft); signing pins exactly what's previewed.
 * Saving a change to a signed (or sent) agreement voids the signature — and
 * withdraws the client's link — after a confirm. Once signed, the agreement is
 * sent to the client from here; once the client signs, it's read-only.
 */
export function AgreementPanel({
  proposalId,
  record,
  templates,
  suggestedTemplateId,
  templateChanged,
  providerName,
  providerRole,
  organisations,
  defaultOfferValidUntil,
  activity,
  clientEmail,
  clientSigningOff,
}: AgreementPanelProps) {
  const router = useRouter();
  const latestOf = (id: string) => Math.max(0, ...templates.filter((t) => t.id === id).map((t) => t.version));
  const initial = draftOf(record, {
    templateId: suggestedTemplateId,
    templateVersion: latestOf(suggestedTemplateId),
    organisation: "",
    offerValidUntil: defaultOfferValidUntil,
    specialTerms: [],
  });
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const signed = !!record && isProviderSigned(record.status);
  // What the saved agreement's terms call Joseph ("Service Provider", "Developer"): signing applies to the saved record.
  const providerParty = templates.find((t) => t.id === record?.templateId && t.version === record?.templateVersion)?.parties.provider ?? "Service Provider";
  const executed = record?.status === "executed";
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const clauses = templates.find((t) => t.id === draft.templateId && t.version === draft.templateVersion)?.clauses ?? [];
  const clauseOptions = clauses;
  const topLevel = (number: string) => clauses.find((c) => c.number === number.split(".")[0])?.title;

  const save = async (voidSignature = false) => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}/agreement`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, expectedUpdatedAt: record?.updatedAt ?? null, voidSignature }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) {
        setConfirmVoid(false);
        router.refresh();
      } else if (body.code === "signed") {
        setConfirmVoid(true);
      } else if (body.code === "executed") {
        setErrors([body.error]);
        router.refresh();
      } else if (body.code === "conflict") {
        setErrors(["The agreement changed in another tab or session. Reload the page to see the latest before saving."]);
      } else {
        setErrors(body.errors ?? [body.error || "Couldn't save the agreement."]);
      }
    } catch {
      setErrors(["Connection failed — nothing was saved. Try again."]);
    } finally {
      setSaving(false);
    }
  };

  const setTerm = (index: number, patch: Partial<SpecialTerm>) =>
    setDraft((d) => ({ ...d, specialTerms: d.specialTerms.map((t, i) => (i === index ? { ...t, ...patch } : t)) }));
  const moveTerm = (index: number, delta: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.specialTerms];
      const target = index + delta;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, specialTerms: next };
    });

  return (
    <div className="space-y-4 lg:sticky lg:top-6">
      <StatusCard record={record} templateChanged={templateChanged} />

      {record && signed && (
        <ClientCard proposalId={proposalId} record={record} activity={activity} clientEmail={clientEmail} clientSigningOff={clientSigningOff} />
      )}

      {/* An executed agreement is a formed contract: nothing here can change it. */}
      <fieldset disabled={executed} className="space-y-4 min-w-0 disabled:opacity-60">
      <section className={`p-4 rounded-xl border ${borderClass} bg-[var(--andromeda-secondary)] space-y-4`}>
        <Field label="Terms">
          <select
            value={`${draft.templateId}@${draft.templateVersion}`}
            onChange={(e) => {
              const [templateId, version] = e.target.value.split("@");
              setDraft({ ...draft, templateId, templateVersion: Number(version) });
            }}
            className={`${inputClass} ${borderClass}`}
          >
            {templates.map((t) => (
              <option key={`${t.id}@${t.version}`} value={`${t.id}@${t.version}`}>
                {t.title} v{t.version}
                {t.status === "draft" ? " — draft, pending legal review" : ""}
              </option>
            ))}
          </select>
          {draft.templateId !== suggestedTemplateId && (
            <p className="mt-1 text-xs text-amber-500">
              The client accepted a package that goes with different terms (
              {templates.find((t) => t.id === suggestedTemplateId)?.title ?? suggestedTemplateId}).
            </p>
          )}
        </Field>

        <Field label="Your organisation" hint="Shown after your role on the agreement. You're the party either way.">
          <select
            value={draft.organisation}
            onChange={(e) => setDraft({ ...draft, organisation: e.target.value })}
            className={`${inputClass} ${borderClass}`}
          >
            <option value="">None — {providerName}, {providerRole}</option>
            {organisations.map((name) => (
              <option key={name} value={name}>
                {providerName}, {providerRole}, {name}
              </option>
            ))}
          </select>
          {record?.provider.contractAs === "trading" && record.provider.tradingName && !draft.organisation && (
            <p className="mt-1 text-xs text-amber-500">This agreement was prepared &ldquo;trading as {record.provider.tradingName}&rdquo;; saving replaces that.</p>
          )}
        </Field>

        <Field label="Offer open until" hint="How long the client has to sign once you've signed.">
          <input
            type="date"
            value={draft.offerValidUntil}
            onChange={(e) => setDraft({ ...draft, offerValidUntil: e.target.value })}
            className={`${inputClass} ${borderClass} w-auto`}
          />
        </Field>
      </section>

      <section className={`p-4 rounded-xl border ${borderClass} bg-[var(--andromeda-secondary)] space-y-3`}>
        <div>
          <h2 className="text-sm font-semibold">Special terms (Schedule 1)</h2>
          <p className="text-xs text-[var(--andromeda-text-secondary)]">Vary a named clause for this engagement only; the base terms stay as written.</p>
        </div>
        {draft.specialTerms.map((term, index) => (
          <div key={term.id || index} className={`p-3 rounded-lg border ${borderClass} bg-[var(--andromeda-primary)]/40 space-y-2`}>
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold">S{index + 1}. Varies</span>
              <select
                aria-label={`Special term ${index + 1} clause`}
                value={term.clause}
                onChange={(e) => setTerm(index, { clause: e.target.value })}
                className={`${inputClass} ${borderClass} flex-1 min-w-0`}
              >
                <option value="">Choose a clause…</option>
                {clauseOptions.map((c) => (
                  <option key={c.number} value={c.number}>
                    {c.number.includes(".") ? `  ${c.number} ${c.excerpt ?? ""}` : `${c.number}. ${c.title}`}
                  </option>
                ))}
              </select>
              <MiniIcon title="Move up" disabled={index === 0} onClick={() => moveTerm(index, -1)}>
                <ArrowUp className="w-3.5 h-3.5" />
              </MiniIcon>
              <MiniIcon title="Move down" disabled={index === draft.specialTerms.length - 1} onClick={() => moveTerm(index, 1)}>
                <ArrowDown className="w-3.5 h-3.5" />
              </MiniIcon>
              <MiniIcon title="Remove" onClick={() => setDraft({ ...draft, specialTerms: draft.specialTerms.filter((_, i) => i !== index) })}>
                <X className="w-3.5 h-3.5" />
              </MiniIcon>
            </div>
            {term.clause && <p className="text-xs text-[var(--andromeda-text-secondary)]">Clause {term.clause.split(".")[0]}: {topLevel(term.clause)}</p>}
            <textarea
              aria-label={`Special term ${index + 1} text`}
              value={term.text}
              rows={3}
              maxLength={MAX_SPECIAL_TERM_CHARS}
              placeholder="e.g. The deposit in 6.1 is payable in two equal instalments, 14 days apart."
              onChange={(e) => setTerm(index, { text: e.target.value })}
              className={`${inputClass} ${borderClass} resize-y`}
            />
          </div>
        ))}
        <button
          type="button"
          disabled={draft.specialTerms.length >= MAX_SPECIAL_TERMS}
          onClick={() => setDraft({ ...draft, specialTerms: [...draft.specialTerms, { id: "", clause: "", text: "" }] })}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-dashed border-white/20 light:border-black/20 hover:border-[var(--andromeda-accent-beige)]/60 hover:text-[var(--andromeda-accent-beige)] disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5" /> Add special term
        </button>
      </section>
      </fieldset>

      {errors.length > 0 && (
        <ul role="alert" className="p-3 rounded-lg border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm text-[var(--andromeda-error)] space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={executed || saving || (!dirty && !!record && !templateChanged)} className={dialogButton.primary}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {record ? "Save draft" : "Prepare agreement"}
        </button>
        <button
          type="button"
          onClick={() => setSignOpen(true)}
          disabled={!record || signed || dirty || templateChanged || saving}
          title={dirty ? "Save your changes first — you sign what the preview shows" : signed ? "Already signed" : undefined}
          className={`${dialogButton.secondary} inline-flex items-center gap-2 disabled:opacity-40`}
        >
          <PenLine className="w-4 h-4" /> Sign as {providerParty === "Service Provider" ? "Service Provider" : `the ${providerParty}`}
        </button>
      </div>

      <AdminDialog
        open={confirmVoid}
        onClose={() => setConfirmVoid(false)}
        title="This voids your signature"
        description={
          record?.status === "sent"
            ? "You've signed this agreement and sent it to the client. Saving these changes cancels your signature and withdraws the client's signing link; you'll need to review, sign and send the changed agreement again."
            : "You've signed this agreement. Saving these changes cancels that signature; you'll need to review and sign the changed agreement again."
        }
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setConfirmVoid(false)} className={dialogButton.secondary}>
              Keep it signed
            </button>
            <button type="button" onClick={() => void save(true)} disabled={saving} className={dialogButton.danger}>
              Save and void signature
            </button>
          </>
        }
      />

      {signOpen && record && <SignDialog proposalId={proposalId} record={record} providerName={providerName} providerParty={providerParty} onClose={() => setSignOpen(false)} onSigned={() => router.refresh()} />}
    </div>
  );
}

function StatusCard({ record, templateChanged }: { record: AgreementRecord | null; templateChanged: boolean }) {
  if (!record) {
    return <p className={`p-4 rounded-xl border ${borderClass} text-sm`}>No agreement yet. Choose the terms and any special terms, then prepare it.</p>;
  }
  const signature = record.providerSignature;
  const client = record.clientSignature;
  return (
    <div className={`p-4 rounded-xl border text-sm ${signature ? "border-[var(--andromeda-success)]/40 bg-[var(--andromeda-success)]/5" : `${borderClass}`}`}>
      {client ? (
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-success)]" />
          <span>
            <strong>Executed.</strong> Signed by both parties — the client on {new Date(client.signedAt).toLocaleString()} · agreement{" "}
            <span className="font-mono">{shortVersion(record.agreementHash)}</span>.
          </span>
        </p>
      ) : signature ? (
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-success)]" />
          <span>
            Signed by you on {new Date(signature.signedAt).toLocaleString()} · agreement <span className="font-mono">{shortVersion(signature.agreementHash)}</span>.
            {record.status === "sent" ? " Sent to the client — awaiting their signature." : " Send it to the client below."}
          </span>
        </p>
      ) : (
        <p>
          Draft · agreement <span className="font-mono">{shortVersion(record.agreementHash)}</span> · saved {new Date(record.updatedAt).toLocaleString()}
        </p>
      )}
      {templateChanged && (
        <p className="mt-2 text-amber-500">
          The terms file changed since this agreement was prepared. Save the draft to pin the current text, review it, then sign.
        </p>
      )}
    </div>
  );
}

function SignDialog({
  proposalId,
  record,
  providerName,
  providerParty,
  onClose,
  onSigned,
}: {
  proposalId: string;
  record: AgreementRecord;
  providerName: string;
  providerParty: string;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [typedName, setTypedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sign = async () => {
    setSigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}/agreement/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ typedName, declaration: agreed, agreementHash: record.agreementHash }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) {
        onClose();
        onSigned();
      } else {
        setError(body.error || "Couldn't sign the agreement.");
      }
    } catch {
      setError("Connection failed — nothing was signed. Try again.");
    } finally {
      setSigning(false);
    }
  };

  return (
    <AdminDialog
      open
      onClose={() => !signing && onClose()}
      title={providerParty === "Service Provider" ? "Sign as Service Provider" : `Sign as the ${providerParty}`}
      description={
        <>
          You&apos;re signing agreement <span className="font-mono text-[var(--andromeda-text-primary)]">{shortVersion(record.agreementHash)}</span> exactly as
          previewed. Once signed it&apos;s frozen: any change voids your signature.
        </>
      }
      actions={
        <>
          <button type="button" onClick={onClose} disabled={signing} className={dialogButton.secondary}>
            Cancel
          </button>
          <button type="button" onClick={() => void sign()} disabled={signing || !agreed || !typedName.trim()} className={dialogButton.primary}>
            {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            Sign
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Type your full name</span>
          <input
            data-autofocus
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder={providerName}
            autoComplete="name"
            className={`mt-1.5 ${inputClass} ${borderClass}`}
          />
        </label>
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1" />
          <span>{providerSigningDeclaration(providerParty)}</span>
        </label>
        {error && (
          <p role="alert" className="text-[var(--andromeda-error)]">
            {error}
          </p>
        )}
      </div>
    </AdminDialog>
  );
}

function MiniIcon({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="p-1 rounded text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)] hover:bg-white/5 light:hover:bg-black/5 disabled:opacity-30"
    >
      {children}
    </button>
  );
}

const formatWhen = (iso: string) => new Date(iso).toLocaleString();

/**
 * The client side of a signed agreement: send (or resend) the signing link,
 * the client's change requests, and once executed: their signature, the PDF,
 * the executed-copy emails and onboarding.
 */
function ClientCard({
  proposalId,
  record,
  activity,
  clientEmail,
  clientSigningOff,
}: {
  proposalId: string;
  record: AgreementRecord;
  activity: AgreementActivity | null;
  clientEmail: string | null;
  clientSigningOff: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"send" | "copy" | null>(null);
  const [message, setMessage] = useState<{ tone: "error" | "ok"; text: string } | null>(null);
  const base = `/api/admin/proposals/${encodeURIComponent(proposalId)}/agreement`;
  const lastSend = activity?.sends.at(-1);
  const client = record.clientSignature;
  const incomplete = !!client && !!activity && followUpIncomplete(activity);

  const send = async () => {
    setBusy("send");
    setMessage(null);
    try {
      const res = await fetch(`${base}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementHash: record.agreementHash, resend: record.status === "sent" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!body.success) setMessage({ tone: "error", text: body.error || "Couldn't send the agreement." });
      else if (body.email === "failed") setMessage({ tone: "error", text: "Marked as sent, but the email failed. Try “Resend link”." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Connection failed. Try again." });
    } finally {
      setBusy(null);
    }
  };

  /** Completes what's missing; with `resend`, also sends the copy to both parties again. */
  const followUp = async (resend: boolean) => {
    setBusy("copy");
    setMessage(null);
    try {
      const res = await fetch(`${base}/executed-copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resend }) });
      const body = await res.json().catch(() => ({}));
      setMessage(
        body.success
          ? { tone: "ok", text: resend ? "Executed copy sent to both parties." : "Follow-up complete." }
          : { tone: "error", text: body.error || "Some steps failed — see below." }
      );
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "Connection failed. Try again." });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section aria-label="Client" className={`p-4 rounded-xl border ${borderClass} bg-[var(--andromeda-secondary)] space-y-3 text-sm`}>
      <h2 className="text-sm font-semibold">Client</h2>

      {client ? (
        <>
          <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
            <dt className="text-[var(--andromeda-text-secondary)]">Signed by</dt>
            <dd>
              {client.legalName}
              {client.organisation && `, for ${client.organisation}${client.capacity ? ` (${client.capacity})` : ""}`}
            </dd>
            <dt className="text-[var(--andromeda-text-secondary)]">Verified</dt>
            <dd className="break-all">{client.email}</dd>
            <dt className="text-[var(--andromeda-text-secondary)]">Signed</dt>
            <dd>{formatWhen(client.signedAt)}</dd>
          </dl>
          {incomplete && (
            <div role="status" className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <p className="text-amber-500">Follow-up incomplete — onboarding or an executed copy isn&apos;t recorded yet.</p>
              <button type="button" onClick={() => void followUp(false)} disabled={busy !== null} className={`${dialogButton.primary} mt-2 inline-flex items-center gap-2`}>
                {busy === "copy" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Complete follow-up
              </button>
            </div>
          )}
          <a href={`${base}/pdf`} className={`${dialogButton.secondary} inline-flex items-center gap-2`}>
            <Download className="w-4 h-4" /> Executed PDF
          </a>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Executed copy</p>
            {activity?.executedEmails.length ? (
              <ul className="mt-1 space-y-0.5">
                {activity.executedEmails.map((m) => (
                  <li key={m.recipient} className={m.status === "failed" ? "text-[var(--andromeda-error)]" : undefined}>
                    {m.recipient === "client" ? "Client" : "You"}: {m.status === "sent" ? `sent${m.attached ? " with PDF" : " without the PDF"}` : "failed"} · {formatWhen(m.at)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[var(--andromeda-text-secondary)]">{activity ? "Not recorded yet (it sends right after signing)." : "Couldn't read the email log."}</p>
            )}
            <button type="button" onClick={() => void followUp(true)} disabled={busy !== null} className="mt-2 text-xs underline hover:text-[var(--andromeda-accent-beige)] disabled:opacity-50">
              {busy === "copy" ? "Sending…" : "Resend executed copy"}
            </button>
          </div>
          {activity?.onboarding && (
            <p className="text-[var(--andromeda-text-secondary)]">
              Onboarding: assets {ONBOARDING_ASSETS[activity.onboarding.assets]}; tracker {ONBOARDING_TRACKER[activity.onboarding.tracker]}.
            </p>
          )}
        </>
      ) : (
        <>
          {lastSend ? (
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-text-secondary)]" />
              <span>
                Link sent to {lastSend.to} on {formatWhen(lastSend.sentAt)}
                {lastSend.email === "failed" && <span className="text-[var(--andromeda-error)]"> — the email failed</span>}
                {lastSend.email === "pending" && <span className="text-[var(--andromeda-text-secondary)]"> — email outcome not recorded</span>}.
              </span>
            </p>
          ) : (
            <p className="text-[var(--andromeda-text-secondary)]">
              {clientEmail ? `The signing link goes to ${clientEmail}.` : "Add the client's email in the proposal settings to send the link."}
            </p>
          )}
          {clientSigningOff ? (
            <p className="text-amber-500">{clientSigningOff}</p>
          ) : (
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy !== null || !clientEmail}
              className={`${record.status === "sent" ? dialogButton.secondary : dialogButton.primary} inline-flex items-center gap-2`}
            >
              {busy === "send" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {record.status === "sent" ? "Resend link" : "Send to client"}
            </button>
          )}
          {!!activity?.changeRequests.length && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Changes requested</p>
              <ul className="mt-1 space-y-2">
                {activity.changeRequests.map((r) => (
                  <li key={r.at} className={`p-2 rounded-lg border ${borderClass}`}>
                    <p className="flex items-center gap-1.5 text-xs text-[var(--andromeda-text-secondary)]">
                      <MessageSquare className="w-3.5 h-3.5" /> {formatWhen(r.at)}
                    </p>
                    <p className="mt-1 whitespace-pre-line">{r.note}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-[var(--andromeda-text-secondary)]">To revise: edit and save (voids your signature and the link), then sign and send again.</p>
            </div>
          )}
        </>
      )}
      {message && (
        <p role={message.tone === "error" ? "alert" : "status"} className={message.tone === "error" ? "text-[var(--andromeda-error)]" : "text-[var(--andromeda-success)]"}>
          {message.text}
        </p>
      )}
    </section>
  );
}

const ONBOARDING_ASSETS: Record<NonNullable<AgreementActivity["onboarding"]>["assets"], string> = {
  derived: "open (the agreement is signed)",
  off: "kept locked — switched off in the proposal editor",
  unlocked: "unlocked",
  already: "were already unlocked",
  no_assets: "— no checklist on this proposal",
  failed: "state couldn't be read — check the Assets switch in the proposal editor",
};

const ONBOARDING_TRACKER: Record<NonNullable<AgreementActivity["onboarding"]>["tracker"], string> = {
  done: "milestone marked done",
  already: "milestone already done",
  not_seeded: "will mark it done when first opened",
  no_milestone: "has no agreement milestone",
  failed: "couldn't be updated",
};
