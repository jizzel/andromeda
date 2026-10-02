import { profile } from "@/constants/profile";

/**
 * How the Service Provider appears on agreements. Placeholders until the
 * legal review confirms the exact identity (see GUIDELINES/PLAN_AGREEMENTS.md).
 * The resolved block is frozen into each agreement record when it's prepared,
 * so changing these later never alters a prepared or signed agreement.
 *
 * `tradingName` is optional: when set, each agreement can contract either in
 * Joseph's own name ("name, role") or "name, trading as …"; when unset, only
 * the individual option is offered. Set AGREEMENT_PROVIDER_TRADING_NAME (server
 * env) to offer it.
 */
export const agreementProvider = {
  legalName: profile.name,
  role: profile.title,
  tradingName: process.env.AGREEMENT_PROVIDER_TRADING_NAME?.trim() || undefined,
  address: profile.location,
  email: profile.email,
};

/** Declaration the provider confirms when signing; stored verbatim with the signature. */
export const PROVIDER_SIGNING_DECLARATION =
  "I have read this Agreement, including its Schedules, and sign it on behalf of the Service Provider. I understand that any later change to it voids this signature.";

/** Default window for the client to sign once the provider has signed. */
export const OFFER_VALID_DAYS = 14;
export const MAX_SPECIAL_TERMS = 20;
export const MAX_SPECIAL_TERM_CHARS = 2000;
