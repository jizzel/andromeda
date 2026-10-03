import {
  appendEngagementEvent,
  getProposalById,
  getProposalRowForEdit,
  readProposalEngagementEvents,
  getTrackerRow,
  getTrackerStates,
  setTrackerMilestone,
  updateProposalRowLocked,
  withProposalLock,
} from "@/lib/google-sheets";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { AGREEMENT_SIGNED_MILESTONE } from "@/lib/tracker";
import { getExecutedAgreementPdf, proposalPdfFilename } from "@/lib/pdf";
import { DuplicateEmailError, sendAgreementExecuted } from "@/lib/email";
import { foldAgreementActivity, onboardingFailed } from "@/lib/agreement-activity";
import { profile } from "@/constants/profile";
import type { AgreementActivity, AgreementRecord } from "@/types/agreement";
import type { ProjectTrackerConfig } from "@/types/proposal";

/**
 * What follows the client's signature, run after the response (`after()`) and
 * best-effort: each step's outcome is recorded as an `EngagementEvents` row,
 * so a failure is visible in admin and can be resumed — never lost, never
 * blocking the signature that already stands. `completeExecutionFollowUp`
 * runs whatever isn't recorded yet, so it's safe to call again: after the
 * signature, on a retry by the same signer, and from admin.
 */

type Onboarding = NonNullable<AgreementActivity["onboarding"]>;

/**
 * Execution unlocks onboarding: the asset checklist (`assetsReady`, an
 * operational key, so the proposal version doesn't change) and the tracker's
 * "service agreement signed" milestone. Manual flags remain an override.
 */
export async function unlockOnboarding(record: AgreementRecord): Promise<Pick<Onboarding, "assets" | "tracker">> {
  const id = record.proposalId;
  const signedAt = record.clientSignature?.signedAt ?? new Date().toISOString();

  let assets: Onboarding["assets"] = "failed";
  let trackerConfig: ProjectTrackerConfig | null = null;
  try {
    const locked = await withProposalLock(id, async (lock) => {
      const row = await getProposalRowForEdit(id);
      if (!row) return { assets: "failed" as const, tracker: null };
      const { data, accessCode, expiryDate, isActive } = row.record;
      const tracker = data.trackerReady && data.tracker ? data.tracker : null;
      if (!data.assets) return { assets: "no_assets" as const, tracker };
      if (data.assetsReady) return { assets: "already" as const, tracker };
      const saved = await updateProposalRowLocked(lock, id, row.rowHash, {
        accessCode,
        expiryDate,
        isActive,
        dataJson: JSON.stringify({ ...data, assetsReady: true }),
      });
      return { assets: saved.status === "saved" ? ("unlocked" as const) : ("failed" as const), tracker };
    });
    if (locked.status === "ok") ({ assets, tracker: trackerConfig } = locked.value);
  } catch (error) {
    console.error(`Onboarding for ${id}: couldn't unlock assets:`, error);
  }

  let tracker: Onboarding["tracker"] = "no_milestone";
  if (trackerConfig) {
    try {
      const phase = resolveTrackerPhases(trackerConfig).find((p) => p.milestones.some((m) => m.id === AGREEMENT_SIGNED_MILESTONE));
      if (phase) {
        const row = await getTrackerRow(id, phase.id, AGREEMENT_SIGNED_MILESTONE);
        if (row?.state.status === "done") tracker = "already";
        else if (row) {
          await setTrackerMilestone(id, phase.id, AGREEMENT_SIGNED_MILESTONE, { status: "done", completedAt: signedAt });
          tracker = "done";
        } else {
          // Not seeded yet (or seeded before this milestone existed): the first
          // seed marks it done from the executed agreement (`getOrSeedTracker`).
          tracker = (await getTrackerStates(id)).length ? "no_milestone" : "not_seeded";
        }
      }
    } catch (error) {
      console.error(`Onboarding for ${id}: couldn't update the tracker:`, error);
      tracker = "failed";
    }
  }

  try {
    await appendEngagementEvent({
      proposalId: id,
      event: "agreement_onboarding_unlocked",
      proposalVersion: record.proposalVersion,
      detail: { agreementHash: record.agreementHash, assets, tracker },
    });
  } catch (error) {
    console.error(`Onboarding for ${id}: couldn't record the outcome:`, error);
  }
  return { assets, tracker };
}

