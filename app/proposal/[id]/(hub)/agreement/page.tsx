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
import { ExecutedAgreementView } from "@/components/agreements/ExecutedAgreementView";
import { loadExecutedAgreement } from "@/lib/executed-agreement";
import { hubAccess } from "@/lib/client-session";
import { HubAccessGate } from "@/components/proposals/hub/HubAccessGate";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Agreement",
  robots: { index: false, follow: false },
};

const formatDay = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * The hub's Agreement tab (the hub session already proved the access code).
 * Shown once Joseph has signed and sent the agreement (and client signing is
 * enabled for its terms). Signing additionally needs a verified signer
 * session — a code emailed to the client's address, kept as evidence. A
 * signed agreement shows the executed document, rebuilt from its verified
 * signed copy, with the PDF.
 */
export default async function ClientAgreementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Checked here, not only in the layout: layouts aren't re-rendered on
  // navigation between tabs, so an expired or revoked session must not reach
  // this server-rendered document by moving here from an open hub.
  if (!(await hubAccess(id))) return <HubAccessGate proposalId={id} />;
  const agreement = await loadClientAgreement(id);
  if (!agreement.ok) {
    return agreement.code === "unavailable" ? (
      <AgreementNotice title="Agreement unavailable" proposalId={id}>
        <p>We couldn&apos;t load the agreement just now. Please try again in a moment.</p>
      </AgreementNotice>
    ) : (
      <AgreementNotice title="No agreement to sign yet" proposalId={id}>
        <p>There&apos;s no agreement waiting for your signature on this proposal. We&apos;ll email you when it&apos;s ready.</p>
      </AgreementNotice>
    );
  }
  const { record, template } = agreement;
  if (record.status === "executed") {
    const executed = await loadExecutedAgreement(id);
    if (!executed) {
      return (
        <AgreementNotice title="Agreement signed" proposalId={id}>
          <p>Your agreement is signed by both parties. We couldn&apos;t display it just now — please contact {profile.email} for a copy.</p>
        </AgreementNotice>
      );
    }
    return (
      <ExecutedAgreementView proposalId={id} agreementHash={executed.record.agreementHash} signedAt={formatDay(executed.record.clientSignature!.signedAt.slice(0, 10))}>
        <AgreementDocument
          record={executed.record}
          template={executed.template}
          proposal={executed.proposal}
          fullProposalHref={`/proposal/${encodeURIComponent(id)}/agreement/proposal`}
        />
      </ExecutedAgreementView>
    );
  }

  const session = await authorisedSigner((await cookies()).get(AGREEMENT_SIGNER_COOKIE)?.value, id, record);
  if (!session) return <AgreementSignInGate proposalId={id} documentTitle={template.clientTitle} />;

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
    <main className="bg-[var(--andromeda-primary)] px-4 sm:px-6 pt-8 pb-16">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--andromeda-accent-beige)] mb-1">{snapshot.snapshot.title}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--andromeda-text-primary)]">Your {template.clientTitle.toLowerCase()}</h1>
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
          <div className="lg:sticky lg:top-36 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:overscroll-contain rounded-xl">
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
