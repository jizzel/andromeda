import type { NextRequest } from "next/server";
import { withRouteTelemetry } from "@/lib/sheets-telemetry";
import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import {
  getProposalAcceptance,
  getProposalRowForEdit,
  readProposalAcceptance,
  updateProposalRow,
  type ProposalRowForEdit,
} from "@/lib/google-sheets";
import type { ProposalAcceptance } from "@/types/proposal";
import { proposalVersion } from "@/lib/proposal-version";
import { busy, conflict, editable, json, parseEdit, readJsonBody } from "./edit";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  const { id } = await params;
  const row = await getProposalRowForEdit(id);
  if (!row) return json({ success: false, error: "Proposal not found" }, 404);
  return json({ success: true, ...editable(row), acceptance: await getProposalAcceptance(id) });
}

async function handlePUT(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;

  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);
  const parsed = parseEdit(body);
  if (!parsed.ok) return parsed.response;
  const { expectedRowHash, input, nextVersion } = parsed.edit;

  // Runs inside the proposal lock, after the row-hash check: a client can't
  // accept between these checks and the write (acceptance takes the same lock).
  const result = await updateProposalRow(id, expectedRowHash, input, (current) =>
    acceptedTermsGuard(id, current, nextVersion, body.confirmAcceptedEdit === true)
  );
  if (result.status === "not_found") return json({ success: false, error: "Proposal not found" }, 404);
  if (result.status === "busy") return busy();
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
  // Only a save that changes the terms needs confirming. Operational settings
  // (asset/tracker switches, expiry, access code, …) never change the version,
  // even when the saved terms already moved on from the accepted ones.
  if (nextVersion === proposalVersion(current.record.data)) return null;
  const acceptedVersion = acceptance.proposalVersion ?? proposalVersion(current.record.data);
  return nextVersion === acceptedVersion ? null : "confirm_accepted_edit";
}

export const PUT = withRouteTelemetry<Params, Response>("proposal save", (request, ctx) => handlePUT(request as NextRequest, ctx));
