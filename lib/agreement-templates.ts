import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ProviderIdentity } from "@/types/agreement";
import { providerAffiliation } from "@/lib/agreements";

/**
 * Agreement templates, versioned in the repo under `content/agreements/`.
 * A version's text never changes once anything is signed against it — a
 * change to the terms is a new file (v2) — and signing re-checks the file's
 * hash against the one pinned in the agreement. Server-only (reads files;
 * `next.config.ts` ships `content/agreements/**` with the routes that do).
 */

const DIR = path.join(process.cwd(), "content/agreements");

export const DEFAULT_TEMPLATE_ID = "general-service-agreement";

/**
 * Every published template version. Add an entry (and a new file) for v2.
 * `declaration` names the paragraph the client confirms when signing (the
 * acceptance declaration, shown verbatim beside "Accept and Sign Agreement").
 * `parties` are the names the terms give the two sides ("Service Provider" /
 * "Client"; the licence says "Developer" / "Institute"), used for the
 * signature blocks and the provider's signing declaration. Kept here, not in
 * the file, so naming them never changes a template's hash.
 */
const GSA_PARTIES = { provider: "Service Provider", client: "Client" } as const;
const REGISTRY = [
  { id: "general-service-agreement", version: 1, file: "general-service-agreement-v1.md", declaration: "29.3", parties: GSA_PARTIES },
  // v2 (2026-10-03): client-facing wording — "This Service Agreement", a neutral
  // §29.3 lead-in, and the provider's organisation (`[[provider.affiliation]]`).
  { id: "general-service-agreement", version: 2, file: "general-service-agreement-v2.md", declaration: "29.3", parties: GSA_PARTIES },
  // IIA Ghana's Annual Platform Licence (2026-10-05): the agreement for the
  // `pkg-licence` option, signable (status final) while the GSA is in review.
  { id: "iiag-platform-licence", version: 1, file: "iiag-platform-licence-v1.md", declaration: "12.3", parties: { provider: "Developer", client: "Institute" } },
] as const;

export interface TemplateClause {
  /** "6" for a clause, "6.2" for a paragraph within it. */
  number: string;
  /** The clause heading (for a paragraph: its clause's heading). */
  title: string;
  /** Opening words of a paragraph, to tell paragraphs apart in pickers. */
  excerpt?: string;
}

export interface AgreementTemplate {
  id: string;
  version: number;
  title: string;
  /** What the terms call each side: signature-block labels and the provider's signing declaration. */
  parties: { provider: string; client: string };
  /** What the client sees the document called ("Service Agreement — {project}"); frontmatter `clientTitle`. */
  clientTitle: string;
  /** `draft` until the legal review signs off the text. */
  status: "draft" | "final";
  /** sha256 of the file's exact bytes. */
  hash: string;
  /** Markdown body: frontmatter and drafting notes removed, placeholders unfilled. */
  body: string;
  clauses: TemplateClause[];
  /** Notes for the legal review; never rendered on the agreement. */
  draftingNotes: string;
  /** The file's exact text (what `hash` covers) — kept in signed-agreement snapshots. */
  raw: string;
}

const DRAFTING_NOTES = /```drafting-notes\n([\s\S]*?)```\n?/g;

