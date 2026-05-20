import { Resend } from "resend";
import { MilestoneUpdateEmail } from "@/emails/MilestoneUpdate";
import { ClientApprovalNoticeEmail } from "@/emails/ClientApprovalNotice";
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
