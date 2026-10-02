import { createHash, randomBytes } from "crypto";
import { agreementProvider, MAX_SPECIAL_TERM_CHARS, MAX_SPECIAL_TERMS, OFFER_VALID_DAYS } from "@/constants/agreement";
import { isoDate } from "@/lib/dates";
import type { AgreementRecord, ContractAs, ProviderIdentity, SpecialTerm } from "@/types/agreement";
import type { AgreementTemplate } from "@/lib/agreement-templates";

/** The provider block for a "contract as" choice, from config. */
export function resolveProvider(contractAs: ContractAs): ProviderIdentity {
  const trading = contractAs === "trading" && !!agreementProvider.tradingName;
  return {
    contractAs: trading ? "trading" : "individual",
    name: agreementProvider.legalName,
    role: agreementProvider.role,
    ...(trading && { tradingName: agreementProvider.tradingName }),
    address: agreementProvider.address,
    email: agreementProvider.email,
  };
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, sortKeysDeep((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

export type AgreementHashInput = Pick<
  AgreementRecord,
  "proposalId" | "templateId" | "templateVersion" | "templateHash" | "proposalVersion" | "selection" | "provider" | "specialTerms" | "offerValidUntil"
> & { clientName: string };

/**
 * What the parties sign, as one id: the exact template text (by hash), the
 * accepted proposal version and the client's chosen package / payment plan,
 * the provider block, the special terms and the offer window. Preview, signing and (PR 2) the client side and PDF all use
 * this one function, so "the agreement" always means the same thing.
 */
export function agreementHash(input: AgreementHashInput): string {
  const canonical = JSON.stringify(
    sortKeysDeep({
      proposalId: input.proposalId,
      clientName: input.clientName,
      template: { id: input.templateId, version: input.templateVersion, hash: input.templateHash },
      proposalVersion: input.proposalVersion,
      // The version fixes the options offered; the selection fixes which ones the client took.
      selection: { packageId: input.selection?.packageId ?? null, paymentPlanId: input.selection?.paymentPlanId ?? null },
      provider: input.provider,
      specialTerms: input.specialTerms.map(({ clause, text }) => ({ clause, text })),
      offerValidUntil: input.offerValidUntil,
    })
  );
  return createHash("sha256").update(canonical).digest("hex");
}

export const newSpecialTermId = () => `st-${randomBytes(4).toString("hex")}`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Validates special terms and the offer date against the pinned template. */
export function draftProblems(template: AgreementTemplate, specialTerms: SpecialTerm[], offerValidUntil: string, now = new Date()): string[] {
  const problems: string[] = [];
  const known = new Set(template.clauses.map((c) => c.number));
  if (specialTerms.length > MAX_SPECIAL_TERMS) problems.push(`At most ${MAX_SPECIAL_TERMS} special terms`);
  specialTerms.forEach((term, i) => {
    if (!known.has(term.clause)) problems.push(`Special term ${i + 1}: clause "${term.clause}" isn't in ${template.title} v${template.version}`);
    if (!term.text.trim()) problems.push(`Special term ${i + 1}: the text is empty`);
    if (term.text.length > MAX_SPECIAL_TERM_CHARS) problems.push(`Special term ${i + 1}: over ${MAX_SPECIAL_TERM_CHARS} characters`);
  });
  if (!DATE_RE.test(offerValidUntil) || isNaN(new Date(offerValidUntil).getTime())) problems.push("Offer valid until must be a date (YYYY-MM-DD)");
  // Same rule as proposal offers: an offer closes at the start of its date (UTC).
  else if (now > new Date(offerValidUntil)) problems.push("Offer valid until must be in the future");
  return problems;
}

/** Typed-name check for signing: case- and whitespace-insensitive. */
export const namesMatch = (typed: string, expected: string) =>
  typed.trim().replace(/\s+/g, " ").toLowerCase() === expected.trim().replace(/\s+/g, " ").toLowerCase();

/** Default "offer open until" for a new agreement: today + OFFER_VALID_DAYS (UTC). */
export function defaultOfferValidUntil(now = new Date()): string {
  return isoDate(new Date(now.getTime() + OFFER_VALID_DAYS * 86_400_000));
}

/** The client's chosen options, from their acceptance, as pinned into the agreement. */
export const selectionOf = (acceptance: { packageId?: string; paymentPlanId?: string }) => ({
  ...(acceptance.packageId && { packageId: acceptance.packageId }),
  ...(acceptance.paymentPlanId && { paymentPlanId: acceptance.paymentPlanId }),
});

export const sameSelection = (a: { packageId?: string; paymentPlanId?: string }, b: { packageId?: string; paymentPlanId?: string }) =>
  (a.packageId ?? "") === (b.packageId ?? "") && (a.paymentPlanId ?? "") === (b.paymentPlanId ?? "");
