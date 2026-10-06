import { NextResponse } from "next/server";
import type { ProposalRowForEdit, ProposalRowInput } from "@/lib/google-sheets";
import type { ProposalDataUnion } from "@/types/proposal";
import { validateProposal, type ProposalIssue } from "@/lib/proposal-schema";
import { proposalVersion } from "@/lib/proposal-version";

/** Shared by the editor's save (PUT) and "Publish revision" (POST …/publish). */

export const json = (body: object, status = 200) => NextResponse.json(body, { status });

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const isDate = (value: unknown): value is string => typeof value === "string" && DATE_RE.test(value) && !isNaN(new Date(value).getTime());

/** Editable fields + the row hash the editor must send back on save. */
export function editable(row: ProposalRowForEdit) {
  const { record, rowHash } = row;
  return {
    accessCode: record.accessCode,
    expiryDate: record.expiryDate,
    isActive: record.isActive,
    data: record.data,
    rowHash,
    proposalVersion: proposalVersion(record.data),
  };
}

export function conflict(current: ProposalRowForEdit | null) {
  return json(
    {
      success: false,
      code: "conflict",
      error: "The sheet changed since you opened this proposal.",
      current: current ? editable(current) : null,
    },
    409
  );
}

export const busy = () =>
  json({ success: false, code: "busy", error: "Another save of this proposal is in progress. Try again in a moment." }, 409);

export interface ParsedEdit {
  expectedRowHash: string;
  input: ProposalRowInput;
  data: ProposalDataUnion;
  nextVersion: string;
}

/**
 * Validates an editor submission: settings (what the access gate and offer
 * window depend on) and content (server-side validation is authoritative —
 * the editor validates too). Returns the row to write, or a 400 response.
 */
export function parseEdit(body: Record<string, unknown>): { ok: true; edit: ParsedEdit } | { ok: false; response: NextResponse } {
  const { expectedRowHash, accessCode, expiryDate, isActive, data } = body;
  const settingsErrors: ProposalIssue[] = [];
  if (typeof expectedRowHash !== "string" || !expectedRowHash) settingsErrors.push({ path: "rowHash", message: "Missing row hash. Reload the editor" });
  if (typeof accessCode !== "string" || accessCode.trim().length < 4) settingsErrors.push({ path: "accessCode", message: "Access code must be at least 4 characters" });
  if (!isDate(expiryDate)) settingsErrors.push({ path: "expiryDate", message: "Expiry must be a date (YYYY-MM-DD)" });
  if (typeof isActive !== "boolean") settingsErrors.push({ path: "isActive", message: "isActive must be true or false" });
  const { errors } = validateProposal(data);
  if (settingsErrors.length || errors.length) {
    return { ok: false, response: json({ success: false, code: "invalid", errors: [...settingsErrors, ...errors] }, 400) };
  }
  return {
    ok: true,
    edit: {
      expectedRowHash: expectedRowHash as string,
      input: {
        accessCode: (accessCode as string).trim(),
        expiryDate: expiryDate as string,
        isActive: isActive as boolean,
        dataJson: JSON.stringify(data),
      },
      data: data as ProposalDataUnion,
      nextVersion: proposalVersion(data as object),
    },
  };
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
