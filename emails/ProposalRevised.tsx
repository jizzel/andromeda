import type { CSSProperties } from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

interface ProposalRevisedEmailProps {
  clientName: string;
  projectTitle: string;
  note?: string;
  /** Formatted offer expiry, e.g. "16 October 2026". */
  validUntil: string;
  proposalUrl: string;
  senderName: string;
}

/** Sent to the client when Joseph publishes a revised proposal. Never contains the access code. */
export function ProposalRevisedEmail({ clientName, projectTitle, note, validUntil, proposalUrl, senderName }: ProposalRevisedEmailProps) {
  const firstName = clientName.trim().split(" ")[0] || clientName;
  const preview = `Your revised proposal for ${projectTitle} is ready to review.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>{projectTitle}</Text>
          <Heading style={heading}>Revised proposal ready</Heading>
          <Text style={subheading}>Updated terms are waiting for your review.</Text>

          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            We&apos;ve revised the proposal for <strong>{projectTitle}</strong>. Please review the updated terms,
            then accept them or let us know what else you&apos;d like to change.
          </Text>

          {note && (
            <Section style={noteBlock}>
              <Text style={noteLabel}>What changed</Text>
              <Text style={noteText}>{note}</Text>
            </Section>
          )}

          <Section style={ctaWrapper}>
            <Link style={cta} href={proposalUrl}>
              Review the revised proposal
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={metaText}>This offer is valid until {validUntil}.</Text>
          <Text style={metaText}>Use the same access code as before to open it.</Text>
          <Text style={signoff}>— {senderName}</Text>
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
  whiteSpace: "pre-line",
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

export default ProposalRevisedEmail;
