/**
 * Display form of a proposal version (see `lib/proposal-version.ts`), e.g.
 * "3f9a2c71b0de". Kept separate so client components can import it without
 * pulling in Node's `crypto`.
 */
export function shortVersion(version: string): string {
  return version.slice(0, 12);
}
