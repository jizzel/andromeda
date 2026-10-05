import type { NextRequest } from "next/server";
import { withRouteTelemetry } from "@/lib/sheets-telemetry";
import { isAdminRequest, isSameOrigin, requestMeta } from "@/lib/admin-auth";
import { appendEngagementEvent, getProposalById, readAgreement, readProposalEngagementEvents, withProposalLock, writeAgreement } from "@/lib/google-sheets";
import { clientTitleOf, loadTemplate } from "@/lib/agreement-templates";
import { offerClosed } from "@/lib/agreements";
import { signingFailureResponse, verifySigningBasis } from "@/lib/agreement-basis";
import { CLIENT_SIGNING_OFF_REASON, clientSigningAllowed } from "@/lib/agreement-gate";
import { DuplicateEmailError, sendAgreementReady } from "@/lib/email";
import type { AgreementRecord } from "@/types/agreement";
import { busy, json, readJsonBody } from "../../edit";

type Params = { params: Promise<{ id: string }> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Send to client": emails the signing link for the provider-signed agreement
 * to the proposal's saved `client.email` (never an address from the request).
 * Under the proposal lock it re-verifies the agreement exactly as signing
 * does, records `sent` and the `agreement_sent` event; the email goes after
 * the lock is released and its outcome is its own event. `resend` sends the
 * link again for an agreement that's already out.
 *
 * Delivery can't be skipped by a partial failure: once `sent` is written the
 * event is best-effort (the email still goes out), and if a request died
 * between the commit and the email, repeating it delivers the pending email
 * with the original idempotency key (built from the stored `sentAt` and
 * recipient) — Resend drops it if the first one did go out. Only a recorded
 * delivery answers `already_sent`.
 */
async function handlePOST(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);
  const shownHash = typeof body.agreementHash === "string" ? body.agreementHash : "";
  const resend = body.resend === true;
  const meta = requestMeta(request);

  const locked = await withProposalLock(id, async (lock) => {
    const record = await readAgreement(id);
    if (!record) return { kind: "not_found" } as const;
    if (record.status === "executed") return { kind: "executed" } as const;
    if (record.status === "draft" || !record.providerSignature) return { kind: "not_signed" } as const;
    if (!clientSigningAllowed(loadTemplate(record.templateId, record.templateVersion))) return { kind: "gated" } as const;
    if (offerClosed(record.offerValidUntil)) return { kind: "offer_expired" } as const;
    if (record.providerSignature.agreementHash !== record.agreementHash) return { kind: "stale_signature" } as const;
    const basis = await verifySigningBasis(record, shownHash);
    if (!basis.ok) return { kind: "failed", failure: basis } as const;

    const proposal = await getProposalById(id);
    if (!proposal?.isActive) return { kind: "inactive" } as const;
    const to = proposal.data.client?.email?.trim() ?? "";
    if (!EMAIL_RE.test(to)) return { kind: "no_email" } as const;

    const names = { clientName: basis.clientName, projectTitle: basis.snapshot.title };

    if (record.status === "sent" && !resend) {
      // Already out: done if its email is recorded as delivered; otherwise the
      // earlier request didn't finish — deliver that same send now.
      const sentAt = record.sentAt ?? record.updatedAt;
      const delivered = (await readProposalEngagementEvents(id)).some(
        (e) => e.event === "agreement_send_email" && e.detail.agreementHash === record.agreementHash && e.detail.sentAt === sentAt && e.detail.status === "sent"
      );
      if (delivered) return { kind: "already_sent", record } as const;
      return { kind: "sent", record, to, sentAt, recovered: true, ...names } as const;
    }

    const sentAt = new Date().toISOString();
    const sent: AgreementRecord = { ...record, status: "sent", sentAt, updatedAt: sentAt };
    await writeAgreement(sent, lock);
    // Committed: from here the email must go out, whatever happens to the audit write.
    try {
      await appendEngagementEvent(
        { proposalId: id, event: "agreement_sent", proposalVersion: record.proposalVersion, detail: { agreementHash: record.agreementHash, to, sentAt, resend }, ...meta },
        lock
      );
    } catch (error) {
      console.error(`Agreement for ${id} marked sent, but the event couldn't be recorded (sending anyway):`, error);
    }
    return { kind: "sent", record: sent, to, sentAt, recovered: false, ...names } as const;
  });

  if (locked.status === "busy") return busy();
  const outcome = locked.value;
  switch (outcome.kind) {
    case "not_found":
      return json({ success: false, error: "Prepare and sign the agreement first." }, 404);
    case "executed":
      return json({ success: false, code: "executed", error: "The client has already signed this agreement." }, 409);
    case "not_signed":
      return json({ success: false, code: "not_signed", error: "Sign the agreement before sending it to the client." }, 409);
    case "already_sent":
      return json({ success: false, code: "already_sent", error: "The signing link has already been sent.", agreement: outcome.record }, 409);
    case "gated":
      return json({ success: false, code: "client_signing_off", error: CLIENT_SIGNING_OFF_REASON }, 409);
    case "offer_expired":
      return json({ success: false, code: "offer_expired", error: "The offer window has passed — edit the agreement to set a new date, then sign and send it." }, 400);
    case "stale_signature":
      return json({ success: false, code: "stale", error: "Your signature doesn't cover this version of the agreement. Re-sign it before sending." }, 409);
    case "inactive":
      return json({ success: false, code: "inactive", error: "The proposal is inactive, so the client can't open the agreement. Activate it first." }, 409);
    case "no_email":
      return json({ success: false, code: "no_email", error: "Add the client's email address in the proposal settings first." }, 400);
    case "failed": {
      const { status, body: failure } = signingFailureResponse(outcome.failure, "provider");
      return json(failure, status);
    }
  }

  // The link is recorded as sent; now the email, then its outcome.
  let email: "sent" | "failed" = "sent";
  let error: string | undefined;
  let deduplicated = false;
  try {
    await sendAgreementReady({
      to: outcome.to,
      clientName: outcome.clientName,
      proposalId: id,
      projectTitle: outcome.projectTitle,
      documentTitle: clientTitleOf(outcome.record),
      offerValidUntil: outcome.record.offerValidUntil,
      // Stable for this send (its stored sentAt) and recipient: a recovered delivery reuses it.
      idempotencyKey: `agreement-send:${id}:${outcome.record.agreementHash}:${outcome.sentAt}:${outcome.to}`,
    });
  } catch (sendError) {
    if (sendError instanceof DuplicateEmailError) {
      deduplicated = true; // the earlier attempt with this key was delivered
    } else {
      console.error(`Agreement link email for ${id} failed:`, sendError);
      email = "failed";
      error = sendError instanceof Error ? sendError.message.slice(0, 300) : "Unknown error";
    }
  }
  try {
    await appendEngagementEvent({
      proposalId: id,
      event: "agreement_send_email",
      proposalVersion: outcome.record.proposalVersion,
      detail: {
        agreementHash: outcome.record.agreementHash,
        sentAt: outcome.sentAt,
        to: outcome.to,
        status: email,
        ...(outcome.recovered && { recovered: true }),
        ...(deduplicated && { deduplicated: true }),
        ...(error && { error }),
      },
      ...meta,
    });
  } catch (eventError) {
    console.error(`Couldn't record the agreement link email outcome for ${id}:`, eventError);
  }
  return json({ success: true, agreement: outcome.record, email, ...(error && { error }) });
}

export const POST = withRouteTelemetry<Params, Response>("agreement send", (request, ctx) => handlePOST(request as NextRequest, ctx));
