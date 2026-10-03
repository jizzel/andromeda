/**
 * Native agreements (roadmap mid-term #3): the General Service Agreement
 * template + per-engagement Special Terms + the accepted proposal version,
 * signed first by the Service Provider and then by the Client.
 * One record per proposal in the `Agreements` sheet tab.
 */

/**
 * `draft` → `provider_signed` (Joseph signed: the offer) → `sent` (the client
 * has been emailed the signing link) → `executed` (the client signed: the
 * contract is formed, §30.1). Editing a provider-signed or sent agreement
 * voids the signature (back to `draft`); an executed one can't be edited.
 */
export type AgreementStatus = "draft" | "provider_signed" | "sent" | "executed";

export const AGREEMENT_STATUSES: readonly AgreementStatus[] = ["draft", "provider_signed", "sent", "executed"];

/** Whether the provider's signature is on the current record (the offer stands). */
export const isProviderSigned = (status: AgreementStatus) => status !== "draft";

/**
 * The provider always contracts in Joseph's own name. "trading" only appears
 * on records prepared before the organisation option replaced it (rendered
 * as they were signed: "…, trading as X").
 */
export type ContractAs = "individual" | "trading";

/** The provider block printed on the agreement, frozen into the record when prepared. */
export interface ProviderIdentity {
  contractAs: ContractAs;
  name: string;
  role: string;
  /** Legacy: only on records with `contractAs` "trading". */
  tradingName?: string;
  /** The organisation Joseph works with on this engagement, shown after his role ("…, Software Engineer, Avengh"). Not a party. */
  organisation?: string;
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

/**
 * The client's signature (§29.3–29.4): who signed, in what capacity, the
 * declaration they confirmed (verbatim from the pinned template), and how
 * their control of the client email address was verified. Not part of
 * `agreementHash` — the hash is what both parties sign.
 */
export interface ClientSignature {
  legalName: string;
  /** Empty when signing as an individual. */
  organisation: string;
  /** e.g. "Director"; empty when signing as an individual. */
  capacity: string;
  /** The address the one-time code was sent to (from the proposal data). */
  email: string;
  /** The template's §29.3 declaration, verbatim. */
  declarationText: string;
  signedAt: string;
  agreementHash: string;
  ip: string;
  userAgent: string;
  /** The one-time code challenge this signer redeemed, and when. */
  verification: { nonce: string; verifiedAt: string };
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
  /** When the signing link was (last) emailed to the client; set while `sent` or `executed`. */
  sentAt?: string;
  /** Set once `executed`. */
  clientSignature: ClientSignature | null;
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
  /**
   * The incorporated proposal (Schedule 2) exactly as stored for the accepted
   * version — its sha256 is `record.proposalVersion` — so the signed document
   * stays rebuildable even if `ProposalSnapshots` is later edited or lost.
   * Absent on snapshots written before it was kept.
   */
  proposalJson?: string;
  capturedAt: string;
}

/**
 * What happened to the current agreement after Joseph signed it, folded from
 * its `EngagementEvents` (see `foldAgreementActivity`): signing-link emails,
 * the client's change requests, the executed-copy emails and onboarding.
 */
export interface AgreementActivity {
  /** Signing-link sends for the current agreement hash, oldest first. */
  sends: { sentAt: string; to: string; email: "sent" | "failed" | "pending"; error?: string }[];
  /** Change requests made against the current agreement hash, oldest first. */
  changeRequests: { at: string; note: string }[];
  /** Latest executed-copy email outcome per recipient. */
  executedEmails: { recipient: "client" | "provider"; status: "sent" | "failed"; attached: boolean; at: string; error?: string }[];
  /** Onboarding after execution; null until recorded. */
  onboarding: { assets: "unlocked" | "already" | "no_assets" | "failed"; tracker: "done" | "already" | "not_seeded" | "no_milestone" | "failed"; at: string } | null;
}
