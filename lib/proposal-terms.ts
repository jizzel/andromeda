/**
 * The canonical form of a proposal's terms: key-sorted JSON with operational
 * keys removed. `lib/proposal-version.ts` hashes it into the version id;
 * snapshots store it; the admin editor diffs against it. No Node APIs, so
 * client components can import it.
 */

/**
 * Top-level keys that are operational switches or delivery config rather than
 * terms. Toggling them after acceptance must not count as changing what the
 * client accepted. `pdfUrl` is retired but still present in older sheet data.
 */
const OPERATIONAL_KEYS: ReadonlySet<string> = new Set(["assetsReady", "trackerReady", "assets", "tracker", "pdfUrl"]);

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
  const terms = Object.fromEntries(Object.entries(data).filter(([key]) => !OPERATIONAL_KEYS.has(key)));
  return JSON.stringify(sortKeysDeep(terms));
}
