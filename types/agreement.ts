/**
 * Native agreements (roadmap mid-term #3): the General Service Agreement
 * template + per-engagement Special Terms + the accepted proposal version,
 * signed first by the Service Provider and then (PR 2) by the Client.
 * One record per proposal in the `Agreements` sheet tab.
 */

/** `draft` → `provider_signed`; PR 2 adds the client side (`executed`, …). */
export type AgreementStatus = "draft" | "provider_signed";

/** Whether the provider contracts in their own name or under the trading name. */
export type ContractAs = "individual" | "trading";

/** The provider block printed on the agreement, frozen into the record when prepared. */
export interface ProviderIdentity {
  contractAs: ContractAs;
  name: string;
  role: string;
  /** Only when `contractAs` is "trading". */
  tradingName?: string;
  address: string;
  email: string;
}

/** A per-engagement variation of a named clause of the base terms (Schedule 1). */
export interface SpecialTerm {
  id: string;
  /** Clause or paragraph number in the pinned template, e.g. "6" or "6.2". */
  clause: string;
  text: string;
}

export interface ProviderSignature {
  typedName: string;
  /** The declaration text the provider confirmed, verbatim. */
  declaration: string;
  signedAt: string;
  /** The agreement hash that was signed. */
  agreementHash: string;
  ip: string;
  userAgent: string;
}

/** The client's chosen options, pinned from the acceptance when the agreement is prepared. */
export interface AgreementSelection {
  packageId?: string;
  paymentPlanId?: string;
}

export interface AgreementRecord {
  proposalId: string;
  status: AgreementStatus;
  templateId: string;
  templateVersion: number;
  /** sha256 of the template file's exact bytes. */
  templateHash: string;
  /** The proposal version the client accepted; the agreement incorporates that snapshot. */
  proposalVersion: string;
  /** Which of the version's packages / payment plans the client chose (Schedule 2). */
  selection: AgreementSelection;
  /**
   * When the client accepted, pinned from the acceptance at prepare time
   * (shown in Schedule 2, part of the hash). Absent on records prepared
   * before it was pinned: those must be re-saved before signing.
   */
  acceptedAt?: string;
  /**
   * The client's name from the accepted snapshot, pinned when prepared (part
   * of the hash). Empty on records prepared before it was stored — signing
   * those falls back to reading the snapshot.
   */
  clientName: string;
  provider: ProviderIdentity;
  specialTerms: SpecialTerm[];
  /** YYYY-MM-DD: how long the provider-signed offer stays open for the client. */
  offerValidUntil: string;
  /** Hash of everything the parties sign (see `agreementHash` in `lib/agreements.ts`). */
  agreementHash: string;
  providerSignature: ProviderSignature | null;
  updatedAt: string;
}

/**
 * Immutable copy of a signed agreement (`AgreementSnapshots` tab), written
 * before the signed record so the signed document can always be rebuilt —
 * even after a later edit voids the signature and replaces the record.
 */
export interface AgreementSnapshot {
  record: AgreementRecord;
  clientName: string;
  /** The terms file's exact text at signing (its sha256 is `record.templateHash`). */
  templateText: string;
  capturedAt: string;
}
