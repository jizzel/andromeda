import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MilestoneUpdateEmailProps {
  clientName: string;
  phaseTitle: string;
  milestoneLabel: string;
  note?: string;
  trackerUrl: string;
}

export function MilestoneUpdateEmail({
  clientName,
  phaseTitle,
  milestoneLabel,
  note,
  trackerUrl,
}: MilestoneUpdateEmailProps) {
  const preview = `${milestoneLabel} is complete in ${phaseTitle}.`;
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={heading}>Milestone update</Heading>
          <Text style={paragraph}>Hi {clientName},</Text>
          <Text style={paragraph}>
            <strong>{milestoneLabel}</strong> is complete in <em>{phaseTitle}</em>.
          </Text>
          {note && (
            <Section style={noteBlock}>
              <Text style={noteText}>{note}</Text>
            </Section>
          )}
          <Section style={ctaWrapper}>
            <Link style={cta} href={trackerUrl}>
              View project tracker
            </Link>
          </Section>
          <Text style={footer}>— Joseph</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#0d0d0d",
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
  color: "#e8e3d5",
  margin: 0,
  padding: "40px 20px",
};

const container: React.CSSProperties = {
  backgroundColor: "#181715",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "40px",
};

const heading: React.CSSProperties = {
  color: "#d4c4a0",
  fontSize: "20px",
  fontWeight: 600,
  margin: "0 0 24px 0",
};

const paragraph: React.CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
};

const noteBlock: React.CSSProperties = {
  borderLeft: "2px solid #d4c4a0",
  margin: "24px 0",
  padding: "4px 16px",
};

const noteText: React.CSSProperties = {
  color: "#cfc8b6",
  fontSize: "14px",
  fontStyle: "italic",
  lineHeight: "22px",
  margin: 0,
};

const ctaWrapper: React.CSSProperties = {
  margin: "32px 0",
};

const cta: React.CSSProperties = {
  backgroundColor: "#d4c4a0",
  borderRadius: "8px",
  color: "#0d0d0d",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

const footer: React.CSSProperties = {
  color: "#9a9082",
  fontSize: "13px",
  margin: "32px 0 0 0",
};

export default MilestoneUpdateEmail;