/**
 * Emails the executed agreement to the client (the address their code was
 * verified at) and to Joseph, with the PDF attached when it renders. One
 * render for both. Each recipient's send carries the idempotency-key suffix
 * from `options.keySuffix` (see `executedEmailKeySuffix`), so a
 * retried request can't send twice.
 */
export async function sendExecutedCopies(
  origin: string,
  record: AgreementRecord,
  options: {
    recipients?: FollowUpRecipient[];
    /** Per-recipient idempotency-key suffix; defaults to "0" (the first attempt). */
    keySuffix?: Partial<Record<FollowUpRecipient, string>>;
    assetsUnlocked: boolean;
    projectTitle: string;
    clientName: string;
  }
): Promise<AgreementActivity["executedEmails"]> {
  const client = record.clientSignature;
  const provider = record.providerSignature;
  if (record.status !== "executed" || !client || !provider) return [];

  let pdf: { filename: string; content: Buffer } | null = null;
  try {
    const content = await getExecutedAgreementPdf({
      origin,
      proposalId: record.proposalId,
      agreementHash: record.agreementHash,
      providerSignedAt: provider.signedAt,
      clientSignedAt: client.signedAt,
    });
    pdf = { filename: proposalPdfFilename(options.clientName, options.projectTitle, "service-agreement"), content };
  } catch (error) {
    console.error(`Executed agreement PDF for ${record.proposalId} failed (sending without it):`, error);
  }

  const results: AgreementActivity["executedEmails"] = [];
  for (const recipient of options.recipients ?? (["client", "provider"] as const)) {
    const to = recipient === "client" ? client.email : profile.email;
    let status: "sent" | "failed" = "sent";
    let error: string | undefined;
    let deduplicated = false;
    try {
      await sendAgreementExecuted({
        to,
        recipient,
        clientName: options.clientName,
        proposalId: record.proposalId,
        projectTitle: options.projectTitle,
        signedBy: client.organisation ? `${client.legalName}, for ${client.organisation}` : client.legalName,
        signedAt: client.signedAt,
        agreementHash: record.agreementHash,
        pdf,
        assetsUnlocked: options.assetsUnlocked,
        idempotencyKey: `agreement-executed:${record.proposalId}:${record.agreementHash}:${recipient}:${options.keySuffix?.[recipient] ?? "0"}`,
      });
    } catch (sendError) {
      if (sendError instanceof DuplicateEmailError) deduplicated = true;
      else {
        console.error(`Executed agreement email (${recipient}) for ${record.proposalId} failed:`, sendError);
        status = "failed";
        error = sendError instanceof Error ? sendError.message.slice(0, 300) : "Unknown error";
      }
    }
    const at = new Date().toISOString();
    results.push({ recipient, status, attached: !!pdf, at, ...(error && { error }) });
    try {
      await appendEngagementEvent({
        proposalId: record.proposalId,
        event: "agreement_executed_email",
        proposalVersion: record.proposalVersion,
        detail: { agreementHash: record.agreementHash, recipient, to, status, attached: !!pdf, key: options.keySuffix?.[recipient] ?? "0", ...(deduplicated && { deduplicated }), ...(error && { error }) },
      });
    } catch (eventError) {
      console.error(`Couldn't record the executed agreement email outcome for ${record.proposalId}:`, eventError);
    }
  }
  return results;
}

export type FollowUpRecipient = "client" | "provider";
const RECIPIENTS: FollowUpRecipient[] = ["client", "provider"];

/**
 * Runs the parts of the execution follow-up that haven't been recorded:
 * onboarding (if no outcome is logged) and the executed-copy email to each
 * recipient without a recorded successful send. `resend` re-sends the copy to
 * those recipients even if it went out before (the admin "Resend" action).
 * Idempotency keys are stable per recipient until a failure is recorded (see
 * `executedEmailKeySuffix`), so concurrent, interrupted or
 * repeated calls share keys instead of sending twice.
 */
