import { profile } from "@/constants/profile";

/**
 * How the Service Provider appears on agreements. Placeholders until the
 * legal review confirms the exact identity (see GUIDELINES/PLAN_AGREEMENTS.md).
 * The resolved block is frozen into each agreement record when it's prepared,
 * so changing these later never alters a prepared or signed agreement.
 *
 * Joseph is always the contracting party. Each agreement may name the
 * organisation he works with on that engagement, which is printed after his
 * role — "Joseph Afriyie Attakorah, Software Engineer, Avengh" — as a
 * description, not as a party.
 */
export const agreementProvider = {
  legalName: profile.name,
  role: profile.title,
  address: profile.location,
  email: profile.email,
};

/** Organisations an agreement can name after Joseph's role. Add one here to offer it. */
export const PROVIDER_ORGANISATIONS: readonly string[] = ["Avengh", "Korah Labs"];

/** Declaration the provider confirms when signing (General Service Agreement wording); stored verbatim with the signature. */
export const PROVIDER_SIGNING_DECLARATION =
  "I have read this Agreement, including its Schedules, and sign it on behalf of the Service Provider. I understand that any later change to it voids this signature.";

/** The provider's signing declaration in the terms' own name for him (`template.parties.provider`, e.g. "Developer"). */
export function providerSigningDeclaration(party: string): string {
  return party === "Service Provider"
    ? PROVIDER_SIGNING_DECLARATION
    : `I have read this Agreement, including its Schedules, and sign it as the ${party}. I understand that any later change to it voids this signature.`;
}

/**
 * Agreement terms that belong with a particular package: the admin panel
 * starts a new agreement on that template, and warns when the accepted
 * package and the chosen terms don't match. Packages not listed use the
 * General Service Agreement.
 */
export const PACKAGE_TEMPLATES: Readonly<Record<string, string>> = {
  "pkg-licence": "iiag-platform-licence",
};

/** Default window for the client to sign once the provider has signed. */
export const OFFER_VALID_DAYS = 14;
export const MAX_SPECIAL_TERMS = 20;
export const MAX_SPECIAL_TERM_CHARS = 2000;

/** Longest change request a client can send about the agreement. */
export const MAX_AGREEMENT_CHANGE_NOTE = 2000;
