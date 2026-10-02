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
