import { createHash } from "crypto";

/**
 * Proposal versions: a SHA-256 over a canonical serialisation of the
 * proposal's terms (`Proposals.data`). Acceptances and change requests record
 * the version they were made against, and `ProposalSnapshots` keeps the exact
 * JSON — so "the accepted proposal" always means one fixed set of terms, even
 * if the sheet cell is edited later.
 *
 * Server-only (Node `crypto`). Clients receive versions from the API and format
 * them with `shortVersion` from `./proposal-version-label`; the canonical form
 * itself lives in the client-safe `./proposal-terms`.
 */

import { canonicalProposalJson } from "./proposal-terms";

export { canonicalProposalJson };

export function proposalVersion(data: object): string {
  return createHash("sha256").update(canonicalProposalJson(data)).digest("hex");
}

export { shortVersion } from "./proposal-version-label";
