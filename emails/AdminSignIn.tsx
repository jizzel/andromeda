import type { CSSProperties } from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";

interface AdminSignInCodeEmailProps {
  recipientName: string;
  code: string;
  expiresInMinutes: number;
  ip: string;
}

/** One-time code for the /admin sign-in (sent only to the profile email). */
export function AdminSignInCodeEmail({ recipientName, code, expiresInMinutes, ip }: AdminSignInCodeEmailProps) {
  const firstName = recipientName.trim().split(" ")[0] || recipientName;
  return (
    <Html>
      <Head />
      <Preview>{`Your Andromeda admin sign-in code: ${code}`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Admin sign-in</Text>
          <Heading style={codeStyle}>{code}</Heading>
          <Text style={paragraph}>
            Hi {firstName}, use this code to sign in to the admin dashboard. It expires in {expiresInMinutes}{" "}
            minutes and works once.
          </Text>
          <Text style={paragraph}>If you didn&apos;t request it, ignore this email. No one can sign in without the code.</Text>
          <Hr style={divider} />
          <Text style={metaText}>Requested from: {ip}</Text>
        </Container>
      </Body>
    </Html>
  );
}

interface AdminSignInNoticeEmailProps {
  recipientName: string;
  signedInAt: string;
  ip: string;
  userAgent: string;
}

/** Sent after every successful admin sign-in, so an unexpected one is noticed. */
export function AdminSignInNoticeEmail({ recipientName, signedInAt, ip, userAgent }: AdminSignInNoticeEmailProps) {
  const firstName = recipientName.trim().split(" ")[0] || recipientName;
  return (
    <Html>
      <Head />
      <Preview>New admin sign-in</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>Security notice</Text>
          <Heading style={heading}>New admin sign-in</Heading>
          <Text style={paragraph}>
            Hi {firstName}, someone signed in to the Andromeda admin dashboard. If this wasn&apos;t you, rotate
            ADMIN_SESSION_SECRET in Vercel, which signs everyone out immediately.
          </Text>
          <Hr style={divider} />
          <Text style={metaText}>Signed in at: {signedInAt}</Text>
          <Text style={metaText}>IP: {ip}</Text>
          <Text style={metaText}>Device: {userAgent}</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body: CSSProperties = {
  backgroundColor: "#0d0d0d",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
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
  margin: "0 0 24px 0",
};

const codeStyle: CSSProperties = {
  color: "#f5efe0",
  fontFamily: "'SF Mono', Menlo, Consolas, monospace",
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "0.3em",
  margin: "0 0 24px 0",
};

const paragraph: CSSProperties = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px 0",
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
