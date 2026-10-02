import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin, requestMeta } from "@/lib/admin-auth";
import { appendEngagementEvent, readAgreement, readAgreementSnapshot, saveAgreementSnapshot, withProposalLock, writeAgreement } from "@/lib/google-sheets";
import { latestTemplate, listTemplates, loadTemplate } from "@/lib/agreement-templates";
import { agreementHash, draftProblems, newSpecialTermId, resolveProvider, selectionOf } from "@/lib/agreements";
import { agreementProvider } from "@/constants/agreement";
import type { AgreementRecord, ContractAs, SpecialTerm } from "@/types/agreement";
import { busy, json, readJsonBody } from "../edit";
import { agreementSnapshotJson, clientNameOf, loadAgreementBasis } from "./context";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  const { id } = await params;
  let agreement: AgreementRecord | null;
  try {
    agreement = await readAgreement(id);
  } catch (error) {
    console.error(`Agreement GET for ${id}:`, error);
    return json({ success: false, error: "Couldn't read the agreement. Try again." }, 503);
  }
  const basis = await loadAgreementBasis(id);
  return json({
    success: true,
    agreement,
    basis: basis.ok ? { proposalVersion: basis.acceptance.proposalVersion, acceptedAt: basis.acceptance.acceptedAt } : { code: basis.code, error: basis.error },
    templates: listTemplates(),
    tradingNameAvailable: !!agreementProvider.tradingName,
  });
}

/**
 * Create or update the draft agreement. Everything runs under the proposal
 * lock (shared with saves, publishing and client responses) and checks
 * `expectedUpdatedAt`, so two tabs can't overwrite each other. Changing a
 * provider-signed agreement voids the signature — only with `voidSignature`.
 */
export async function PUT(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;
  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);

  const template =
    typeof body.templateVersion === "number" ? loadTemplate("general-service-agreement", body.templateVersion) : latestTemplate();
  if (!template) return json({ success: false, code: "invalid", error: "Unknown template version" }, 400);
  const contractAs: ContractAs = body.contractAs === "trading" ? "trading" : "individual";
  const specialTerms: SpecialTerm[] = Array.isArray(body.specialTerms)
    ? (body.specialTerms as unknown[]).map((t) => {
        const term = (t ?? {}) as Partial<SpecialTerm>;
        return {
          id: typeof term.id === "string" && /^st-[0-9a-f]{8}$/.test(term.id) ? term.id : newSpecialTermId(),
          clause: typeof term.clause === "string" ? term.clause.trim() : "",
          text: typeof term.text === "string" ? term.text.trim() : "",
        };
      })
    : [];
  const offerValidUntil = typeof body.offerValidUntil === "string" ? body.offerValidUntil : "";
  const problems = draftProblems(template, specialTerms, offerValidUntil);
  if (problems.length) return json({ success: false, code: "invalid", errors: problems }, 400);
  const expectedUpdatedAt = typeof body.expectedUpdatedAt === "string" ? body.expectedUpdatedAt : null;
  const meta = requestMeta(request);

  const locked = await withProposalLock(id, async (lock) => {
    const basis = await loadAgreementBasis(id);
    if (!basis.ok) return { kind: "basis", basis } as const;
    const current = await readAgreement(id);
    if ((current?.updatedAt ?? null) !== expectedUpdatedAt) return { kind: "conflict", current } as const;

    const fields = {
      proposalId: id,
      templateId: template.id,
      templateVersion: template.version,
      templateHash: template.hash,
      proposalVersion: basis.acceptance.proposalVersion,
      selection: selectionOf(basis.acceptance),
      acceptedAt: basis.acceptance.acceptedAt,
      provider: resolveProvider(contractAs),
      specialTerms,
      offerValidUntil,
    };
    const hash = agreementHash({ ...fields, clientName: clientNameOf(basis.snapshot) });
    if (current && current.agreementHash === hash) return { kind: "unchanged", record: current } as const;

    if (current?.status === "provider_signed") {
      if (body.voidSignature !== true) return { kind: "signed", current } as const;
      // The signed document must survive its replacement: make sure its
      // snapshot exists (signing writes it; this covers a record signed
      // before snapshots, or a lost write) before the record is overwritten.
      // This exact signature (hash + signedAt): the same content may have been signed before.
      const signedAt = current.providerSignature?.signedAt ?? current.updatedAt;
      if (!(await readAgreementSnapshot(id, current.agreementHash, signedAt))) {
        const pinned = loadTemplate(current.templateId, current.templateVersion);
        const text = pinned && pinned.hash === current.templateHash ? pinned.raw : "";
        await saveAgreementSnapshot(id, current.agreementHash, signedAt, "provider_signed", agreementSnapshotJson(current, clientNameOf(basis.snapshot), text), lock);
      }
      await appendEngagementEvent(
        {
          proposalId: id,
          event: "agreement_signature_voided",
          proposalVersion: current.proposalVersion,
          detail: { voidedHash: current.agreementHash, signedAt, snapshot: { agreementHash: current.agreementHash, signedAt } },
          ...meta,
        },
        lock
      );
    }

    const record: AgreementRecord = { ...fields, status: "draft", agreementHash: hash, providerSignature: null, updatedAt: new Date().toISOString() };
    await writeAgreement(record, lock);
    await appendEngagementEvent(
      {
        proposalId: id,
        event: current ? "agreement_updated" : "agreement_prepared",
        proposalVersion: record.proposalVersion,
        detail: { agreementHash: hash, template: `${template.id}@${template.version}`, templateHash: template.hash, contractAs: record.provider.contractAs, specialTerms: specialTerms.length, offerValidUntil },
        ...meta,
      },
      lock
    );
    return { kind: "saved", record } as const;
  });

  if (locked.status === "busy") return busy();
  const outcome = locked.value;
  switch (outcome.kind) {
    case "basis":
      return json({ success: false, code: outcome.basis.code, error: outcome.basis.error }, outcome.basis.code === "unavailable" ? 503 : 409);
    case "conflict":
      return json({ success: false, code: "conflict", error: "The agreement changed since you opened it.", current: outcome.current }, 409);
    case "signed":
      return json({ success: false, code: "signed", error: "You've signed this agreement. Saving changes voids your signature — confirm to continue.", current: outcome.current }, 409);
    default:
      return json({ success: true, agreement: outcome.record, unchanged: outcome.kind === "unchanged" });
  }
}
