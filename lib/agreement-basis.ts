import { getProposalSnapshot, readProposalAcceptance } from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import { loadTemplate, type AgreementTemplate } from "@/lib/agreement-templates";
import { agreementHash, sameSelection, selectionOf } from "@/lib/agreements";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";
import type { AgreementRecord, AgreementSnapshot } from "@/types/agreement";

/**
 * Shared by the admin agreement routes and the client signing routes: what an
 * agreement is built on, and the checks every signature (provider or client)
 * re-runs against storage before it's recorded. Server-only.
 */

/**
 * What an agreement is built on: the client's acceptance and the exact terms
 * they accepted (the snapshot stored at acceptance). The agreement
 * incorporates that snapshot — never the live proposal, which may be edited
 * after acceptance.
 */
export type AgreementBasis =
  | {
      ok: true;
      acceptance: ProposalAcceptance & { proposalVersion: string };
      snapshot: ProposalDataUnion;
      /** The snapshot exactly as stored (canonical JSON) — kept in the signed copy. */
      snapshotJson: string;
    }
  | { ok: false; code: "not_accepted" | "not_versioned" | "snapshot_missing" | "snapshot_mismatch" | "unavailable"; error: string };

type BasisFailure = Extract<AgreementBasis, { ok: false }>;

/** The client's acceptance, required to be accepted and versioned. One read; no snapshot. */
export async function loadAcceptedAcceptance(
  proposalId: string
): Promise<{ ok: true; acceptance: ProposalAcceptance & { proposalVersion: string } } | BasisFailure> {
  let acceptance: ProposalAcceptance | null;
  try {
    acceptance = await readProposalAcceptance(proposalId);
  } catch (error) {
    console.error(`Agreement for ${proposalId}: acceptance unavailable:`, error);
    return { ok: false, code: "unavailable", error: "Couldn't read the client's response. Try again." };
  }
  if (acceptance?.status !== "accepted") {
    return { ok: false, code: "not_accepted", error: "The client hasn't accepted this proposal yet. An agreement follows acceptance." };
  }
  if (!acceptance.proposalVersion) {
    return { ok: false, code: "not_versioned", error: "This acceptance predates proposal versions, so there's no exact version to incorporate." };
  }
  return { ok: true, acceptance: acceptance as ProposalAcceptance & { proposalVersion: string } };
}

/**
 * The exact accepted terms for a version, verified: the stored snapshot must
 * hash to that version (the version *is* the sha256 of those canonical
 * terms), so a deleted, corrupted or hand-edited snapshot is refused rather
 * than incorporated or signed. Fails closed.
 */
export async function loadVerifiedSnapshot(
  proposalId: string,
  version: string
): Promise<{ ok: true; snapshot: ProposalDataUnion; snapshotJson: string } | BasisFailure> {
  let json: string | null;
  try {
    json = await getProposalSnapshot(proposalId, version);
  } catch (error) {
    console.error(`Agreement for ${proposalId}: snapshot unavailable:`, error);
    return { ok: false, code: "unavailable", error: "Couldn't read the accepted terms. Try again." };
  }
  if (!json || json === "[too large]") {
    return { ok: false, code: "snapshot_missing", error: "The accepted terms weren't stored for this version, so they can't be incorporated." };
  }
  let snapshot: ProposalDataUnion;
  try {
    snapshot = JSON.parse(json) as ProposalDataUnion;
  } catch {
    return { ok: false, code: "snapshot_mismatch", error: "The accepted terms stored for this version are unreadable, so they can't be incorporated." };
  }
  if (proposalVersion(snapshot) !== version) {
    console.error(`Agreement for ${proposalId}: stored snapshot doesn't hash to ${version}`);
    return { ok: false, code: "snapshot_mismatch", error: "The accepted terms stored for this version were altered and no longer match the version the client accepted." };
  }
  return { ok: true, snapshot, snapshotJson: json };
}

/** The acceptance plus the verified accepted terms (snapshot) — what preparing an agreement needs. */
export async function loadAgreementBasis(proposalId: string): Promise<AgreementBasis> {
  const accepted = await loadAcceptedAcceptance(proposalId);
  if (!accepted.ok) return accepted;
  const verified = await loadVerifiedSnapshot(proposalId, accepted.acceptance.proposalVersion);
  if (!verified.ok) return verified;
  return { ok: true, acceptance: accepted.acceptance, snapshot: verified.snapshot, snapshotJson: verified.snapshotJson };
}

export const clientNameOf = (snapshot: ProposalDataUnion) => snapshot.client?.name ?? "";

