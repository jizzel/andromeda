import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authorisedSigner, loadClientAgreement } from "@/lib/agreement-client";
import { loadVerifiedSnapshot } from "@/lib/agreement-basis";
import { offerClosed } from "@/lib/agreements";
import { acceptanceDeclaration } from "@/lib/agreement-templates";
import { AGREEMENT_SIGNER_COOKIE } from "@/lib/agreement-signer";
import { profile } from "@/constants/profile";
import { AgreementDocument } from "@/components/agreements/AgreementDocument";
import { AgreementNotice } from "@/components/agreements/AgreementNotice";
import { AgreementSignInGate } from "@/components/agreements/AgreementSignInGate";
import { ClientSigningForm } from "@/components/agreements/ClientSigningForm";
import { ExecutedAgreementAccess } from "@/components/agreements/ExecutedAgreementAccess";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Service Agreement",
  robots: { index: false, follow: false },
};

const formatDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * The client's agreement page. Shown only once Joseph has signed and sent the
 * agreement (and client signing is enabled for its terms). The document and
 * signing form need a verified signer session (access code + emailed code);
 * a signed agreement offers the executed PDF behind the access code.
 */
export default async function ClientAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agreement = await loadClientAgreement(id);
  if (!agreement.ok) {
    return agreement.code === "unavailable" ? (
      <AgreementNotice title="Agreement unavailable" proposalId={id}>
        <p>We couldn&apos;t load the agreement just now. Please try again in a moment.</p>
      </AgreementNotice>
    ) : (
      <AgreementNotice title="No agreement to sign yet" proposalId={id}>
        <p>There&apos;s no service agreement waiting for your signature on this proposal. We&apos;ll email you when it&apos;s ready.</p>
      </AgreementNotice>
    );
  }
  const { record, template } = agreement;
  if (record.status === "executed") return <ExecutedAgreementAccess proposalId={id} agreementHash={record.agreementHash} />;

  const session = await authorisedSigner((await cookies()).get(AGREEMENT_SIGNER_COOKIE)?.value, id, record);
  if (!session) return <AgreementSignInGate proposalId={id} />;

  if (offerClosed(record.offerValidUntil)) {
    return (
      <AgreementNotice title="The time to sign has passed" proposalId={id}>
        <p>This agreement was open for signing until {formatDay(record.offerValidUntil)}.</p>
        <p>
          Reply to our email or write to <a className="underline" href={`mailto:${profile.email}`}>{profile.email}</a> and we&apos;ll send a renewed
          agreement.
        </p>
      </AgreementNotice>
    );
  }
  const snapshot = await loadVerifiedSnapshot(id, record.proposalVersion);
  const declaration = acceptanceDeclaration(template);
  if (!snapshot.ok || !declaration) {
    if (!declaration) console.error(`Client agreement for ${id}: template has no acceptance declaration`);
    return (
      <AgreementNotice title="Agreement unavailable" proposalId={id}>
        <p>This agreement can&apos;t be signed right now. Please contact {profile.email} and we&apos;ll sort it out.</p>
      </AgreementNotice>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)] px-4 sm:px-6 pt-24 pb-16">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">{snapshot.snapshot.title}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--andromeda-text-primary)]">Your service agreement</h1>
          <p className="mt-2 text-sm text-[var(--andromeda-text-secondary)]">
            Please read the agreement, including both schedules. {record.provider.name} has already signed it; it takes effect when you sign.
          </p>
        </header>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] items-start">
          <section aria-label="Agreement" className="p-5 sm:p-8 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)] min-w-0">
            <AgreementDocument
              record={record}
              template={template}
              proposal={snapshot.snapshot}
              fullProposalHref={`/proposal/${encodeURIComponent(id)}/agreement/proposal`}
            />
          </section>
          {/* Sticky beside the long document, but never taller than the window: it scrolls on its own. */}
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:overscroll-contain rounded-xl">
            <ClientSigningForm
              proposalId={id}
              agreementHash={record.agreementHash}
              clientName={record.clientName || snapshot.snapshot.client.name}
              declaration={declaration}
              signerEmail={session.email}
              openUntil={formatDay(record.offerValidUntil)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
