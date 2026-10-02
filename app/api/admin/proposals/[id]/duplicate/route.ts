import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequest, isSameOrigin } from "@/lib/admin-auth";
import { appendProposalRow, getProposalById } from "@/lib/google-sheets";
import { isoDate } from "@/lib/dates";
import { PROPOSAL_ID_HINT, PROPOSAL_ID_RE } from "@/lib/proposal-id";

// No 0/O/1/I/L — codes get read aloud and typed by clients.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DUPLICATE_OFFER_DAYS = 30;

function generateAccessCode(length = 8): string {
  return Array.from({ length }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join("");
}

/**
 * Starts a new proposal from an existing one: same content, new id and access
 * code, inactive (Draft) with a fresh offer window and delivery flags cleared.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (!isSameOrigin(request)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  let newId: unknown;
  try {
    ({ newId } = await request.json());
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof newId !== "string" || !PROPOSAL_ID_RE.test(newId)) {
    return NextResponse.json({ success: false, error: `Use ${PROPOSAL_ID_HINT}` }, { status: 400 });
  }

  const source = await getProposalById(id);
  if (!source) return NextResponse.json({ success: false, error: "Proposal not found" }, { status: 404 });

  const data = { ...source.data };
  delete data.assetsReady;
  delete data.trackerReady;
  const accessCode = generateAccessCode();
  const expiryDate = isoDate(new Date(Date.now() + DUPLICATE_OFFER_DAYS * 24 * 60 * 60 * 1000));

  const result = await appendProposalRow(newId, { accessCode, expiryDate, isActive: false, dataJson: JSON.stringify(data) });
  if (result.status === "busy") {
    return NextResponse.json({ success: false, error: "That id is being created by another request. Try again." }, { status: 409 });
  }
  if (result.status === "exists") {
    return NextResponse.json({ success: false, error: `A proposal with id "${newId}" already exists` }, { status: 409 });
  }
  return NextResponse.json({ success: true, id: newId, accessCode, expiryDate });
}
