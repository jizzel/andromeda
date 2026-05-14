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

interface MilestoneUpdateEmailProps {
  clientName: string;
  projectTitle: string;
  phaseTitle: string;
  milestoneLabel: string;
  note?: string;
  trackerUrl: string;
  senderName: string;
}

export function MilestoneUpdateEmail({
  clientName,
  projectTitle,
  phaseTitle,
  milestoneLabel,
  note,
  trackerUrl,
  senderName,
}: MilestoneUpdateEmailProps) {
  const firstName = clientName.trim().split(" ")[0] || clientName;
  const preview = `${milestoneLabel} is complete — here's your update on ${projectTitle}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>{projectTitle}</Text>
          <Heading style={heading}>{milestoneLabel}</Heading>
          <Text style={subheading}>This step is now complete.</Text>

          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            A quick update on your project: <strong>{milestoneLabel}</strong> is done.
            You can see this and the rest of the work in progress on your tracker.
          </Text>

          {note && (
            <Section style={noteBlock}>
              <Text style={noteLabel}>Note from {senderName}</Text>
              <Text style={noteText}>{note}</Text>
            </Section>
          )}

          <Section style={ctaWrapper}>
            <Link style={cta} href={trackerUrl}>
              View project tracker
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={metaText}>
            Phase: {phaseTitle}
          </Text>
          <Text style={signoff}>
            — {senderName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

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

const metaText: CSSProperties = {
  color: "#9a9082",
  fontSize: "12px",
  margin: "0 0 4px 0",
};

const signoff: CSSProperties = {
  color: "#cfc8b6",
  fontSize: "14px",
  margin: "16px 0 0 0",
};

export default MilestoneUpdateEmail;
