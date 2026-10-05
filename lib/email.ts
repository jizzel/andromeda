import { Resend } from "resend";
import { MilestoneUpdateEmail } from "@/emails/MilestoneUpdate";
import { ClientApprovalNoticeEmail } from "@/emails/ClientApprovalNotice";
import { WeeklyUpdateEmail } from "@/emails/WeeklyUpdate";
import {
  ProposalResponseNoticeEmail,
  type ProposalResponseKind,
} from "@/emails/ProposalResponseNotice";
import { AdminSignInCodeEmail, AdminSignInNoticeEmail } from "@/emails/AdminSignIn";
import { ProposalRevisedEmail } from "@/emails/ProposalRevised";
import { TrackerLiveEmail } from "@/emails/TrackerLive";
import { AgreementChangesRequestedEmail, AgreementExecutedEmail, AgreementReadyEmail, AgreementSignInCodeEmail } from "@/emails/Agreement";
import { profile } from "@/constants/profile";

interface SendMilestoneEmailArgs {
  to: string;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  phaseTitle: string;
  milestoneLabel: string;
  note?: string;
}

export async function sendMilestoneEmail(args: SendMilestoneEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }

  const resend = new Resend(apiKey);
  const trackerUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}/tracker`;
  const senderName = profile.name;

  const result = await resend.emails.send({
    from,
    to: args.to,
    subject: `${args.projectTitle} — ${args.milestoneLabel}`,
    react: MilestoneUpdateEmail({
      clientName: args.clientName,
      projectTitle: args.projectTitle,
      phaseTitle: args.phaseTitle,
      milestoneLabel: args.milestoneLabel,
      note: args.note,
      trackerUrl,
      senderName,
    }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

interface WeeklyUpdateItem {
  label: string;
  date?: string;
}

interface SendWeeklyUpdateArgs {
  to: string;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  dateRange: string;
  /** Day of the week the report covers, e.g. "Friday". Decoupled from cron
   *  schedule so the email template doesn't bake in scheduling assumptions. */
  weekEndingDay: string;
  weekEndingDate: string;
  completed: WeeklyUpdateItem[];
  inProgress: WeeklyUpdateItem[];
  comingUp: WeeklyUpdateItem[];
  note?: string;
}

export async function sendWeeklyUpdate(args: SendWeeklyUpdateArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }

  const resend = new Resend(apiKey);
  const trackerUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}/tracker`;
  const senderName = profile.name;

  const result = await resend.emails.send({
    from,
    to: args.to,
    subject: `${args.projectTitle} — weekly update (week ending ${args.weekEndingDate})`,
    react: WeeklyUpdateEmail({
      clientName: args.clientName,
      projectTitle: args.projectTitle,
      dateRange: args.dateRange,
      weekEndingDay: args.weekEndingDay,
      completed: args.completed,
      inProgress: args.inProgress,
      comingUp: args.comingUp,
      note: args.note,
      trackerUrl,
      senderName,
    }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

interface SendClientApprovalNoticeArgs {
  clientName: string;
  proposalId: string;
  projectTitle: string;
  phaseTitle: string;
  milestoneLabel: string;
  approvedAt: string;
}

export async function sendClientApprovalNotice(args: SendClientApprovalNoticeArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }

  const resend = new Resend(apiKey);
  const trackerUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}/tracker`;

  const result = await resend.emails.send({
    from,
    to: profile.email,
    subject: `[Approval] ${args.projectTitle} — ${args.milestoneLabel}`,
    react: ClientApprovalNoticeEmail({
      recipientName: profile.firstName,
      clientName: args.clientName,
      projectTitle: args.projectTitle,
      phaseTitle: args.phaseTitle,
      milestoneLabel: args.milestoneLabel,
      approvedAt: args.approvedAt,
      trackerUrl,
    }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

interface SendProposalResponseNoticeArgs {
  kind: ProposalResponseKind;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  packageName?: string;
  paymentPlanName?: string;
  counterNote?: string;
  submittedAt: string;
  proposalVersion?: string;
  snapshotFailed?: boolean;
}

export async function sendProposalResponseNotice(args: SendProposalResponseNoticeArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }

  const resend = new Resend(apiKey);
  const proposalUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}`;
  const tag = args.kind === "accepted" ? "[Accepted]" : "[Changes requested]";

  const result = await resend.emails.send({
    from,
    to: profile.email,
    subject: `${tag} ${args.projectTitle} — ${args.clientName}`,
    react: ProposalResponseNoticeEmail({
      recipientName: profile.firstName,
      kind: args.kind,
      clientName: args.clientName,
      projectTitle: args.projectTitle,
      packageName: args.packageName,
      paymentPlanName: args.paymentPlanName,
      counterNote: args.counterNote,
      submittedAt: args.submittedAt,
      proposalUrl,
      proposalVersion: args.proposalVersion,
      snapshotFailed: args.snapshotFailed,
    }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

// Admin sign-in emails always go to the profile address — never a request-supplied one.

export async function sendAdminSignInCode(args: { code: string; expiresInMinutes: number; ip: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Missing RESEND_API_KEY or NOTIFICATION_FROM_EMAIL env vars");

  const result = await new Resend(apiKey).emails.send({
    from,
    to: profile.email,
    subject: `Admin sign-in code: ${args.code}`,
    react: AdminSignInCodeEmail({ recipientName: profile.firstName, ...args }),
  });
  if (result.error) throw new Error(`Resend send failed: ${result.error.message}`);
}

export async function sendAdminSignInNotice(args: { signedInAt: string; ip: string; userAgent: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Missing RESEND_API_KEY or NOTIFICATION_FROM_EMAIL env vars");

  const result = await new Resend(apiKey).emails.send({
    from,
    to: profile.email,
    subject: "New admin sign-in",
    react: AdminSignInNoticeEmail({ recipientName: profile.firstName, ...args }),
  });
  if (result.error) throw new Error(`Resend send failed: ${result.error.message}`);
}

/**
 * Resend refused the send because an earlier request with the same
 * idempotency key was already accepted (or is in flight): the email went out
 * (or is going out) once already — don't count it as a failure to retry.
 */
export class DuplicateEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateEmailError";
  }
}

interface SendProposalRevisedArgs {
  /** The proposal's `client.email` — always from the saved data, never from a request. */
  to: string;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  note?: string;
  expiryDate: string;
  /** Stable per send attempt; Resend drops a repeat of a key it has already accepted (24 h). */
  idempotencyKey: string;
}

/** Tells the client a revised proposal is ready (Phase C "Publish revision"). */
export async function sendProposalRevised(args: SendProposalRevisedArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }

  const resend = new Resend(apiKey);
  const proposalUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}`;
  const validUntil = new Date(`${args.expiryDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const result = await resend.emails.send(
    {
      from,
      to: args.to,
      replyTo: profile.email,
      subject: `${args.projectTitle} — revised proposal ready`,
      react: ProposalRevisedEmail({
        clientName: args.clientName,
        projectTitle: args.projectTitle,
        note: args.note,
        validUntil,
        proposalUrl,
        senderName: profile.name,
      }),
    },
    { idempotencyKey: args.idempotencyKey }
  );

  if (result.error) {
    // Same key as an accepted (or in-flight) request: that one is the email.
    if (result.error.name === "invalid_idempotent_request" || result.error.name === "concurrent_idempotent_requests") {
      throw new DuplicateEmailError(`Resend already has this email from an earlier attempt (${result.error.message})`);
    }
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}

// --- Agreements -----------------------------------------------------------------
// Client-facing agreement emails go only to the proposal's saved `client.email`
// (callers pass it from storage, never from a request), reply to Joseph, and
// never contain the access code.

function agreementEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!apiKey || !from || !siteUrl) {
    throw new Error("Missing RESEND_API_KEY, NOTIFICATION_FROM_EMAIL, or NEXT_PUBLIC_SITE_URL env vars");
  }
  return { resend: new Resend(apiKey), from, site: siteUrl.replace(/\/$/, "") };
}

function throwIfFailed(result: { error: { name: string; message: string } | null }): void {
  if (!result.error) return;
  if (result.error.name === "invalid_idempotent_request" || result.error.name === "concurrent_idempotent_requests") {
    throw new DuplicateEmailError(`Resend already has this email from an earlier attempt (${result.error.message})`);
  }
  throw new Error(`Resend send failed: ${result.error.message}`);
}

const longDate = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const longDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

export const agreementPageUrl = (site: string, proposalId: string) => `${site}/proposal/${encodeURIComponent(proposalId)}/agreement`;

/** "Your agreement is ready to sign" — the signing link. */
export async function sendAgreementReady(args: {
  to: string;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  /** The agreement's client-facing title (`clientTitleOf`). */
  documentTitle: string;
  offerValidUntil: string;
  idempotencyKey: string;
}): Promise<void> {
  const { resend, from, site } = agreementEmailConfig();
  const result = await resend.emails.send(
    {
      from,
      to: args.to,
      replyTo: profile.email,
      subject: `${args.projectTitle} — your ${args.documentTitle.toLowerCase()} is ready to sign`,
      react: AgreementReadyEmail({
        clientName: args.clientName,
        documentTitle: args.documentTitle,
        projectTitle: args.projectTitle,
        agreementUrl: agreementPageUrl(site, args.proposalId),
        validUntil: longDate(args.offerValidUntil),
        senderName: profile.name,
      }),
    },
    { idempotencyKey: args.idempotencyKey }
  );
  throwIfFailed(result);
}

/** The one-time code that verifies the signer controls the client address. */
export async function sendAgreementSignInCode(args: { to: string; clientName: string; projectTitle: string; code: string; expiresInMinutes: number }): Promise<void> {
  const { resend, from } = agreementEmailConfig();
  const result = await resend.emails.send({
    from,
    to: args.to,
    replyTo: profile.email,
    subject: `Your signing code: ${args.code}`,
    react: AgreementSignInCodeEmail(args),
  });
  throwIfFailed(result);
}

/** The executed agreement, to the client or to Joseph, with the PDF attached when it rendered. */
export async function sendAgreementExecuted(args: {
  to: string;
  recipient: "client" | "provider";
  clientName: string;
  proposalId: string;
  projectTitle: string;
  /** The agreement's client-facing title (`clientTitleOf`). */
  documentTitle: string;
  signedBy: string;
  signedAt: string;
  agreementHash: string;
  pdf: { filename: string; content: Buffer } | null;
  assetsUnlocked: boolean;
  idempotencyKey: string;
}): Promise<void> {
  const { resend, from, site } = agreementEmailConfig();
  const result = await resend.emails.send(
    {
      from,
      to: args.to,
      ...(args.recipient === "client" && { replyTo: profile.email }),
      subject: `${args.projectTitle} — ${args.documentTitle.toLowerCase()} signed`,
      react: AgreementExecutedEmail({
        recipient: args.recipient,
        documentTitle: args.documentTitle,
        clientName: args.clientName,
        projectTitle: args.projectTitle,
        signedBy: args.signedBy,
        signedAt: longDateTime(args.signedAt),
        agreementHashShort: args.agreementHash.slice(0, 12),
        attached: !!args.pdf,
        agreementUrl: args.recipient === "client" ? agreementPageUrl(site, args.proposalId) : `${site}/admin/proposals/${encodeURIComponent(args.proposalId)}/agreement`,
        assetsUrl: args.assetsUnlocked ? `${site}/proposal/${encodeURIComponent(args.proposalId)}/assets` : undefined,
        senderName: profile.name,
      }),
      ...(args.pdf && { attachments: [{ filename: args.pdf.filename, content: args.pdf.content }] }),
    },
    { idempotencyKey: args.idempotencyKey }
  );
  throwIfFailed(result);
}

/** Tells Joseph the client asked for changes to the agreement. */
export async function sendAgreementChangesRequested(args: {
  clientName: string;
  proposalId: string;
  projectTitle: string;
  note: string;
  requestedAt: string;
  agreementHash: string;
}): Promise<void> {
  const { resend, from, site } = agreementEmailConfig();
  const result = await resend.emails.send({
    from,
    to: profile.email,
    subject: `${args.projectTitle} — ${args.clientName} asked for changes to the agreement`,
    react: AgreementChangesRequestedEmail({
      clientName: args.clientName,
      projectTitle: args.projectTitle,
      note: args.note,
      requestedAt: longDateTime(args.requestedAt),
      agreementHashShort: args.agreementHash.slice(0, 12),
      adminUrl: `${site}/admin/proposals/${encodeURIComponent(args.proposalId)}/agreement`,
    }),
  });
  throwIfFailed(result);
}

/** "Your project tracker is live" — once, when the client's Progress tab opens. */
export async function sendTrackerLive(args: {
  to: string;
  clientName: string;
  proposalId: string;
  projectTitle: string;
  completed: string[];
  idempotencyKey: string;
}): Promise<void> {
  const { resend, from, site } = agreementEmailConfig();
  const result = await resend.emails.send(
    {
      from,
      to: args.to,
      replyTo: profile.email,
      subject: `${args.projectTitle} — your project tracker is live`,
      react: TrackerLiveEmail({
        clientName: args.clientName,
        projectTitle: args.projectTitle,
        completed: args.completed,
        trackerUrl: `${site}/proposal/${encodeURIComponent(args.proposalId)}/tracker`,
        senderName: profile.name,
      }),
    },
    { idempotencyKey: args.idempotencyKey }
  );
  throwIfFailed(result);
}