export async function completeExecutionFollowUp(
  origin: string,
  record: AgreementRecord,
  options: { resend?: FollowUpRecipient[]; projectTitle?: string; clientName?: string } = {}
): Promise<{ onboarding: Pick<Onboarding, "assets" | "tracker"> | null; emails: AgreementActivity["executedEmails"] }> {
  if (record.status !== "executed" || !record.clientSignature) return { onboarding: null, emails: [] };
  const events = await readProposalEngagementEvents(record.proposalId);
  const activity = foldAgreementActivity(events, record.agreementHash);

  // The signing event is best-effort at commit time: restore it if it's missing.
  const signedAt = record.clientSignature.signedAt;
  const signingRecorded = events.some((e) => e.event === "agreement_client_signed" && e.detail.agreementHash === record.agreementHash);
  if (!signingRecorded) {
    try {
      await appendEngagementEvent({
        proposalId: record.proposalId,
        event: "agreement_client_signed",
        proposalVersion: record.proposalVersion,
        detail: { ...clientSignedEventDetail(record), restored: true },
        ip: record.clientSignature.ip,
        userAgent: record.clientSignature.userAgent,
      });
    } catch (error) {
      console.error(`Couldn't restore the signing event for ${record.proposalId} (${signedAt}):`, error);
    }
  }

  const owed = !activity.onboarding || onboardingFailed(activity.onboarding);
  const onboarding = owed ? await unlockOnboarding(record) : null;
  const assets = onboarding?.assets ?? activity.onboarding?.assets;

  const sentTo = new Set(activity.executedEmails.filter((m) => m.status === "sent").map((m) => m.recipient));
  const recipients = RECIPIENTS.filter((r) => !sentTo.has(r) || options.resend?.includes(r));
  let emails: AgreementActivity["executedEmails"] = [];
  if (recipients.length) {
    const proposal = options.projectTitle ? null : await getProposalById(record.proposalId);
    emails = await sendExecutedCopies(origin, record, {
      recipients,
      keySuffix: Object.fromEntries(recipients.map((r) => [r, executedEmailKeySuffix(events, record.agreementHash, r, sentTo.has(r))])),
      assetsUnlocked: assets === "unlocked" || assets === "already",
      projectTitle: options.projectTitle ?? proposal?.data.title ?? record.proposalId,
      clientName: options.clientName ?? record.clientName,
    });
  }
  return { onboarding, emails };
}

/** The `agreement_client_signed` event detail for an executed record (at commit, or restored later). */
export function clientSignedEventDetail(record: AgreementRecord): Record<string, unknown> {
  const client = record.clientSignature;
  return {
    agreementHash: record.agreementHash,
    snapshot: { agreementHash: record.agreementHash, signedAt: client?.signedAt },
    legalName: client?.legalName,
    organisation: client?.organisation,
    capacity: client?.capacity,
    email: client?.email,
    verification: client?.verification,
  };
}

/**
 * The idempotency-key suffix for one recipient's executed-copy email.
 *
 * - Not yet delivered: the number of *recorded failures* for that recipient.
 *   An attempt whose outcome is unknown (still running, or its outcome event
 *   was lost) keeps the same key, so a retry or a concurrent follow-up is
 *   recognised by Resend and not delivered twice; only a recorded failure
 *   earns a fresh key.
 * - Already delivered and explicitly resent (admin "Resend"): a separate
 *   series numbered by that recipient's recorded outcomes, so a deliberate
 *   resend is delivered while a double click shares one key.
 */
export function executedEmailKeySuffix(
  events: { event: string; detail: Record<string, unknown> }[],
  agreementHash: string,
  recipient: FollowUpRecipient,
  alreadyDelivered: boolean
): string {
  const outcomes = events.filter((e) => e.event === "agreement_executed_email" && e.detail.agreementHash === agreementHash && e.detail.recipient === recipient);
  if (alreadyDelivered) return `resend-${outcomes.length}`;
  return String(outcomes.filter((e) => e.detail.status === "failed").length);
}
