import type { NextRequest } from "next/server";
import { isAdminRequest, isSameOrigin, requestMeta } from "@/lib/admin-auth";
import {
  appendEngagementEvent,
  readProposalAcceptance,
  readPublishedRevision,
  saveProposalSnapshot,
  SheetLockExpiredError,
  updateProposalRowLocked,
  withProposalLock,
  type PublishedRevision,
} from "@/lib/google-sheets";
import { DuplicateEmailError, sendProposalRevised } from "@/lib/email";
import { canonicalProposalJson } from "@/lib/proposal-version";
import { MAX_REVISION_NOTE_CHARS } from "@/lib/proposal-schema";
import type { ProposalAcceptance, ProposalDataUnion } from "@/types/proposal";
import { busy, conflict, isDate, json, parseEdit, readJsonBody } from "../edit";

type Params = { params: Promise<{ id: string }> };

/**
 * How long a reserved send attempt blocks others. Longer than any real send;
 * past it the attempt is presumed dead (crashed, or its outcome never
 * recorded) and a retry may reserve again — the provider idempotency key then
 * stops a duplicate if that attempt did in fact send.
 */
const EMAIL_RESERVATION_MS = 2 * 60_000;

const reservationActive = (revision: PublishedRevision, now = Date.now()) =>
  revision.email.status === "pending" && !!revision.email.reservedAt && now - Date.parse(revision.email.reservedAt) < EMAIL_RESERVATION_MS;

/**
 * "Publish revision": saves the editor's draft (like PUT, optionally with an
 * extended offer window), records the revision in `EngagementEvents`,
 * snapshots the terms and emails the client. Publishing a version that's
 * already published records nothing new, but still sends the client email if
 * it was requested (`notifyClient`, or the explicit `resendEmail`) and hasn't
 * gone out yet — a failed or skipped email is never silently dropped. An
 * email that was sent is never sent twice.
 *
 * Everything that decides whether to publish, and the record itself, runs
 * under the proposal lock that saves and client responses also take — so a
 * client can't accept in between, and two clicks can't publish twice. The
 * email is sent after the lock is released; its outcome is a separate event.
 */