function parseClauses(body: string): TemplateClause[] {
  const clauses: TemplateClause[] = [];
  let heading = "";
  for (const line of body.split("\n")) {
    const clause = line.match(/^## (\d+)\. (.+)$/);
    if (clause) {
      heading = clause[2].trim();
      clauses.push({ number: clause[1], title: heading });
      continue;
    }
    const paragraph = line.match(/^\*\*(\d+\.\d+)\*\*\s+(.*)$/);
    if (paragraph) {
      const words = paragraph[2].replace(/\*\*/g, "").split(/\s+/).slice(0, 10).join(" ");
      clauses.push({ number: paragraph[1], title: heading, excerpt: `${words}…` });
    }
  }
  return clauses;
}

export type TemplateSummary = Pick<AgreementTemplate, "id" | "version" | "title" | "clientTitle" | "status" | "clauses" | "parties">;

export function listTemplates(): TemplateSummary[] {
  return REGISTRY.map(({ id, version }) => loadTemplate(id, version))
    .filter((t): t is AgreementTemplate => !!t)
    .map(({ id, version, title, clientTitle, status, clauses, parties }) => ({ id, version, title, clientTitle, status, clauses, parties }));
}

/** The latest version of a template id (what a new agreement starts from). */
export function latestTemplate(id = DEFAULT_TEMPLATE_ID): AgreementTemplate | null {
  const versions = REGISTRY.filter((t) => t.id === id).map((t) => t.version);
  return versions.length ? loadTemplate(id, Math.max(...versions)) : null;
}

export function loadTemplate(id: string, version: number): AgreementTemplate | null {
  const entry = REGISTRY.find((t) => t.id === id && t.version === version);
  if (!entry) return null;
  return parseTemplate(id, version, fs.readFileSync(path.join(DIR, entry.file), "utf8"));
}

/**
 * A template from its exact text — the file on disk, or the copy stored in a
 * signed agreement's snapshot (so a signed document renders from what was
 * signed, whatever the repo holds now).
 */
export function parseTemplate(id: string, version: number, raw: string): AgreementTemplate {
  const { data, content } = matter(raw);
  const notes: string[] = [];
  const body = content.replace(DRAFTING_NOTES, (_, note: string) => {
    notes.push(note.trim());
    return "";
  });
  return {
    id,
    version,
    title: typeof data.title === "string" ? data.title : id,
    parties: { ...(REGISTRY.find((t) => t.id === id && t.version === version)?.parties ?? GSA_PARTIES) },
    clientTitle: typeof data.clientTitle === "string" && data.clientTitle.trim() ? data.clientTitle.trim() : "Service Agreement",
    status: data.status === "final" ? "final" : "draft",
    hash: createHash("sha256").update(raw).digest("hex"),
    body: body.trim(),
    clauses: parseClauses(body),
    draftingNotes: notes.join("\n\n"),
    raw,
  };
}

/**
 * The client's acceptance declaration: the registered paragraph (e.g. 29.3)
 * with its list, exactly as written in the template, without the paragraph
 * number. Null if the template doesn't contain it — signing then fails closed.
 */
export function acceptanceDeclaration(template: AgreementTemplate): string | null {
  const entry = REGISTRY.find((t) => t.id === template.id && t.version === template.version);
  if (!entry) return null;
  const lines = template.body.split("\n");
  const marker = `**${entry.declaration}**`;
  const start = lines.findIndex((line) => line.startsWith(`${marker} `));
  if (start === -1) return null;
  const out = [lines[start].slice(marker.length).trim()];
  for (const line of lines.slice(start + 1)) {
    if (/^\*\*\d+\.\d+\*\*/.test(line) || /^#{1,6} /.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

/** What the client sees an agreement called, from its pinned template ("Service Agreement" if unknown). */
export function clientTitleOf(ref: { templateId: string; templateVersion: number }): string {
  return loadTemplate(ref.templateId, ref.templateVersion)?.clientTitle ?? "Service Agreement";
}

/** The body with the provider placeholders filled (`[[provider.name]]` etc.). */
export function fillTemplate(body: string, provider: ProviderIdentity): string {
  const values: Record<string, string> = {
    name: provider.name,
    role: provider.role,
    affiliation: providerAffiliation(provider),
    // The placeholder's name in v1 text signed before 2026-10-03 (kept in signed copies): same value.
    tradingAs: providerAffiliation(provider),
    address: provider.address,
    email: provider.email,
  };
  return body.replace(/\[\[provider\.(\w+)\]\]/g, (match, key: string) => values[key] ?? match);
}
