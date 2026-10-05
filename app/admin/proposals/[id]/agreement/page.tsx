import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/admin-auth";
import { getProposalRowForEdit, readAgreement, readProposalEngagementEvents } from "@/lib/google-sheets";
import { latestTemplate, listTemplates, loadTemplate, suggestedTemplateId } from "@/lib/agreement-templates";
import { agreementProvider, PROVIDER_ORGANISATIONS } from "@/constants/agreement";
import { defaultOfferValidUntil } from "@/lib/agreements";
import { shortVersion } from "@/lib/proposal-version-label";
import { proposalVersion } from "@/lib/proposal-version";
import { loadAgreementBasis } from "@/lib/agreement-basis";
import { CLIENT_SIGNING_OFF_REASON, clientSigningAllowed } from "@/lib/agreement-gate";
import { foldAgreementActivity } from "@/lib/agreement-activity";
import { loadExecutedAgreement, type ExecutedAgreement } from "@/lib/executed-agreement";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { AgreementPanel } from "@/components/admin/agreement/AgreementPanel";
import { AdminBreadcrumb } from "@/components/admin/AdminBreadcrumb";
import type { AgreementActivity, AgreementRecord } from "@/types/agreement";

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
  let activity: AgreementActivity | null = null;
  if (record && record.status !== "draft") {
    try {
      activity = foldAgreementActivity(await readProposalEngagementEvents(id), record.agreementHash);
    } catch (error) {
      console.error(`Agreement activity for ${id}:`, error);
    }
  }
  // An executed agreement is shown exactly as signed — from its verified
  // signed copy, never from the terms file as it is now.
  let executed: ExecutedAgreement | null = null;
  let executedError = false;
  if (record?.status === "executed") {
    try {
      executed = await loadExecutedAgreement(id);
    } catch (error) {
      console.error(`Executed agreement for ${id}:`, error);
    }
    executedError = !executed;
  }
  // Terms scoped to this proposal and its accepted package (e.g. IIA Ghana's licence), else the default.
  const suggested = suggestedTemplateId(id, basis.ok ? basis.acceptance.packageId : null);
  const template =
    executed?.template ?? (record ? loadTemplate(record.templateId, record.templateVersion) : null) ?? latestTemplate(suggested) ?? latestTemplate();
  if (!template) throw new Error("No agreement template is registered");
  const templateChanged = !!record && record.status !== "executed" && record.templateHash !== template.hash;
  const data = row.record.data;
  const versionHref = basis.ok ? `/admin/proposals/${encodeURIComponent(id)}/versions/${basis.acceptance.proposalVersion}` : "";
  const liveMovedOn = basis.ok && proposalVersion(data) !== basis.acceptance.proposalVersion;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <AdminBreadcrumb
        items={[
          { label: "Proposals", href: "/admin" },
          { label: data.client?.name ?? id, href: `/admin/proposals/${encodeURIComponent(id)}` },
          { label: "Agreement" },
        ]}
      />
      <header className="mt-3 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">Agreement</p>
        <h1 className="text-2xl sm:text-3xl font-bold">
          {data.client?.name ?? id} — {data.title}
        </h1>
        {basis.ok && (
          <p className="mt-1 text-sm text-[var(--andromeda-text-secondary)]">
            Incorporates the version the client accepted ({shortVersion(basis.acceptance.proposalVersion)}).
            {!clientSigningAllowed(template) && ` ${CLIENT_SIGNING_OFF_REASON}`}
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
            templates={listTemplates(id)}
            suggestedTemplateId={suggested}
            templateChanged={templateChanged}
            providerName={agreementProvider.legalName}
            providerRole={agreementProvider.role}
            organisations={PROVIDER_ORGANISATIONS}
            defaultOfferValidUntil={defaultOfferValidUntil()}
            activity={activity}
            clientEmail={data.client?.email?.trim() || null}
            clientSigningOff={clientSigningAllowed(template) ? null : CLIENT_SIGNING_OFF_REASON}
          />
          <section aria-label="Agreement preview" className="p-5 sm:p-8 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)] min-w-0">
            {executedError ? (
              <p role="alert" className="text-sm text-[var(--andromeda-error)]">
                The signed copy of this agreement couldn&apos;t be read or doesn&apos;t verify against its hashes, so it isn&apos;t shown. Check the
                AgreementSnapshots tab.
              </p>
            ) : executed ? (
              <AgreementDocument record={executed.record} template={executed.template} proposal={executed.proposal} fullProposalHref={versionHref} showTemplateInfo />
            ) : record ? (
              <AgreementDocument record={record} template={template} proposal={basis.snapshot} acceptance={basis.acceptance} fullProposalHref={versionHref} showTemplateInfo />
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
