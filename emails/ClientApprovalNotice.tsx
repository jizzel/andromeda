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

interface ClientApprovalNoticeEmailProps {
  recipientName: string;
  clientName: string;
  projectTitle: string;
  phaseTitle: string;
  milestoneLabel: string;
  approvedAt: string;
  trackerUrl: string;
}

export function ClientApprovalNoticeEmail({
  recipientName,
  clientName,
  projectTitle,
  phaseTitle,
  milestoneLabel,
  approvedAt,
  trackerUrl,
}: ClientApprovalNoticeEmailProps) {
  const firstName = recipientName.trim().split(" ")[0] || recipientName;
  const preview = `${clientName} approved "${milestoneLabel}" on ${projectTitle}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Client approval</Text>
          <Heading style={heading}>{milestoneLabel}</Heading>
          <Text style={subheading}>Approved by {clientName}.</Text>

          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            <strong>{clientName}</strong> has approved <strong>{milestoneLabel}</strong> on
            {" "}<em>{projectTitle}</em>. The tracker has been updated automatically.
          </Text>

          <Section style={ctaWrapper}>
            <Link style={cta} href={trackerUrl}>
              Open tracker
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={metaText}>Phase: {phaseTitle}</Text>
          <Text style={metaText}>Approved at: {approvedAt}</Text>
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

export default ClientApprovalNoticeEmail;
