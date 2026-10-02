import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin, requestMeta } from "@/lib/admin-auth";
import { appendEngagementEvent, readAgreement, saveAgreementSnapshot, SheetLockExpiredError, withProposalLock, writeAgreement } from "@/lib/google-sheets";
import { loadTemplate } from "@/lib/agreement-templates";
import { agreementHash, namesMatch, sameSelection, selectionOf } from "@/lib/agreements";
import { PROVIDER_SIGNING_DECLARATION } from "@/constants/agreement";
import type { AgreementRecord } from "@/types/agreement";
import { busy, json, readJsonBody } from "../../edit";
import { agreementSnapshotJson, clientNameOf, loadAgreementBasis } from "../context";

type Params = { params: Promise<{ id: string }> };

/**
 * "Sign as Service Provider". Re-derives the agreement from what's stored —
 * the template file on disk (its hash must still be the pinned one), the
 * accepted snapshot, the provider block, special terms and offer window — and
 * signs only if that equals both the stored hash and the hash Joseph was
 * shown. Anything that moved in between is refused, never signed blind.
 */
export async function POST(request: NextRequest, { params }: Params) {
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
    if (record.status === "provider_signed") return { kind: "already_signed", record } as const;
    if (!namesMatch(typedName, record.provider.name)) return { kind: "name" } as const;
    if (new Date() > new Date(record.offerValidUntil)) return { kind: "offer_expired" } as const;

    const basis = await loadAgreementBasis(id);
    if (!basis.ok) return { kind: "basis", basis } as const;
    if (basis.acceptance.proposalVersion !== record.proposalVersion) return { kind: "stale" } as const;
    // The chosen package / plan are part of what's signed: a corrected acceptance must be reviewed first.
    if (!sameSelection(record.selection ?? {}, selectionOf(basis.acceptance))) return { kind: "stale_selection" } as const;
    const template = loadTemplate(record.templateId, record.templateVersion);
    if (!template || template.hash !== record.templateHash) return { kind: "template_changed" } as const;
    const recomputed = agreementHash({ ...record, clientName: clientNameOf(basis.snapshot) });
    if (recomputed !== record.agreementHash || recomputed !== shownHash) return { kind: "stale" } as const;

    const signedAt = new Date().toISOString();
    const signed: AgreementRecord = {
      ...record,
      status: "provider_signed",
      providerSignature: { typedName: typedName.trim(), declaration: PROVIDER_SIGNING_DECLARATION, signedAt, agreementHash: recomputed, ...meta },
      updatedAt: signedAt,
    };
    // Evidence first: the immutable copy is stored before the signed record,
    // and if it can't be, nothing is signed.
    try {
      await saveAgreementSnapshot(id, recomputed, "provider_signed", agreementSnapshotJson(signed, clientNameOf(basis.snapshot), template.raw), lock);
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
        detail: { agreementHash: recomputed, snapshot: recomputed, selection: record.selection, templateHash: record.templateHash, template: `${record.templateId}@${record.templateVersion}`, typedName: typedName.trim(), offerValidUntil: record.offerValidUntil },
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
    case "basis":
      return json({ success: false, code: outcome.basis.code, error: outcome.basis.error }, outcome.basis.code === "unavailable" ? 503 : 409);
    case "template_changed":
      return json({ success: false, code: "template_changed", error: "The terms file changed since this agreement was prepared. Re-save the agreement to pin the current text, review it, then sign." }, 409);
    case "stale":
      return json({ success: false, code: "stale", error: "The agreement changed since you previewed it. Reload and review before signing." }, 409);
    case "stale_selection":
      return json({ success: false, code: "stale", error: "The client's recorded package or payment plan changed since this agreement was prepared. Save the draft again to review it, then sign." }, 409);
    case "snapshot_failed":
      return json({ success: false, code: "snapshot_failed", error: "Couldn't store the signed copy, so nothing was signed. Try again." }, 503);
    default:
      return json({ success: true, agreement: outcome.record });
  }
}
