import { createHash } from "crypto";

/**
 * Proposal versions: a SHA-256 over a canonical serialisation of the
 * proposal's terms (`Proposals.data`). Acceptances and change requests record
 * the version they were made against, and `ProposalSnapshots` keeps the exact
 * JSON — so "the accepted proposal" always means one fixed set of terms, even
 * if the sheet cell is edited later.
 *
 * Server-only (Node `crypto`). Clients receive versions from the API and format
 * them with `shortVersion` from `./proposal-version-label`.
 */

/**
 * Top-level keys that are operational switches or delivery config rather than
 * terms. Toggling them after acceptance must not count as changing what the
 * client accepted. `pdfUrl` is retired but still present in older sheet data.
 */
const OPERATIONAL_KEYS: ReadonlySet<string> = new Set([
  "assetsReady",
  "trackerReady",
  "assets",
  "tracker",
  "pdfUrl",
]);

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

/** Key-sorted JSON of the proposal terms, operational keys removed. */
export function canonicalProposalJson(data: object): string {
  const terms = Object.fromEntries(
    Object.entries(data).filter(([key]) => !OPERATIONAL_KEYS.has(key))
  );
  return JSON.stringify(sortKeysDeep(terms));
}

export function proposalVersion(data: object): string {
  return createHash("sha256").update(canonicalProposalJson(data)).digest("hex");
}

export { shortVersion } from "./proposal-version-label";