/** The immutable copy of a signed agreement (see `AgreementSnapshot`), self-contained: terms text and the incorporated proposal. */
export const agreementSnapshotJson = (record: AgreementRecord, clientName: string, templateText: string, proposalJson: string) =>
  JSON.stringify({ record, clientName, templateText, proposalJson, capturedAt: new Date().toISOString() } satisfies AgreementSnapshot);

export type SigningFailure =
  | { ok: false; kind: "basis"; basis: BasisFailure }
  | { ok: false; kind: "stale" | "stale_selection" | "stale_acceptance" | "template_changed" };

export interface SigningBasis {
  ok: true;
  template: AgreementTemplate;
  snapshot: ProposalDataUnion;
  snapshotJson: string;
  /** The record's pinned client name (or, on records prepared before it was pinned, the snapshot's). */
  clientName: string;
  agreementHash: string;
}

/**
 * Re-derives a record from storage before anyone signs it: the client's
 * acceptance must still be accepted at the same version, with the same
 * selection and date; the accepted snapshot must still hash to that version;
 * the terms file must still hash to the pinned one; and the agreement hash
 * recomputed from all of that must equal both the stored hash and the hash
 * the signer was shown. Anything that moved is refused, never signed blind.
 */
export async function verifySigningBasis(record: AgreementRecord, shownHash: string): Promise<SigningBasis | SigningFailure> {
  const accepted = await loadAcceptedAcceptance(record.proposalId);
  if (!accepted.ok) return { ok: false, kind: "basis", basis: accepted };
  if (accepted.acceptance.proposalVersion !== record.proposalVersion) return { ok: false, kind: "stale" };
  // The chosen package / plan are part of what's signed: a corrected acceptance must be reviewed first.
  if (!sameSelection(record.selection ?? {}, selectionOf(accepted.acceptance))) return { ok: false, kind: "stale_selection" };
  // The acceptance date is shown in Schedule 2 and signed: it must be pinned
  // (older drafts: re-save) and still match the acceptance.
  if (!record.acceptedAt || record.acceptedAt !== accepted.acceptance.acceptedAt) return { ok: false, kind: "stale_acceptance" };
  // The incorporated terms are re-read and verified on every signature, so a
  // deleted or hand-edited snapshot can never sit under one.
  const verified = await loadVerifiedSnapshot(record.proposalId, record.proposalVersion);
  if (!verified.ok) return { ok: false, kind: "basis", basis: verified };
  const clientName = record.clientName || clientNameOf(verified.snapshot);
  if (clientName !== clientNameOf(verified.snapshot)) return { ok: false, kind: "stale" };
  const template = loadTemplate(record.templateId, record.templateVersion);
  if (!template || template.hash !== record.templateHash) return { ok: false, kind: "template_changed" };
  const recomputed = agreementHash({ ...record, clientName });
  if (recomputed !== record.agreementHash || recomputed !== shownHash) return { ok: false, kind: "stale" };
  return { ok: true, template, snapshot: verified.snapshot, snapshotJson: verified.snapshotJson, clientName, agreementHash: recomputed };
}

/** HTTP status and body for a failed signing check. `who` words the advice for the admin or the client. */
export function signingFailureResponse(failure: SigningFailure, who: "provider" | "client"): { status: number; body: Record<string, unknown> } {
  const admin = who === "provider";
  switch (failure.kind) {
    case "basis":
      return {
        status: failure.basis.code === "unavailable" ? 503 : 409,
        body: { success: false, code: failure.basis.code, error: admin ? failure.basis.error : "This agreement can't be signed right now. Joseph has been asked to check it." },
      };
    case "template_changed":
      return {
        status: 409,
        body: { success: false, code: "template_changed", error: admin ? "The terms file changed since this agreement was prepared. Re-save the agreement to pin the current text, review it, then sign." : "Your agreement is being updated. Joseph will send you the current version shortly." },
      };
    case "stale_selection":
      return {
        status: 409,
        body: { success: false, code: "stale", error: admin ? "The client's recorded package or payment plan changed since this agreement was prepared. Save the draft again to review it, then sign." : "This agreement has changed since it was sent to you. Reload to review the current version." },
      };
    case "stale_acceptance":
      return {
        status: 409,
        body: { success: false, code: "stale", error: admin ? "The acceptance date isn't pinned in this agreement, or it changed since the agreement was prepared. Save the draft again to review it, then sign." : "This agreement has changed since it was sent to you. Reload to review the current version." },
      };
    default:
      return {
        status: 409,
        body: { success: false, code: "stale", error: admin ? "The agreement changed since you previewed it. Reload and review before signing." : "This agreement has changed since you opened it. Reload to review the current version." },
      };
  }
}
