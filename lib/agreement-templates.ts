import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { ProviderIdentity } from "@/types/agreement";

/**
 * Agreement templates, versioned in the repo under `content/agreements/`.
 * A version's text never changes once anything is signed against it — a
 * change to the terms is a new file (v2) — and signing re-checks the file's
 * hash against the one pinned in the agreement. Server-only (reads files;
 * `next.config.ts` ships `content/agreements/**` with the routes that do).
 */

const DIR = path.join(process.cwd(), "content/agreements");

/** Every published template version. Add an entry (and a new file) for v2. */
const REGISTRY = [{ id: "general-service-agreement", version: 1, file: "general-service-agreement-v1.md" }] as const;

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

export function listTemplates(): Pick<AgreementTemplate, "id" | "version" | "title" | "status">[] {
  return REGISTRY.map(({ id, version }) => loadTemplate(id, version)).filter((t): t is AgreementTemplate => !!t).map(({ id, version, title, status }) => ({ id, version, title, status }));
}

/** The latest version of a template id (what a new agreement starts from). */
export function latestTemplate(id = "general-service-agreement"): AgreementTemplate | null {
  const versions = REGISTRY.filter((t) => t.id === id).map((t) => t.version);
  return versions.length ? loadTemplate(id, Math.max(...versions)) : null;
}

export function loadTemplate(id: string, version: number): AgreementTemplate | null {
  const entry = REGISTRY.find((t) => t.id === id && t.version === version);
  if (!entry) return null;
  const raw = fs.readFileSync(path.join(DIR, entry.file), "utf8");
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
    status: data.status === "final" ? "final" : "draft",
    hash: createHash("sha256").update(raw).digest("hex"),
    body: body.trim(),
    clauses: parseClauses(body),
    draftingNotes: notes.join("\n\n"),
    raw,
  };
}

/** The body with the provider placeholders filled (`[[provider.name]]` etc.). */
export function fillTemplate(body: string, provider: ProviderIdentity): string {
  const values: Record<string, string> = {
    name: provider.name,
    role: provider.role,
    tradingAs: provider.contractAs === "trading" && provider.tradingName ? `, trading as ${provider.tradingName}` : "",
    address: provider.address,
    email: provider.email,
  };
  return body.replace(/\[\[provider\.(\w+)\]\]/g, (match, key: string) => values[key] ?? match);
}
