import type { NextRequest } from "next/server";
import { withRouteTelemetry } from "@/lib/sheets-telemetry";
import { isAdminRequest, isSameOrigin, requestMeta } from "@/lib/admin-auth";
import { appendEngagementEvent, readAgreement, saveAgreementSnapshot, SheetLockExpiredError, withProposalLock, writeAgreement } from "@/lib/google-sheets";
import { namesMatch, offerClosed } from "@/lib/agreements";
import { agreementSnapshotJson, signingFailureResponse, verifySigningBasis } from "@/lib/agreement-basis";
import { PROVIDER_SIGNING_DECLARATION } from "@/constants/agreement";
import { isProviderSigned, type AgreementRecord } from "@/types/agreement";
import { busy, json, readJsonBody } from "../../edit";

type Params = { params: Promise<{ id: string }> };

/**
 * "Sign as Service Provider". Re-derives the agreement from what's stored —
 * the template file on disk (its hash must still be the pinned one), the
 * accepted snapshot, the provider block, special terms and offer window — and
 * signs only if that equals both the stored hash and the hash Joseph was
 * shown. Anything that moved in between is refused, never signed blind.
 */
async function handlePOST(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);
  const typedName = typeof body.typedName === "string" ? body.typedName : "";
  const shownHash = typeof body.agreementHash === "string" ? body.agreementHash : "";
  if (body.declaration !== true) return json({ success: false, code: "invalid", error: "Confirm the declaration to sign." }, 400);
  const meta = requestMeta(request);

  const locked = await withProposalLock(id, async (lock) => {
    const record = await readAgreement(id);
    if (!record) return { kind: "not_found" } as const;
    if (isProviderSigned(record.status)) return { kind: "already_signed", record } as const;
    if (!namesMatch(typedName, record.provider.name)) return { kind: "name" } as const;
    if (offerClosed(record.offerValidUntil)) return { kind: "offer_expired" } as const;
    const basis = await verifySigningBasis(record, shownHash);
    if (!basis.ok) return { kind: "failed", failure: basis } as const;
    const { template, clientName, agreementHash: recomputed } = basis;

    const signedAt = new Date().toISOString();
    const signed: AgreementRecord = {
      ...record,
      clientName, // pins it on legacy records too
      status: "provider_signed",
      providerSignature: { typedName: typedName.trim(), declaration: PROVIDER_SIGNING_DECLARATION, signedAt, agreementHash: recomputed, ...meta },
      updatedAt: signedAt,
    };
    // Evidence first: the immutable copy is stored before the signed record,
    // and if it can't be, nothing is signed.
    try {
      await saveAgreementSnapshot(id, recomputed, signedAt, "provider_signed", agreementSnapshotJson(signed, clientName, template.raw, basis.snapshotJson), lock);
    } catch (error) {
      if (error instanceof SheetLockExpiredError) throw error;
      console.error(`Agreement snapshot for ${id}@${recomputed} failed:`, error);
      return { kind: "snapshot_failed" } as const;
    }
    await writeAgreement(signed, lock);
    await appendEngagementEvent(
      {
        proposalId: id,
        event: "agreement_provider_signed",
        proposalVersion: record.proposalVersion,
        detail: { agreementHash: recomputed, snapshot: { agreementHash: recomputed, signedAt }, selection: record.selection, templateHash: record.templateHash, template: `${record.templateId}@${record.templateVersion}`, typedName: typedName.trim(), offerValidUntil: record.offerValidUntil },
        ...meta,
      },
      lock
    );
    return { kind: "signed", record: signed } as const;
  });

  if (locked.status === "busy") return busy();
  const outcome = locked.value;
  switch (outcome.kind) {
    case "not_found":
      return json({ success: false, error: "Prepare the agreement before signing it." }, 404);
    case "already_signed":
      return json({ success: false, code: "already_signed", error: "You've already signed this agreement.", agreement: outcome.record }, 409);
    case "name":
      return json({ success: false, code: "name", error: "Type your full name exactly as it appears on the agreement." }, 400);
    case "offer_expired":
      return json({ success: false, code: "offer_expired", error: "The offer window has passed — set a new 'valid until' date first." }, 400);
    case "failed": {
      const { status, body } = signingFailureResponse(outcome.failure, "provider");
      return json(body, status);
    }
    case "snapshot_failed":
      return json({ success: false, code: "snapshot_failed", error: "Couldn't store the signed copy, so nothing was signed. Try again." }, 503);
    default:
      return json({ success: true, agreement: outcome.record });
  }
}

export const POST = withRouteTelemetry<Params, Response>("agreement sign", (request, ctx) => handlePOST(request as NextRequest, ctx));
