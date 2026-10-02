import { getProposalSnapshot, readProposalAcceptance } from "@/lib/google-sheets";
import { proposalVersion } from "@/lib/proposal-version";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";
import type { AgreementRecord, AgreementSnapshot } from "@/types/agreement";

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
    return { ok: false, code: "not_accepted", error: "The client hasn't accepted this proposal yet — an agreement follows acceptance." };
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
    return { ok: false, code: "snapshot_mismatch", error: "The accepted terms stored for this version were altered — they no longer match the version the client accepted." };
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
