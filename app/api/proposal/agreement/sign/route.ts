import { after, type NextRequest } from "next/server";
import { withRouteTelemetry } from "@/lib/sheets-telemetry";
import { isSameOrigin, requestMeta } from "@/lib/admin-auth";
import { appendEngagementEvent, readAgreement, saveAgreementSnapshot, SheetLockExpiredError, withProposalLock, writeAgreement } from "@/lib/google-sheets";
import { acceptanceDeclaration } from "@/lib/agreement-templates";
import { offerClosed } from "@/lib/agreements";
import { agreementSnapshotJson, signingFailureResponse, verifySigningBasis } from "@/lib/agreement-basis";
import { clientSigningAllowed } from "@/lib/agreement-gate";
import { AGREEMENT_SIGNER_COOKIE, readSignerSession } from "@/lib/agreement-signer";
import { accessStillGranted, clientJson, NOT_AVAILABLE } from "@/lib/agreement-client";
import { clientSignedEventDetail, completeExecutionFollowUp } from "@/lib/agreement-execution";
import type { AgreementRecord, ClientSignature } from "@/types/agreement";

export const runtime = "nodejs";
// The executed PDF is rendered and emailed after the response (`after()`).
export const maxDuration = 60;

const MAX_FIELD = 200;
const field = (value: unknown) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "");

/**
 * "Accept and Sign Agreement" (§29.3). Requires a verified signer session for
 * this proposal and the agreement as it stands, then — under the proposal
 * lock — re-verifies everything the provider's signature covered (the gate,
 * status `sent`, the offer window, the acceptance, the accepted snapshot, the
 * terms file and the recomputed hash) before storing the executed copy, the
 * executed record and the event. Onboarding and the executed-copy emails
 * follow after the response.
 *
 * Once the executed record is written the contract stands, so nothing after
 * it can fail the request: the event is best-effort (the follow-up restores a
 * missing one), and a retry by the same signer (same verified session) gets
 * success and resumes whatever follow-up isn't recorded yet.
 */
