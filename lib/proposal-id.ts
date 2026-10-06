/**
 * Proposal ids appear in client URLs (`/proposal/<id>`), so they're lowercase
 * slugs: 3–50 letters, numbers and hyphens, not starting or ending with a
 * hyphen. Shared by the duplicate API and the admin dialog that validates as
 * you type.
 */
export const PROPOSAL_ID_RE = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export const PROPOSAL_ID_HINT = "3–50 lowercase letters, numbers and hyphens (e.g. acme-website)";

/** Why `id` isn't a valid new proposal id, or null if it is. */
export function proposalIdProblem(id: string, existingIds: Iterable<string> = []): string | null {
  if (!id) return "Enter an id";
  if (/[A-Z]/.test(id)) return "Use lowercase letters";
  if (/\s/.test(id)) return "No spaces; use hyphens";
  if (!PROPOSAL_ID_RE.test(id)) return `Use ${PROPOSAL_ID_HINT}`;
  for (const existing of existingIds) if (existing === id) return "A proposal with this id already exists";
  return null;
}
