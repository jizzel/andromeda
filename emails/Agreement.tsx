import type { CSSProperties, ReactNode } from "react";
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";

/**
 * Agreement emails (native agreements, PR 2). None of them ever contains the
 * proposal access code. Client-facing ones go to the proposal's saved
 * `client.email` only.
 */

const firstNameOf = (name: string) => name.trim().split(" ")[0] || name;

function Frame({ preview, eyebrow: eyebrowText, title, subtitle, children }: { preview: string; eyebrow: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={eyebrow}>{eyebrowText}</Text>
          <Heading style={heading}>{title}</Heading>
          <Text style={subheading}>{subtitle}</Text>
          {children}
        </Container>
      </Body>
    </Html>
  );
}

// --- To the client: the agreement is ready to sign -------------------------

interface AgreementReadyEmailProps {
  clientName: string;
  projectTitle: string;
  agreementUrl: string;
  /** Formatted, e.g. "16 October 2026". */
  validUntil: string;
  senderName: string;
}

export function AgreementReadyEmail({ clientName, projectTitle, agreementUrl, validUntil, senderName }: AgreementReadyEmailProps) {
  return (
    <Frame preview={`Your service agreement for ${projectTitle} is ready to sign.`} eyebrow={projectTitle} title="Your agreement is ready to sign" subtitle="The final step before work begins.">
      <Text style={paragraph}>Hi {firstNameOf(clientName)},</Text>
      <Text style={paragraph}>
        Thank you for accepting the proposal for <strong>{projectTitle}</strong>. Your service agreement for this engagement — which
        includes the proposal exactly as you accepted it — is ready for you to review and sign. I&apos;ve already signed it.
      </Text>
      <Section style={ctaWrapper}>
        <Link style={cta} href={agreementUrl}>
          Review and sign the agreement
        </Link>
      </Section>
      <Text style={paragraph}>
        You&apos;ll need your proposal access code, and we&apos;ll email a one-time code to this address to confirm it&apos;s you. If
        anything in the agreement needs changing, you can tell us on the same page.
      </Text>
      <Hr style={divider} />
      <Text style={metaText}>This offer to sign is open until {validUntil}.</Text>
      <Text style={signoff}>— {senderName}</Text>
    </Frame>
  );
}

// --- To the client: one-time signing code -----------------------------------

interface AgreementSignInCodeEmailProps {
  clientName: string;
  projectTitle: string;
  code: string;
  expiresInMinutes: number;
}

export function AgreementSignInCodeEmail({ clientName, projectTitle, code, expiresInMinutes }: AgreementSignInCodeEmailProps) {
  return (
    <Frame preview={`Your code to sign the ${projectTitle} agreement: ${code}`} eyebrow={projectTitle} title="Your signing code" subtitle={`Valid for ${expiresInMinutes} minutes, once.`}>
      <Text style={paragraph}>Hi {firstNameOf(clientName)},</Text>
      <Text style={paragraph}>Enter this code on the agreement page to continue to signing:</Text>
      <Text style={codeText}>{code}</Text>
      <Hr style={divider} />
      <Text style={metaText}>If you didn&apos;t request this code, you can ignore this email — nothing has been signed.</Text>
    </Frame>
  );
}

// --- To both parties: the executed agreement --------------------------------

interface AgreementExecutedEmailProps {
  recipient: "client" | "provider";
  clientName: string;
  projectTitle: string;
  signedBy: string;
  /** Formatted signing time. */
  signedAt: string;
  agreementHashShort: string;
  /** Whether the executed PDF is attached; otherwise the page link is the copy. */
  attached: boolean;
  agreementUrl: string;
  /** The proposal page, when signing unlocked the asset checklist there. */
  assetsUrl?: string;
  senderName: string;
}

export function AgreementExecutedEmail({ recipient, clientName, projectTitle, signedBy, signedAt, agreementHashShort, attached, agreementUrl, assetsUrl, senderName }: AgreementExecutedEmailProps) {
  const toClient = recipient === "client";
  return (
    <Frame
      preview={`The service agreement for ${projectTitle} is signed by both parties.`}
      eyebrow={projectTitle}
      title="Agreement signed"
      subtitle="Signed by both parties — the agreement is in effect."
    >
      <Text style={paragraph}>{toClient ? `Hi ${firstNameOf(clientName)},` : "Hi,"}</Text>
      <Text style={paragraph}>
        {toClient ? (
          <>
            Thank you — the service agreement for <strong>{projectTitle}</strong> is now signed by both parties.
          </>
        ) : (
          <>
            {clientName} has signed the service agreement for <strong>{projectTitle}</strong>.
          </>
        )}{" "}
        {attached ? "The executed agreement is attached for your records." : "The executed agreement is available on the agreement page."}
      </Text>
      <Section style={noteBlock}>
        <Text style={noteLabel}>Signed</Text>
        <Text style={noteText}>
          {signedBy} · {signedAt}
          {"\n"}Agreement {agreementHashShort}
        </Text>
      </Section>
      <Section style={ctaWrapper}>
        <Link style={cta} href={agreementUrl}>
          {attached ? "View the agreement online" : "Download the executed agreement"}
        </Link>
      </Section>
      {toClient && assetsUrl && (
        <Text style={paragraph}>
          Next comes onboarding: you can now share the project assets we need from{" "}
          <Link href={assetsUrl} style={inlineLink}>
            your proposal page
          </Link>
          .
        </Text>
      )}
      <Hr style={divider} />
      <Text style={signoff}>— {senderName}</Text>
    </Frame>
  );
}

// --- To Joseph: the client asked for changes ---------------------------------

interface AgreementChangesRequestedEmailProps {
  clientName: string;
  projectTitle: string;
  note: string;
  requestedAt: string;
  agreementHashShort: string;
  adminUrl: string;
}

export function AgreementChangesRequestedEmail({ clientName, projectTitle, note, requestedAt, agreementHashShort, adminUrl }: AgreementChangesRequestedEmailProps) {
  return (
    <Frame preview={`${clientName} asked for changes to the ${projectTitle} agreement.`} eyebrow={projectTitle} title="Changes requested to the agreement" subtitle={`From ${clientName} · ${requestedAt}`}>
      <Section style={noteBlock}>
        <Text style={noteLabel}>Their note</Text>
        <Text style={noteText}>{note}</Text>
      </Section>
      <Text style={paragraph}>
        The agreement is unchanged and still open for signing. To revise it, edit it in admin — that voids your signature and
        withdraws the link — then sign and send it again.
      </Text>
      <Section style={ctaWrapper}>
        <Link style={cta} href={adminUrl}>
          Open the agreement
        </Link>
      </Section>
      <Hr style={divider} />
      <Text style={metaText}>Agreement {agreementHashShort}</Text>
    </Frame>
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

const codeText: CSSProperties = {
  color: "#f5efe0",
  fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace",
  fontSize: "32px",
  fontWeight: 600,
  letterSpacing: "0.3em",
  margin: "8px 0 24px 0",
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

const inlineLink: CSSProperties = {
  color: "#d4c4a0",
  textDecoration: "underline",
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
