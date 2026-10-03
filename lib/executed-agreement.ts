import { readAgreement, readAgreementSnapshot } from "@/lib/google-sheets";
import { parseTemplate, type AgreementTemplate } from "@/lib/agreement-templates";
import { proposalVersion } from "@/lib/proposal-version";
import { agreementHash } from "@/lib/agreements";
import type { AgreementRecord, AgreementSnapshot } from "@/types/agreement";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";

export interface ExecutedAgreement {
  record: AgreementRecord;
  template: AgreementTemplate;
  proposal: ProposalDataUnion;
  /** The acceptance as signed (pinned in the record), for the proposal appendix. */
  acceptance: ProposalAcceptance;
}

/**
 * The executed agreement exactly as signed, rebuilt from its immutable
 * `client_signed` snapshot — the record with both signatures, the terms text
 * and the accepted proposal — never from the live record, repo or proposal.
 * Every part is re-verified: the agreement hash is recomputed from the stored
 * record (special terms, provider, selection, dates, client name, template
 * and proposal hashes) and must equal the live hash and the hash both
 * signatures cover; the terms text and the proposal must hash to what the
 * record pins. A tampered copy is refused. Null if not executed or not verifiable.
 * Server-only.
 */
export async function loadExecutedAgreement(proposalId: string): Promise<ExecutedAgreement | null> {
  const live = await readAgreement(proposalId);
  if (live?.status !== "executed" || !live.clientSignature) return null;
  const json = await readAgreementSnapshot(proposalId, live.agreementHash, live.clientSignature.signedAt);
  if (!json) return null;
  let snapshot: AgreementSnapshot;
  try {
    snapshot = JSON.parse(json) as AgreementSnapshot;
  } catch {
    return null;
  }
  const { record, templateText, proposalJson } = snapshot;
  if (record?.status !== "executed" || record.agreementHash !== live.agreementHash || !record.clientSignature || !record.providerSignature || !proposalJson) return null;
  const recomputed = agreementHash({ ...record, clientName: record.clientName || snapshot.clientName });
  if (recomputed !== record.agreementHash || record.providerSignature.agreementHash !== recomputed || record.clientSignature.agreementHash !== recomputed) return null;
  const template = parseTemplate(record.templateId, record.templateVersion, templateText);
  if (template.hash !== record.templateHash) return null;
  let proposal: ProposalDataUnion;
  try {
    proposal = JSON.parse(proposalJson) as ProposalDataUnion;
  } catch {
    return null;
  }
  if (proposalVersion(proposal) !== record.proposalVersion) return null;
  const acceptance: ProposalAcceptance = {
    status: "accepted",
    acceptedAt: record.acceptedAt ?? "",
    proposalVersion: record.proposalVersion,
    ...record.selection,
  };
  return { record, template, proposal, acceptance };
}
