import type { AgreementTemplate } from "@/lib/agreement-templates";

/**
 * Client signing is off until the base terms have had legal review, i.e.
 * until the pinned template is marked `status: final`. For testing,
 * AGREEMENT_CLIENT_SIGNING_ALLOW_DRAFT=1 enables it on a draft — but only in
 * an environment known not to be production: a Vercel preview/development
 * deployment, or local `next dev`. Anything else (Vercel production, any
 * other host, local `next start`) ignores the override. Checked server-side on
 * every client-signing step.
 */
export function clientSigningAllowed(template: Pick<AgreementTemplate, "status"> | null): boolean {
  if (!template) return false;
  if (template.status === "final") return true;
  return process.env.AGREEMENT_CLIENT_SIGNING_ALLOW_DRAFT === "1" && draftOverrideEnvironment();
}

/** Allow-list, not deny-list: an unknown environment is treated as production. */
function draftOverrideEnvironment(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "preview" || vercelEnv === "development";
  return process.env.NODE_ENV === "development";
}

export const CLIENT_SIGNING_OFF_REASON =
  "Client signing is off until the agreement terms have had legal review (the template is still a draft).";

/**
 * Preparing, signing and sending agreements from a server that isn't a
 * Vercel deployment (e.g. a local `next dev` against the live sheet) is off
 * unless AGREEMENT_ALLOW_LOCAL_WRITES=1. An agreement pins the exact terms
 * file of the server that prepared it, so one prepared locally against
 * uncommitted terms can't be signed on the live site (2026-10-06, iiaghana).
 */
export function agreementWritesAllowedHere(): boolean {
  return !!process.env.VERCEL_ENV || process.env.AGREEMENT_ALLOW_LOCAL_WRITES === "1";
}

export const LOCAL_AGREEMENT_WRITES_OFF = {
  success: false,
  code: "local_writes_off",
  error:
    "Agreements are prepared, signed and sent from the live site, not a local server: the agreement pins this server's terms file, which may differ from the deployed one. Set AGREEMENT_ALLOW_LOCAL_WRITES=1 to override for testing.",
};
