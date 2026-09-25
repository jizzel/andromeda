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

export type ProposalResponseKind = "accepted" | "counter" | "counter-updated";

interface ProposalResponseNoticeEmailProps {
  recipientName: string;
  kind: ProposalResponseKind;
  clientName: string;
  projectTitle: string;
  packageName?: string;
  paymentPlanName?: string;
  counterNote?: string;
  submittedAt: string;
  proposalUrl: string;
}

const EYEBROW: Record<ProposalResponseKind, string> = {
  accepted: "Proposal accepted",
  counter: "Counter-proposal",
  "counter-updated": "Counter-proposal updated",
};

export function ProposalResponseNoticeEmail({
  recipientName,
  kind,
  clientName,
  projectTitle,
  packageName,
  paymentPlanName,
  counterNote,
  submittedAt,
  proposalUrl,
}: ProposalResponseNoticeEmailProps) {
  const firstName = recipientName.trim().split(" ")[0] || recipientName;
  const preview =
    kind === "accepted"
      ? `${clientName} accepted ${projectTitle}.`
      : `${clientName} sent a counter-proposal on ${projectTitle}.`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>{EYEBROW[kind]}</Text>
          <Heading style={heading}>{projectTitle}</Heading>
          <Text style={subheading}>From {clientName}.</Text>

          <Text style={paragraph}>Hi {firstName},</Text>
          <Text style={paragraph}>
            {kind === "accepted" ? (
              <>
                <strong>{clientName}</strong> has accepted the proposal as presented.
              </>
            ) : kind === "counter" ? (
              <>
                <strong>{clientName}</strong> has responded with requested changes.
              </>
            ) : (
              <>
                <strong>{clientName}</strong> has updated their requested changes.
              </>
            )}
          </Text>

          {(packageName || paymentPlanName) && (
            <Section style={detailBox}>
              {packageName && <Text style={detailText}>Package: {packageName}</Text>}
              {paymentPlanName && <Text style={detailText}>Payment plan: {paymentPlanName}</Text>}
            </Section>
          )}

          {counterNote && (
            <Section style={noteBox}>
              <Text style={noteLabel}>Requested changes</Text>
              <Text style={noteText}>{counterNote}</Text>
            </Section>
          )}

          <Section style={ctaWrapper}>
            <Link style={cta} href={proposalUrl}>
              Open proposal
            </Link>
          </Section>

          <Hr style={divider} />
          <Text style={metaText}>Submitted at: {submittedAt}</Text>
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

const detailBox: CSSProperties = {
  backgroundColor: "#211f1c",
  borderRadius: "8px",
  margin: "8px 0 16px 0",
  padding: "16px 20px",
};

const detailText: CSSProperties = {
  fontSize: "14px",
  lineHeight: "22px",
  margin: 0,
};

const noteBox: CSSProperties = {
  borderLeft: "3px solid #d4c4a0",
  margin: "8px 0 16px 0",
  padding: "4px 0 4px 16px",
};

const noteLabel: CSSProperties = {
  color: "#9a9082",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  margin: "0 0 8px 0",
  textTransform: "uppercase",
};

const noteText: CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: 0,
  whiteSpace: "pre-wrap",
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

export default ProposalResponseNoticeEmail;