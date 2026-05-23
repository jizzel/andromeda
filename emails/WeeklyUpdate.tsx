import type { CSSProperties } from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface WeeklyUpdateItem {
  label: string;
  /** Optional ISO date — rendered alongside the label where useful. */
  date?: string;
}

interface WeeklyUpdateEmailProps {
  clientName: string;
  projectTitle: string;
  dateRange: string;
  /** Day of the week the report covers, e.g. "Friday". Decoupled from cron
   *  schedule so the email template doesn't bake in scheduling assumptions. */
  weekEndingDay: string;
  completed: WeeklyUpdateItem[];
  inProgress: WeeklyUpdateItem[];
  comingUp: WeeklyUpdateItem[];
  note?: string;
  trackerUrl: string;
  senderName: string;
}

export function WeeklyUpdateEmail({
  clientName,
  projectTitle,
  dateRange,
  weekEndingDay,
  completed,
  inProgress,
  comingUp,
  note,
  trackerUrl,
  senderName,
}: WeeklyUpdateEmailProps) {
  const firstName = clientName.trim().split(" ")[0] || clientName;
  const preview = `Weekly update on ${projectTitle} — ${completed.length} completed, ${inProgress.length} in progress.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Weekly update</Text>
          <Heading style={heading}>{projectTitle}</Heading>
          <Text style={subheading}>Week ending {weekEndingDay}, {dateRange}</Text>

          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            Here&apos;s where things stand on your project this week.
          </Text>

          {completed.length > 0 && (
            <ItemSection
              title="Completed this week"
              accentColor={ACCENT_DONE}
              items={completed}
              emptyHint={null}
            />
          )}

          {inProgress.length > 0 && (
            <ItemSection
              title="In progress"
              accentColor={ACCENT_IN_PROGRESS}
              items={inProgress}
              emptyHint={null}
            />
          )}

          {comingUp.length > 0 && (
            <ItemSection
              title="Coming up next"
              accentColor={ACCENT_PENDING}
              items={comingUp}
              emptyHint={null}
            />
          )}

          {note && (
            <Section style={noteBlock}>
              <Text style={noteLabel}>Note from {senderName}</Text>
              <Text style={noteText}>{note}</Text>
            </Section>
          )}

          <Section style={ctaWrapper}>
            <Link style={cta} href={trackerUrl}>
              View live tracker
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={signoff}>— {senderName}</Text>
        </Container>
      </Body>
    </Html>
  );
}

function ItemSection({
  title,
  accentColor,
  items,
  emptyHint,
}: {
  title: string;
  accentColor: string;
  items: WeeklyUpdateItem[];
  emptyHint: string | null;
}) {
  return (
    <Section style={section}>
      <Text style={{ ...sectionTitle, color: accentColor }}>{title}</Text>
      {items.length === 0 && emptyHint ? (
        <Text style={emptyText}>{emptyHint}</Text>
      ) : (
        items.map((item, idx) => (
          <Text key={idx} style={itemText}>
            <span style={{ ...itemDot, backgroundColor: accentColor }} />
            <strong style={itemLabel}>{item.label}</strong>
            {item.date && <span style={itemDate}> · {item.date}</span>}
          </Text>
        ))
      )}
    </Section>
  );
}

const ACCENT_DONE = "#34d399";
const ACCENT_IN_PROGRESS = "#d4c4a0";
const ACCENT_PENDING = "#9a9082";

const body: CSSProperties = {
  backgroundColor: "#0d0d0d",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  color: "#e8e3d5",
  margin: 0,
  padding: "40px 20px",
};

const container: CSSProperties = {
  backgroundColor: "#181715",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px",
};

const eyebrow: CSSProperties = {
  color: "#d4c4a0",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 8px 0",
  textTransform: "uppercase",
};

const heading: CSSProperties = {
  color: "#f5efe0",
  fontSize: "24px",
  fontWeight: 600,
  lineHeight: "32px",
  margin: "0 0 4px 0",
};

const subheading: CSSProperties = {
  color: "#9a9082",
  fontSize: "14px",
  margin: "0 0 32px 0",
};

const paragraph: CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const section: CSSProperties = {
  margin: "24px 0",
};

const sectionTitle: CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  margin: "0 0 12px 0",
};

const itemText: CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px 0",
  color: "#cfc8b6",
};

const itemDot: CSSProperties = {
  display: "inline-block",
  width: "6px",
  height: "6px",
  borderRadius: "3px",
  marginRight: "10px",
  verticalAlign: "middle",
};

const itemLabel: CSSProperties = {
  color: "#f5efe0",
  fontWeight: 500,
};

const itemDate: CSSProperties = {
  color: "#9a9082",
  fontSize: "13px",
};

const emptyText: CSSProperties = {
  fontSize: "13px",
  color: "#9a9082",
  fontStyle: "italic",
  margin: 0,
};

const noteBlock: CSSProperties = {
  backgroundColor: "#1f1d1a",
  borderLeft: "3px solid #d4c4a0",
  borderRadius: "0 6px 6px 0",
  margin: "24px 0",
  padding: "16px 18px",
};

const noteLabel: CSSProperties = {
  color: "#d4c4a0",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  margin: "0 0 6px 0",
  textTransform: "uppercase",
};

const noteText: CSSProperties = {
  color: "#cfc8b6",
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};

const ctaWrapper: CSSProperties = {
  margin: "32px 0 24px 0",
};

const cta: CSSProperties = {
  backgroundColor: "#d4c4a0",
  borderRadius: "8px",
  color: "#0d0d0d",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

const divider: CSSProperties = {
  borderColor: "#2a2825",
  margin: "32px 0 16px 0",
};

const signoff: CSSProperties = {
  color: "#cfc8b6",
  fontSize: "14px",
  margin: "16px 0 0 0",
};

export default WeeklyUpdateEmail;
