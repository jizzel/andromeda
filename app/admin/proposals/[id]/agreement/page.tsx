import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalRowForEdit, readAgreement } from "@/lib/google-sheets";
import { latestTemplate, listTemplates, loadTemplate } from "@/lib/agreement-templates";
import { agreementProvider } from "@/constants/agreement";
import { defaultOfferValidUntil } from "@/lib/agreements";
import { shortVersion } from "@/lib/proposal-version-label";
import { proposalVersion } from "@/lib/proposal-version";
import { loadAgreementBasis } from "@/app/api/admin/proposals/[id]/agreement/context";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { AgreementPanel } from "@/components/admin/agreement/AgreementPanel";
import type { AgreementRecord } from "@/types/agreement";

export const dynamic = "force-dynamic";

export default async function AdminAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [row, basis] = await Promise.all([getProposalRowForEdit(id), loadAgreementBasis(id)]);
  if (!row) notFound();
  let record: AgreementRecord | null = null;
  let recordError: string | null = null;
  try {
    record = await readAgreement(id);
  } catch (error) {
    console.error(`Agreement page for ${id}:`, error);
    recordError = "Couldn't read the agreement from the sheet. Reload to try again.";
  }
  const template = (record ? loadTemplate(record.templateId, record.templateVersion) : null) ?? latestTemplate();
  if (!template) throw new Error("No agreement template is registered");
  const templateChanged = !!record && record.templateHash !== template.hash;
  const data = row.record.data;
  const versionHref = basis.ok ? `/admin/proposals/${encodeURIComponent(id)}/versions/${basis.acceptance.proposalVersion}` : "";
  const liveMovedOn = basis.ok && proposalVersion(data) !== basis.acceptance.proposalVersion;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <Link
        href={`/admin/proposals/${encodeURIComponent(id)}`}
        className="inline-flex items-center gap-1 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
      >
        <ArrowLeft className="w-4 h-4" /> Proposal editor
      </Link>
      <header className="mt-3 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">Agreement</p>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {data.client?.name ?? id} — {data.title}
        </h1>
        {basis.ok && (
          <p className="mt-1 text-sm text-[var(--andromeda-text-secondary)]">
            Incorporates the version the client accepted ({shortVersion(basis.acceptance.proposalVersion)}). Clients can&apos;t see or sign
            agreements yet — client signing comes in the next release, after the legal review.
          </p>
        )}
        {liveMovedOn && (
          <p role="status" className="mt-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-sm">
            The live proposal has been edited since the client accepted it. This agreement incorporates the <strong>accepted</strong> version, not
            the current page —{" "}
            <Link href={versionHref} className="underline">
              review the accepted version
            </Link>
            .
          </p>
        )}
      </header>

      {!basis.ok ? (
        <div role="alert" className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm">
          {basis.error}
        </div>
      ) : recordError ? (
        <div role="alert" className="p-4 rounded-xl border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm">
          {recordError}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] items-start">
          {/* Keyed on the saved record: after a save or signature the panel starts from what's stored. */}
          <AgreementPanel
            key={record?.updatedAt ?? "new"}
            proposalId={id}
            record={record}
            templates={listTemplates()}
            clauses={template.clauses}
            templateChanged={templateChanged}
            providerName={agreementProvider.legalName}
            providerRole={agreementProvider.role}
            tradingName={agreementProvider.tradingName}
            defaultOfferValidUntil={defaultOfferValidUntil()}
          />
          <section aria-label="Agreement preview" className="p-5 sm:p-8 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)] min-w-0">
            {record ? (
              <AgreementDocument record={record} template={template} proposal={basis.snapshot} acceptance={basis.acceptance} fullProposalHref={versionHref} />
            ) : (
              <p className="text-sm text-[var(--andromeda-text-secondary)]">
                Save a draft to see the full agreement here: {template.title} v{template.version}, your special terms, and the accepted
                proposal as Schedule 2.
              </p>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