export async function POST(request: NextRequest, { params }: Params) {
  if (!isAdminRequest(request)) return json({ success: false, error: "Unauthorized" }, 401);
  if (!isSameOrigin(request)) return json({ success: false, error: "Forbidden" }, 403);
  const { id } = await params;

  const body = await readJsonBody(request);
  if (!body) return json({ success: false, error: "Invalid JSON" }, 400);
  const parsed = parseEdit(body);
  if (!parsed.ok) return parsed.response;
  const { expectedRowHash, data, nextVersion } = parsed.edit;
  const input = { ...parsed.edit.input };

  const note = typeof body.note === "string" ? body.note.trim() : "";
  if (note.length > MAX_REVISION_NOTE_CHARS) {
    return json({ success: false, code: "invalid", error: `The note is limited to ${MAX_REVISION_NOTE_CHARS} characters` }, 400);
  }
  if (body.extendExpiryTo !== undefined && !isDate(body.extendExpiryTo)) {
    return json({ success: false, code: "invalid", error: "The new expiry must be a date (YYYY-MM-DD)" }, 400);
  }
  const extendedFrom = typeof body.extendExpiryTo === "string" && body.extendExpiryTo !== input.expiryDate ? input.expiryDate : undefined;
  if (typeof body.extendExpiryTo === "string") input.expiryDate = body.extendExpiryTo;

  // A revision the client can't open or accept isn't worth announcing.
  if (!input.isActive) {
    return json({ success: false, code: "inactive", error: "This proposal is a draft (not visible to the client). Make it active to publish." }, 400);
  }
  // Same rule as the access check: the offer closes at the start of its expiry date (UTC).
  if (new Date() > new Date(input.expiryDate)) {
    return json({ success: false, code: "expired_offer", error: "The offer has expired — extend it so the client can accept the revision." }, 400);
  }

  const meta = requestMeta(request);
  const clientEmail = data.client.email?.trim() || undefined;
  const emailTo = body.notifyClient === true ? clientEmail : undefined;
  // On an already-published version, either flag asks for the (unsent) email.
  const emailRequested = !!clientEmail && (body.notifyClient === true || body.resendEmail === true);

  const locked = await withProposalLock(id, async (lock) => {
    let acceptance: ProposalAcceptance | null;
    try {
      acceptance = await readProposalAcceptance(id);
    } catch (error) {
      console.error(`Publish for ${id}: acceptance status unavailable:`, error);
      return { kind: "acceptance_unavailable" } as const;
    }
    // After acceptance, changes go through the agreement, not a revision.
    if (acceptance?.status === "accepted") return { kind: "accepted" } as const;
    // Nothing to announce if the terms are still the ones the client asked to change.
    if (acceptance?.status === "counter" && acceptance.proposalVersion === nextVersion) return { kind: "unchanged" } as const;

    const write = await updateProposalRowLocked(lock, id, expectedRowHash, input);
    if (write.status === "not_found") return { kind: "not_found" } as const;
    if (write.status === "conflict") return { kind: "conflict", current: write.current } as const;
    if (write.status !== "saved") return { kind: "not_found" } as const;

    const existing = await readPublishedRevision(id, nextVersion);
    if (existing) {
      // The send decision is made here, under the lock, and reserved before
      // the lock is released — so overlapping requests can't both send.
      if (!emailRequested || existing.email.status === "sent") return { kind: "existing", rowHash: write.rowHash, revision: existing, send: false } as const;
      if (reservationActive(existing)) return { kind: "existing", rowHash: write.rowHash, revision: existing, send: false, inFlight: true } as const;
      const reservedAt = await appendEngagementEvent(
        { proposalId: id, event: "revision_email", proposalVersion: nextVersion, detail: { status: "sending", to: clientEmail }, ...meta },
        lock
      );
      const reserved: PublishedRevision = { ...existing, email: { status: "pending", to: clientEmail, reservedAt, failures: existing.email.failures ?? 0 } };
      return { kind: "existing", rowHash: write.rowHash, revision: reserved, send: true } as const;
    }

    // Keep exactly what the client was sent. Best-effort, like on acceptance;
    // running out of lock time aborts the publish instead.
    try {
      await saveProposalSnapshot(id, nextVersion, "revision_published", canonicalProposalJson(data), lock);
    } catch (error) {
      if (error instanceof SheetLockExpiredError) throw error;
      console.error(`Revision snapshot failed for ${id}@${nextVersion}:`, error);
    }
    // With notify on, this row is also the reservation for the first send attempt.
    const publishedAt = await appendEngagementEvent(
      {
        proposalId: id,
        event: "revision_published",
        proposalVersion: nextVersion,
        detail: { note, expiryDate: input.expiryDate, ...(extendedFrom && { extendedFrom }), notify: !!emailTo, ...(emailTo && { emailTo }) },
        ...meta,
      },
      lock
    );
    const revision: PublishedRevision = {
      proposalVersion: nextVersion,
      publishedAt,
      note,
      expiryDate: input.expiryDate,
      extendedFrom,
      email: emailTo ? { status: "pending", to: emailTo, reservedAt: publishedAt, failures: 0 } : { status: "skipped", failures: 0 },
    };
    return { kind: "published", rowHash: write.rowHash, revision, send: !!emailTo } as const;
  });

  if (locked.status === "busy") return busy();
  const outcome = locked.value;
  switch (outcome.kind) {
    case "acceptance_unavailable":
      return json({ success: false, code: "acceptance_unavailable", error: "Couldn't verify whether this proposal is accepted, so nothing was published. Try again." }, 503);
    case "accepted":
      return json({ success: false, code: "accepted", error: "The client has accepted this proposal — changes now go through the agreement, not a revision." }, 409);
    case "unchanged":
      return json({ success: false, code: "unchanged", error: "These are still the terms the client asked to change. Edit the proposal before publishing a revision." }, 409);
    case "not_found":
      return json({ success: false, error: "Proposal not found" }, 404);
    case "conflict":
      return conflict(outcome.current);
  }

  let revision = outcome.revision;
  // The deadline the client is told is the offer as saved now (this request,
  // after any extension) — expiry isn't part of the terms version, so a
  // reused revision's recorded expiry can be out of date.
  if (outcome.send) revision = await emailClient(id, data, revision, input.expiryDate, meta);

  return json({
    success: true,
    alreadyPublished: outcome.kind === "existing",
    // Another request holds the send reservation for this revision's email.
    emailInFlight: outcome.kind === "existing" && "inFlight" in outcome && outcome.inFlight === true,
    rowHash: outcome.rowHash,
    proposalVersion: nextVersion,
    revision,
  });
}

/**
 * Sends the client email for a reserved attempt and records its outcome;
 * never throws. The idempotency key changes only with a *recorded* failure:
 * a retry after an unrecorded success reuses it, and Resend drops the repeat.
 */
async function emailClient(
  id: string,
  data: ProposalDataUnion,
  revision: PublishedRevision,
  expiryDate: string,
  meta: { ip: string; userAgent: string }
): Promise<PublishedRevision> {
  const to = data.client.email!.trim();
  const failures = revision.email.failures ?? 0;
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  let deduplicated = false;
  try {
    await sendProposalRevised({
      to,
      clientName: data.client.name,
      proposalId: id,
      projectTitle: data.title,
      note: revision.note || undefined,
      expiryDate,
      idempotencyKey: `revision-email:${id}:${revision.proposalVersion}:${failures}`,
    });
  } catch (err) {
    if (err instanceof DuplicateEmailError) {
      // An earlier attempt with this key already went out: that's the email.
      deduplicated = true;
    } else {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error(`Revision email for ${id}@${revision.proposalVersion} failed:`, err);
    }
  }
  let at = new Date().toISOString();
  try {
    at = await appendEngagementEvent({
      proposalId: id,
      event: "revision_email",
      proposalVersion: revision.proposalVersion,
      detail: { status, to, expiryDate, ...(error && { error }), ...(deduplicated && { deduplicated: true }) },
      ...meta,
    });
  } catch (err) {
    // The email outcome is still returned to the editor; only the record is missing.
    console.error(`Couldn't record the revision email outcome for ${id}:`, err);
  }
  return { ...revision, email: { status, to, at, error, failures: status === "failed" ? failures + 1 : failures } };
}
