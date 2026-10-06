import { NextResponse, type NextRequest } from "next/server";
import { getProposalById, readAgreement } from "@/lib/google-sheets";
import { loadTemplate, type AgreementTemplate } from "@/lib/agreement-templates";
import { clientSigningAllowed } from "@/lib/agreement-gate";
import { accessCodeTag, AGREEMENT_SIGNER_COOKIE, readSignerSession, type SignerSession } from "@/lib/agreement-signer";
import type { AgreementRecord } from "@/types/agreement";

/**
 * Shared by the client-facing agreement routes and pages. The client only
 * ever sees an agreement once Joseph has signed and sent it, and only while
 * client signing is enabled for its template (`clientSigningAllowed`). Server-only.
 */

export type ClientAgreement =
  | { ok: true; record: AgreementRecord; template: AgreementTemplate }
  | { ok: false; code: "not_available" | "unavailable" | "updating" };

/** The proposal's agreement if the client may see it: sent (open for signing) or executed. */
export async function loadClientAgreement(proposalId: string): Promise<ClientAgreement> {
  let record: AgreementRecord | null;
  try {
    record = await readAgreement(proposalId);
  } catch (error) {
    console.error(`Client agreement for ${proposalId}: unavailable:`, error);
    return { ok: false, code: "unavailable" };
  }
  const offered = offeredToClient(record);
  if (!offered) return { ok: false, code: "not_available" };
  // Never show the client terms other than the ones Joseph signed.
  if (offered.termsChanged) return { ok: false, code: "updating" };
  return { ok: true, record: offered.record, template: offered.template };
}

/**
 * The record and its template if the client may see it: sent (and client
 * signing enabled for its terms) or executed. An executed agreement stays
 * viewable whatever the gate says (it renders from its signed copy).
 *
 * `termsChanged`: a sent agreement whose terms file no longer hashes to the
 * version it pinned (and Joseph signed), e.g. the file was edited after
 * preparing, or it was prepared on a server with different terms. The client
 * is told it's being updated instead of being shown text nobody signed;
 * signing would refuse it anyway (`verifySigningBasis`).
 */
function offeredToClient(record: AgreementRecord | null): { record: AgreementRecord; template: AgreementTemplate; termsChanged: boolean } | null {
  if (!record || (record.status !== "sent" && record.status !== "executed")) return null;
  const template = loadTemplate(record.templateId, record.templateVersion);
  if (!template || (record.status === "sent" && !clientSigningAllowed(template))) return null;
  return { record, template, termsChanged: record.status === "sent" && template.hash !== record.templateHash };
}

/** `clientAgreementStatus` for a record already read (e.g. by `loadEngagement`). */
export function clientAgreementStatusOf(record: AgreementRecord | null): "sent" | "executed" | null {
  const offered = offeredToClient(record);
  return offered && (offered.record.status === "sent" || offered.record.status === "executed") ? offered.record.status : null;
}

/** What the proposal page offers: "Review and sign agreement" (sent) or "View signed agreement" (executed). Never throws. */
export async function clientAgreementStatus(proposalId: string): Promise<"sent" | "executed" | null> {
  const agreement = await loadClientAgreement(proposalId);
  return agreement.ok && (agreement.record.status === "sent" || agreement.record.status === "executed") ? agreement.record.status : null;
}

/**
 * Whether the access a signer token was obtained with still stands: the
 * proposal is active and its access code is the one the signer entered.
 * Deactivating a proposal or regenerating its code revokes live sessions.
 * Unreadable → false (fail closed).
 */
export async function accessStillGranted(proposalId: string, codeTag: string): Promise<boolean> {
  try {
    const proposal = await getProposalById(proposalId);
    return !!proposal?.isActive && accessCodeTag(proposal.accessCode) === codeTag;
  } catch (error) {
    console.error(`Agreement access check for ${proposalId} failed:`, error);
    return false;
  }
}

/** The signer session from a cookie value, if it's for this proposal, the agreement as it stands, and access still stands. */
export async function authorisedSigner(cookieValue: string | undefined, proposalId: string, record: AgreementRecord): Promise<SignerSession | null> {
  const session = readSignerSession(cookieValue, proposalId);
  if (!session || session.agreementHash !== record.agreementHash) return null;
  return (await accessStillGranted(proposalId, session.codeTag)) ? session : null;
}

/** `authorisedSigner` for a route request. */
export const signerFor = (request: NextRequest, proposalId: string, record: AgreementRecord) =>
  authorisedSigner(request.cookies.get(AGREEMENT_SIGNER_COOKIE)?.value, proposalId, record);

export const clientJson = (body: Record<string, unknown>, status = 200) => NextResponse.json(body, { status });

/** A sent agreement whose pinned terms no longer match the server's (`termsChanged`). */
export const AGREEMENT_UPDATING = {
  success: false,
  code: "updating",
  error: "Your agreement is being updated. Joseph will send you the current version shortly.",
};

export const NOT_AVAILABLE = { success: false, code: "not_available", error: "There's no agreement waiting for your signature on this proposal." };
