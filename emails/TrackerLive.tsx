import { Hr, Link, Section, Text } from "@react-email/components";
import { Frame, engagementEmailStyles as s } from "./Agreement";

interface TrackerLiveEmailProps {
  clientName: string;
  projectTitle: string;
  /** Milestones already done, in tracker order: "Phase · Milestone". */
  completed: string[];
  trackerUrl: string;
  senderName: string;
}

/**
 * Sent once when a client's Progress tab opens (agreement executed, or
 * switched on): the tracker is live, and here's what's already done — in
 * place of separate emails for milestones completed while it was locked.
 */
export function TrackerLiveEmail({ clientName, projectTitle, completed, trackerUrl, senderName }: TrackerLiveEmailProps) {
  const firstName = clientName.trim().split(" ")[0] || clientName;
  return (
    <Frame preview={`Your project tracker for ${projectTitle} is live.`} eyebrow={projectTitle} title="Your project tracker is live" subtitle="Follow every milestone as the work moves forward.">
      <Text style={s.paragraph}>Hi {firstName},</Text>
      <Text style={s.paragraph}>
        You can now follow <strong>{projectTitle}</strong> on your project tracker. We&apos;ll email you as milestones are completed, and
        you&apos;ll get a short update every Friday.
      </Text>
      {completed.length > 0 && (
        <Section style={s.noteBlock}>
          <Text style={s.noteLabel}>Already done</Text>
          <Text style={s.noteText}>{completed.map((line) => `✓ ${line}`).join("\n")}</Text>
        </Section>
      )}
      <Section style={s.ctaWrapper}>
        <Link style={s.cta} href={trackerUrl}>
          Open your project tracker
        </Link>
      </Section>
      <Hr style={s.divider} />
      <Text style={s.metaText}>Use your proposal access code to sign in.</Text>
      <Text style={s.signoff}>— {senderName}</Text>
    </Frame>
  );
}

export default TrackerLiveEmail;
