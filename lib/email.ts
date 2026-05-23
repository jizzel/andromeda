import { Resend } from "resend";
import { MilestoneUpdateEmail } from "@/emails/MilestoneUpdate";
import { ClientApprovalNoticeEmail } from "@/emails/ClientApprovalNotice";
import { WeeklyUpdateEmail } from "@/emails/WeeklyUpdate";
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
