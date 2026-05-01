import { Resend } from "resend";
import { MilestoneUpdateEmail } from "@/emails/MilestoneUpdate";

interface SendMilestoneEmailArgs {
  to: string;
  clientName: string;
  proposalId: string;
  phaseTitle: string;
  milestoneLabel: string;
  note?: string;
}

export async function sendMilestoneEmail(args: SendMilestoneEmailArgs): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFICATION_FROM_EMAIL;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://attakorah.com";

  if (!apiKey || !from) {
    throw new Error("Missing RESEND_API_KEY or NOTIFICATION_FROM_EMAIL env vars");
  }

  const resend = new Resend(apiKey);
  const trackerUrl = `${siteUrl.replace(/\/$/, "")}/proposal/${args.proposalId}/tracker`;

  const result = await resend.emails.send({
    from,
    to: args.to,
    subject: `Project update: ${args.milestoneLabel}`,
    react: MilestoneUpdateEmail({
      clientName: args.clientName,
      phaseTitle: args.phaseTitle,
      milestoneLabel: args.milestoneLabel,
      note: args.note,
      trackerUrl,
    }),
  });

  if (result.error) {
    throw new Error(`Resend send failed: ${result.error.message}`);
  }
}
