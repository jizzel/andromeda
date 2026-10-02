"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, PenLine, Plus, Save, X } from "lucide-react";
import type { AgreementRecord, ContractAs, SpecialTerm } from "@/types/agreement";
import type { TemplateClause } from "@/lib/agreement-templates";
import { MAX_SPECIAL_TERM_CHARS, MAX_SPECIAL_TERMS, PROVIDER_SIGNING_DECLARATION } from "@/constants/agreement";
import { shortVersion } from "@/lib/proposal-version-label";
import { AdminDialog, dialogButton } from "../AdminDialog";
import { Field, inputClass } from "../forms/fields";

interface AgreementPanelProps {
  proposalId: string;
  record: AgreementRecord | null;
  templates: { id: string; version: number; title: string; status: "draft" | "final" }[];
  clauses: TemplateClause[];
  /** The pinned template file no longer matches its stored hash (the file was edited). */
  templateChanged: boolean;
  providerName: string;
  providerRole: string;
  tradingName?: string;
  defaultOfferValidUntil: string;
}

type Draft = { templateVersion: number; contractAs: ContractAs; offerValidUntil: string; specialTerms: SpecialTerm[] };

const draftOf = (record: AgreementRecord | null, fallback: Draft): Draft =>
  record
    ? { templateVersion: record.templateVersion, contractAs: record.provider.contractAs, offerValidUntil: record.offerValidUntil, specialTerms: record.specialTerms }
    : fallback;

const borderClass = "border-white/10 light:border-black/10";

/**
 * Prepare and sign the agreement. Edits are saved as a draft (the preview on
 * the right renders the saved draft); signing pins exactly what's previewed.
 * Saving a change to a signed agreement voids the signature, after a confirm.
 */
export function AgreementPanel({
  proposalId,
  record,
  templates,
  clauses,
  templateChanged,
  providerName,
  providerRole,
  tradingName,
  defaultOfferValidUntil,
}: AgreementPanelProps) {
  const router = useRouter();
  const initial = draftOf(record, {
    templateVersion: Math.max(...templates.map((t) => t.version)),
    contractAs: "individual",
    offerValidUntil: defaultOfferValidUntil,
    specialTerms: [],
  });
  const [draft, setDraft] = useState<Draft>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const signed = record?.status === "provider_signed";
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
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

      <section className={`p-4 rounded-xl border ${borderClass} bg-[var(--andromeda-secondary)] space-y-4`}>
        <Field label="Terms">
          <select
            value={draft.templateVersion}
            onChange={(e) => setDraft({ ...draft, templateVersion: Number(e.target.value) })}
            className={`${inputClass} ${borderClass}`}
          >
            {templates.map((t) => (
              <option key={t.version} value={t.version}>
                {t.title} v{t.version}
                {t.status === "draft" ? " — draft, pending legal review" : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contract as" hint={tradingName ? undefined : "Set AGREEMENT_PROVIDER_TRADING_NAME to offer a trading name."}>
          <div className="space-y-1.5 text-sm">
            <label className="flex items-start gap-2">
              <input type="radio" name="contractAs" checked={draft.contractAs === "individual"} onChange={() => setDraft({ ...draft, contractAs: "individual" })} className="mt-1" />
              <span>
                {providerName}, {providerRole}
              </span>
            </label>
            {tradingName && (
              <label className="flex items-start gap-2">
                <input type="radio" name="contractAs" checked={draft.contractAs === "trading"} onChange={() => setDraft({ ...draft, contractAs: "trading" })} className="mt-1" />
                <span>
                  {providerName}, trading as {tradingName}
                </span>
              </label>
            )}
          </div>
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

      {errors.length > 0 && (
        <ul role="alert" className="p-3 rounded-lg border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm text-[var(--andromeda-error)] space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void save()} disabled={saving || (!dirty && !!record && !templateChanged)} className={dialogButton.primary}>
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
          <PenLine className="w-4 h-4" /> Sign as Service Provider
        </button>
      </div>

      <AdminDialog
        open={confirmVoid}
        onClose={() => setConfirmVoid(false)}
        title="This voids your signature"
        description="You've signed this agreement. Saving these changes cancels that signature; you'll need to review and sign the changed agreement again."
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

      {signOpen && record && <SignDialog proposalId={proposalId} record={record} providerName={providerName} onClose={() => setSignOpen(false)} onSigned={() => router.refresh()} />}
    </div>
  );
}

function StatusCard({ record, templateChanged }: { record: AgreementRecord | null; templateChanged: boolean }) {
  if (!record) {
    return <p className={`p-4 rounded-xl border ${borderClass} text-sm`}>No agreement yet. Choose the terms and any special terms, then prepare it.</p>;
  }
  const signature = record.providerSignature;
  return (
    <div className={`p-4 rounded-xl border text-sm ${signature ? "border-[var(--andromeda-success)]/40 bg-[var(--andromeda-success)]/5" : `${borderClass}`}`}>
      {signature ? (
        <p className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-success)]" />
          <span>
            Signed by you on {new Date(signature.signedAt).toLocaleString()} · agreement <span className="font-mono">{shortVersion(signature.agreementHash)}</span>.
            Awaiting the client once client signing is enabled.
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
  onClose,
  onSigned,
}: {
  proposalId: string;
  record: AgreementRecord;
  providerName: string;
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
      title="Sign as Service Provider"
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
          <span>{PROVIDER_SIGNING_DECLARATION}</span>
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
