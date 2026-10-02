import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import {
  getProposalAcceptance,
  getProposalRowForEdit,
  readProposalAcceptance,
  updateProposalRow,
  type ProposalRowForEdit,
} from "@/lib/google-sheets";
import type { ProposalAcceptance } from "@/types/proposal";
import { validateProposal } from "@/lib/proposal-schema";
import { proposalVersion } from "@/lib/proposal-version";

type Params = { params: Promise<{ id: string }> };

const json = (body: object, status = 200) => NextResponse.json(body, { status });

/** Editable fields + the row hash the editor must send back on save. */
function editable(row: ProposalRowForEdit) {
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

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  const { id } = await params;
  const row = await getProposalRowForEdit(id);
  if (!row) return json({ success: false, error: "Proposal not found" }, 404);
  return json({ success: true, ...editable(row), acceptance: await getProposalAcceptance(id) });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function conflict(current: ProposalRowForEdit | null) {
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

export async function PUT(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ success: false, error: "Invalid JSON" }, 400);
  }
  const { expectedRowHash, accessCode, expiryDate, isActive, data, confirmAcceptedEdit } = body;

  // Settings: what the access gate and offer window depend on.
  const settingsErrors: { path: string; message: string }[] = [];
  if (typeof expectedRowHash !== "string" || !expectedRowHash) settingsErrors.push({ path: "rowHash", message: "Missing row hash — reload the editor" });
  if (typeof accessCode !== "string" || accessCode.trim().length < 4) settingsErrors.push({ path: "accessCode", message: "Access code must be at least 4 characters" });
  if (typeof expiryDate !== "string" || !DATE_RE.test(expiryDate) || isNaN(new Date(expiryDate).getTime())) settingsErrors.push({ path: "expiryDate", message: "Expiry must be a date (YYYY-MM-DD)" });
  if (typeof isActive !== "boolean") settingsErrors.push({ path: "isActive", message: "isActive must be true or false" });
  // Content: server-side validation is authoritative (the editor validates too).
  const { errors } = validateProposal(data);
  if (settingsErrors.length || errors.length) {
    return json({ success: false, code: "invalid", errors: [...settingsErrors, ...errors] }, 400);
  }

  const nextVersion = proposalVersion(data as object);
  // Runs inside the proposal lock, after the row-hash check: a client can't
  // accept between these checks and the write (acceptance takes the same lock).
  const result = await updateProposalRow(
    id,
    expectedRowHash as string,
    {
      accessCode: (accessCode as string).trim(),
      expiryDate: expiryDate as string,
      isActive: isActive as boolean,
      dataJson: JSON.stringify(data),
    },
    (current) => acceptedTermsGuard(id, current, nextVersion, confirmAcceptedEdit === true)
  );
  if (result.status === "not_found") return json({ success: false, error: "Proposal not found" }, 404);
  if (result.status === "busy") {
    return json({ success: false, code: "busy", error: "Another save of this proposal is in progress. Try again in a moment." }, 409);
  }
  if (result.status === "conflict") return conflict(result.current);
  if (result.status === "rejected") {
    return result.reason === "acceptance_unavailable"
      ? json(
          { success: false, code: "acceptance_unavailable", error: "Couldn't verify whether this proposal is accepted, so it wasn't saved. Try again." },
          503
        )
      : json(
          { success: false, code: "confirm_accepted_edit", error: "This changes the terms the client accepted. Confirm to save anyway." },
          409
        );
  }
  return json({ success: true, rowHash: result.rowHash, proposalVersion: nextVersion });
}

/**
 * Editing the terms of an accepted proposal changes what the client agreed to
 * — allowed, but only deliberately. Strict read: if acceptance can't be
 * verified, neither can this check, so the save is refused rather than
 * made unchecked.
 */
async function acceptedTermsGuard(
  id: string,
  current: ProposalRowForEdit,
  nextVersion: string,
  confirmed: boolean
): Promise<"acceptance_unavailable" | "confirm_accepted_edit" | null> {
  let acceptance: ProposalAcceptance | null;
  try {
    acceptance = await readProposalAcceptance(id);
  } catch (error) {
    console.error(`Admin save for ${id}: acceptance status unavailable:`, error);
    return "acceptance_unavailable";
  }
  if (acceptance?.status !== "accepted" || confirmed) return null;
  const acceptedVersion = acceptance.proposalVersion ?? proposalVersion(current.record.data);
  return nextVersion === acceptedVersion ? null : "confirm_accepted_edit";
}