async function handlePOST(request: NextRequest) {
  if (!isSameOrigin(request)) return clientJson({ success: false, error: "Forbidden" }, 403);
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return clientJson({ success: false, error: "Invalid request" }, 400);
  }
  const proposalId = field(body.proposalId);
  const shownHash = typeof body.agreementHash === "string" ? body.agreementHash : "";
  const legalName = field(body.legalName);
  const organisation = field(body.organisation);
  const capacity = field(body.capacity);
  const problems: string[] = [];
  if (legalName.length < 2) problems.push("Enter your full legal name.");
  if (organisation && !capacity) problems.push("Enter the capacity in which you sign for the organisation (e.g. Director).");
  if ([legalName, organisation, capacity].some((v) => v.length > MAX_FIELD)) problems.push(`Keep each field under ${MAX_FIELD} characters.`);
  if (body.declaration !== true) problems.push("Confirm the declaration to sign.");
  if (problems.length) return clientJson({ success: false, code: "invalid", errors: problems, error: problems[0] }, 400);

  const session = readSignerSession(request.cookies.get(AGREEMENT_SIGNER_COOKIE)?.value, proposalId);
  if (!session) return clientJson({ success: false, code: "signed_out", error: "Your signing session has expired. Verify your email again to continue." }, 401);
  const meta = requestMeta(request);

  const locked = await withProposalLock(proposalId, async (lock) => {
    // Access must still stand (active proposal, same access code) — checked
    // under the lock, so a deactivation or new code can't slip in before the write.
    if (!(await accessStillGranted(proposalId, session.codeTag))) return { kind: "signed_out" } as const;
    const record = await readAgreement(proposalId);
    if (!record || (record.status !== "sent" && record.status !== "executed")) return { kind: "not_available" } as const;
    if (record.status === "executed") {
      // The same signer retrying (e.g. the first response was lost): their signature stands.
      const sameSigner = record.clientSignature?.verification.nonce === session.nonce && record.agreementHash === session.agreementHash;
      return sameSigner ? ({ kind: "signed_before", record } as const) : ({ kind: "already_signed" } as const);
    }
    // The session, the page the client read and the stored record must all be the same agreement.
    if (session.agreementHash !== record.agreementHash || shownHash !== record.agreementHash) return { kind: "changed" } as const;
    if (!record.providerSignature || record.providerSignature.agreementHash !== record.agreementHash) return { kind: "not_available" } as const;
    if (offerClosed(record.offerValidUntil)) return { kind: "offer_expired" } as const;
    const basis = await verifySigningBasis(record, shownHash);
    if (!basis.ok) return { kind: "failed", failure: basis } as const;
    if (!clientSigningAllowed(basis.template)) return { kind: "not_available" } as const;
    const declarationText = acceptanceDeclaration(basis.template);
    if (!declarationText) {
      console.error(`Agreement for ${proposalId}: template has no acceptance declaration`);
      return { kind: "not_available" } as const;
    }

    const signedAt = new Date().toISOString();
    const clientSignature: ClientSignature = {
      legalName,
      organisation,
      capacity: organisation ? capacity : "",
      email: session.email,
      declarationText,
      signedAt,
      agreementHash: record.agreementHash,
      ...meta,
      verification: { nonce: session.nonce, verifiedAt: session.verifiedAt },
    };
    const executed: AgreementRecord = { ...record, status: "executed", clientSignature, updatedAt: signedAt };
    // Evidence first, as for the provider: the executed copy (self-contained:
    // record with both signatures, terms text, accepted proposal) is stored
    // before the record says executed, and if it can't be, nothing is signed.
    try {
      await saveAgreementSnapshot(proposalId, record.agreementHash, signedAt, "client_signed", agreementSnapshotJson(executed, basis.clientName, basis.template.raw, basis.snapshotJson), lock);
    } catch (error) {
      if (error instanceof SheetLockExpiredError) throw error;
      console.error(`Executed agreement snapshot for ${proposalId} failed:`, error);
      return { kind: "snapshot_failed" } as const;
    }
    await writeAgreement(executed, lock);
    // Committed. From here nothing may fail the request (see above).
    try {
      await appendEngagementEvent(
        { proposalId, event: "agreement_client_signed", proposalVersion: record.proposalVersion, detail: clientSignedEventDetail(executed), ...meta },
        lock
      );
    } catch (error) {
      console.error(`Agreement for ${proposalId} executed, but the signing event couldn't be recorded (the follow-up will restore it):`, error);
    }
    return { kind: "signed", record: executed, clientName: basis.clientName, projectTitle: basis.snapshot.title } as const;
  });

  if (locked.status === "busy") return clientJson({ success: false, code: "busy", error: "We're processing another update to this proposal. Try again in a moment." }, 409);
  const outcome = locked.value;
  switch (outcome.kind) {
    case "not_available":
      return clientJson(NOT_AVAILABLE, 404);
    case "already_signed":
      return clientJson({ success: false, code: "already_signed", error: "This agreement has already been signed." }, 409);
    case "signed_out":
      return clientJson({ success: false, code: "signed_out", error: "Your access to this proposal has changed, so nothing was signed. Enter your current access code to continue." }, 401);
    case "changed":
      return clientJson({ success: false, code: "stale", error: "This agreement has changed since you opened it. Reload to review the current version." }, 409);
    case "offer_expired":
      return clientJson({ success: false, code: "offer_expired", error: "The time to sign this agreement has passed. Please contact us for a renewed agreement." }, 409);
    case "snapshot_failed":
      return clientJson({ success: false, code: "snapshot_failed", error: "We couldn't record your signature, so nothing was signed. Try again." }, 503);
    case "failed": {
      const { status, body: failure } = signingFailureResponse(outcome.failure, "client");
      return clientJson(failure, status);
    }
  }

  const { record } = outcome;
  const origin = new URL(request.url).origin;
  const names = outcome.kind === "signed" ? { projectTitle: outcome.projectTitle, clientName: outcome.clientName } : {};
  after(async () => {
    try {
      await completeExecutionFollowUp(origin, record, names);
    } catch (error) {
      // Recorded outcomes show what's missing; admin "Complete follow-up" resumes it.
      console.error(`Execution follow-up for ${proposalId} didn't finish:`, error);
    }
  });

  // The signer session stays until it expires: it lets the client download
  // the executed PDF straight away (it's bound to this agreement's hash).
  return clientJson({ success: true, signedAt: record.clientSignature?.signedAt });
}

export const POST = withRouteTelemetry<{ params: Promise<object> }, Response>("agreement client sign", (request) => handlePOST(request as NextRequest));
