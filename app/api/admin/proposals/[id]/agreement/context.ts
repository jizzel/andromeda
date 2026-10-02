import { getProposalSnapshot, readProposalAcceptance } from "@/lib/google-sheets";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";
import type { AgreementRecord, AgreementSnapshot } from "@/types/agreement";

/**
 * What an agreement is built on: the client's acceptance and the exact terms
 * they accepted (the snapshot stored at acceptance). The agreement
 * incorporates that snapshot — never the live proposal, which may be edited
 * after acceptance.
 */
export type AgreementBasis =
  | { ok: true; acceptance: ProposalAcceptance & { proposalVersion: string }; snapshot: ProposalDataUnion }
  | { ok: false; code: "not_accepted" | "not_versioned" | "snapshot_missing" | "unavailable"; error: string };

export async function loadAgreementBasis(proposalId: string): Promise<AgreementBasis> {
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
  let json: string | null;
  try {
    json = await getProposalSnapshot(proposalId, acceptance.proposalVersion);
  } catch (error) {
    console.error(`Agreement for ${proposalId}: snapshot unavailable:`, error);
    return { ok: false, code: "unavailable", error: "Couldn't read the accepted terms. Try again." };
  }
  if (!json || json === "[too large]") {
    return { ok: false, code: "snapshot_missing", error: "The accepted terms weren't stored for this version, so they can't be incorporated." };
  }
  return { ok: true, acceptance: acceptance as ProposalAcceptance & { proposalVersion: string }, snapshot: JSON.parse(json) as ProposalDataUnion };
}

export const clientNameOf = (snapshot: ProposalDataUnion) => snapshot.client?.name ?? "";

/** The immutable copy of a signed agreement (see `AgreementSnapshot`). */
export const agreementSnapshotJson = (record: AgreementRecord, clientName: string, templateText: string) =>
  JSON.stringify({ record, clientName, templateText, capturedAt: new Date().toISOString() } satisfies AgreementSnapshot);
