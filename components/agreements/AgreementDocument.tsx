import type { ComponentPropsWithoutRef } from "react";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import type { AgreementRecord } from "@/types/agreement";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";
import type { AgreementTemplate } from "@/lib/agreement-templates";
import { fillTemplate } from "@/lib/agreement-templates";
import { providerAffiliation } from "@/lib/agreements";
import { shortVersion } from "@/lib/proposal-version-label";

interface AgreementDocumentProps {
  record: AgreementRecord;
  template: AgreementTemplate;
  /** The accepted proposal version (snapshot), incorporated as Schedule 2. */
  proposal: ProposalDataUnion;
  /** Only for records prepared before `acceptedAt` was pinned (their date falls back to the live acceptance). */
  acceptance?: Pick<ProposalAcceptance, "acceptedAt">;
  /** Where the full accepted proposal can be reviewed (the admin version view, or the client's). */
  fullProposalHref?: string;
  /** Admin only: name the base terms (template, version, draft status) above the title. Clients see the engagement's agreement. */
  showTemplateInfo?: boolean;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });
const formatDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Plain-markdown rendering of the terms (format "md": braces in legal text are text, not code).
const markdown = {
  h2: (props: ComponentPropsWithoutRef<"h2">) => <h2 className="mt-8 mb-3 text-base font-semibold text-[var(--andromeda-text-primary)]" {...props} />,
  p: (props: ComponentPropsWithoutRef<"p">) => <p className="mb-3" {...props} />,
  ul: (props: ComponentPropsWithoutRef<"ul">) => <ul className="mb-3 ml-5 list-disc space-y-1" {...props} />,
  ol: (props: ComponentPropsWithoutRef<"ol">) => <ol className="mb-3 ml-5 list-decimal space-y-1" {...props} />,
  strong: (props: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-[var(--andromeda-text-primary)]" {...props} />,
};

/**
 * The agreement as the parties sign it: the pinned template text with the
 * provider block filled in, Schedule 1 (special terms), Schedule 2 (the
 * accepted proposal version), the signature blocks and every hash. Used by
 * the admin preview, the client's signing page and the executed PDF (which
 * renders it from the signed snapshot) — so all three show the same document.
 */
export async function AgreementDocument({ record, template, proposal, acceptance, fullProposalHref, showTemplateInfo = false }: AgreementDocumentProps) {
  const body = fillTemplate(template.body, record.provider);
  const clauseTitle = (number: string) => template.clauses.find((c) => c.number === number.split(".")[0])?.title;
  const packages = "packages" in proposal && Array.isArray(proposal.packages) ? proposal.packages : [];
  const plans = "paymentPlans" in proposal && Array.isArray(proposal.paymentPlans) ? proposal.paymentPlans : [];
  // The pinned selection (part of the signed hash), not the live acceptance row.
  const pkg = packages.find((p) => p.id === record.selection?.packageId);
  const plan = plans.find((p) => p.id === record.selection?.paymentPlanId);
  const signature = record.providerSignature;
  const client = record.clientSignature;
  const acceptedAt = record.acceptedAt ?? acceptance?.acceptedAt;

  return (
    <article className="text-sm leading-relaxed text-[var(--andromeda-text-secondary)]">
      <header className="mb-6">
        {showTemplateInfo && (
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)]">
            Base terms: {template.title} · version {template.version}
            {template.status === "draft" && " · draft for legal review"}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-bold text-[var(--andromeda-text-primary)]">Service Agreement — {proposal.title}</h1>
        <p className="mt-1">
          Between {record.provider.name}
          {providerAffiliation(record.provider) && `, ${record.provider.role}${providerAffiliation(record.provider)}`} and {proposal.client.name}
        </p>
      </header>

      <MDXRemote source={body} components={markdown} options={{ mdxOptions: { format: "md", remarkPlugins: [remarkGfm] } }} />

      <section className="mt-10">
        <h2 className="mb-3 text-base font-semibold text-[var(--andromeda-text-primary)]">Schedule 1 — Special Terms</h2>
        {record.specialTerms.length ? (
          <ol className="space-y-3">
            {record.specialTerms.map((term, i) => (
              <li key={term.id}>
                <p className="font-semibold text-[var(--andromeda-text-primary)]">
                  S{i + 1}. Varies clause {term.clause}
                  {clauseTitle(term.clause) ? ` (${clauseTitle(term.clause)})` : ""}:
                </p>
                <p className="whitespace-pre-line">{term.text}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p>None. The terms above apply as written.</p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-base font-semibold text-[var(--andromeda-text-primary)]">Schedule 2 — The Accepted Proposal</h2>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
          <dt>Proposal</dt>
          <dd className="text-[var(--andromeda-text-primary)]">{proposal.title}</dd>
          <dt>Client</dt>
          <dd className="text-[var(--andromeda-text-primary)]">{proposal.client.name}</dd>
          <dt>Version reference</dt>
          <dd className="font-mono text-[var(--andromeda-text-primary)]">{shortVersion(record.proposalVersion)}</dd>
          <dt>Accepted on</dt>
          <dd className="text-[var(--andromeda-text-primary)]">
            {/* The pinned date (signed); older records fall back to the live acceptance, flagged. */}
            {acceptedAt ? formatDateTime(acceptedAt) : "—"}
            {!record.acceptedAt && <span className="ml-2 text-xs text-amber-500">(not pinned — re-save to pin)</span>}
          </dd>
          {pkg && (
            <>
              <dt>Package</dt>
              <dd className="text-[var(--andromeda-text-primary)]">
                {pkg.name} — {pkg.totalPrice}
              </dd>
            </>
          )}
          {plan && (
            <>
              <dt>Payment plan</dt>
              <dd className="text-[var(--andromeda-text-primary)]">
                {plan.name} — {plan.totalInvestment}
                <ul className="mt-1 ml-5 list-disc">
                  {plan.structure.map((m, i) => (
                    <li key={i}>
                      {m.milestone}: {[m.percentage, m.amount].filter(Boolean).join(" · ")}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          )}
        </dl>
        <p className="mt-3">
          The full Proposal, as accepted, forms part of this Agreement. It is identified by the version reference above and
          remains available to both Parties through the Portal.
        </p>
        {fullProposalHref && (
          <p className="mt-2">
            <a href={fullProposalHref} className="font-medium text-[var(--andromeda-accent-beige)] underline">
              View the full accepted proposal (version {shortVersion(record.proposalVersion)})
            </a>
          </p>
        )}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="p-4 rounded-lg border border-white/10 light:border-black/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Service Provider — signed and offered</p>
          <p className="mt-2 text-[var(--andromeda-text-primary)]">{record.provider.name}</p>
          <p>
            {record.provider.role}
            {providerAffiliation(record.provider)}
          </p>
          <p>{record.provider.email}</p>
          {signature ? (
            <>
              <p className="mt-2">
                Electronic signature: <span className="font-semibold text-[var(--andromeda-text-primary)]">{signature.typedName}</span>
              </p>
              <p>Signed: {formatDateTime(signature.signedAt)}</p>
            </>
          ) : (
            <p className="mt-2 italic">Not yet signed.</p>
          )}
          <p className="mt-2">Offer open until {formatDay(record.offerValidUntil)}.</p>
        </div>
        <div className="p-4 rounded-lg border border-white/10 light:border-black/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Client — accept and sign</p>
          <p className="mt-2 text-[var(--andromeda-text-primary)]">{proposal.client.name}</p>
          {client ? (
            <>
              <p className="mt-2">
                Electronic signature: <span className="font-semibold text-[var(--andromeda-text-primary)]">{client.legalName}</span>
              </p>
              {client.organisation && (
                <p>
                  For {client.organisation}
                  {client.capacity ? `, as ${client.capacity}` : ""}
                </p>
              )}
              <p>Signed: {formatDateTime(client.signedAt)}</p>
              <p className="mt-2 text-xs">
                Identity verified by a one-time code sent to {client.email} ({formatDateTime(client.verification.verifiedAt)}).
              </p>
            </>
          ) : (
            <p className="mt-2 italic">Awaiting the Client&apos;s signature.</p>
          )}
        </div>
      </section>

      <footer className="mt-8 pt-4 border-t border-white/10 light:border-black/10 text-xs font-mono break-all space-y-0.5">
        <p>Agreement {record.agreementHash}</p>
        <p>
          Terms {template.id}@{template.version} · {record.templateHash}
        </p>
        <p>Proposal version {record.proposalVersion}</p>
        {client && signature && (
          <p>
            Executed {client.signedAt} · provider signature {signature.signedAt} · client verification {client.verification.nonce}
          </p>
        )}
      </footer>
    </article>
  );
}
