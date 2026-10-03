"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Mail, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface AgreementSignInGateProps {
  proposalId: string;
}

const inputClass =
  "w-full px-12 py-3 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 text-[var(--andromeda-text-primary)] placeholder:text-[var(--andromeda-text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50 focus:border-transparent transition-all text-center text-lg tracking-widest";
const primaryButton =
  "w-full bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed";

/**
 * Before the signing form: the proposal access code, then a one-time code
 * emailed to the client's address on file. On success the server sets a
 * signer session and the page re-renders with the agreement.
 */
export function AgreementSignInGate({ proposalId }: AgreementSignInGateProps) {
  const router = useRouter();
  const { trackAgreementCodeRequested, trackAgreementCodeVerified } = useAnalytics();
  const [step, setStep] = useState<"access" | "code">("access");
  const [accessCode, setAccessCode] = useState("");
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const post = async (url: string, body: object) => {
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: response.ok, data: (await response.json().catch(() => ({}))) as { error?: string; sentTo?: string } };
  };

  const requestCode = async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/proposal/agreement/code", { proposalId, accessCode: accessCode.trim() });
      if (!ok) return setError(data.error ?? "Couldn't send the code. Try again.");
      trackAgreementCodeRequested({ proposal_id: proposalId });
      setSentTo(data.sentTo ?? "your email address");
      setCode("");
      setStep("code");
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post("/api/proposal/agreement/verify", { code });
      if (!ok) return setError(data.error ?? "Couldn't verify the code. Try again.");
      trackAgreementCodeVerified({ proposal_id: proposalId });
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--andromeda-primary)] px-6 py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-4 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
            {step === "access" ? <PenLine className="w-8 h-8 text-[var(--andromeda-accent-beige)]" /> : <Mail className="w-8 h-8 text-[var(--andromeda-accent-beige)]" />}
          </div>
        </div>

        {step === "access" ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-[var(--andromeda-text-primary)] mb-3">Service Agreement</h1>
            <p className="text-center text-[var(--andromeda-text-secondary)] mb-8">
              Enter your proposal access code. We&apos;ll then email a one-time code to the address on file to confirm it&apos;s you.
            </p>
            <form onSubmit={requestCode} className="space-y-4">
              <div className="relative">
                <label htmlFor="agreementAccessCode" className="sr-only">
                  Access code
                </label>
                <input
                  id="agreementAccessCode"
                  type={showAccessCode ? "text" : "password"}
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className={`${inputClass} uppercase`}
                  autoComplete="off"
                  autoFocus
                  disabled={busy}
                />
                <button
                  type="button"
                  onClick={() => setShowAccessCode(!showAccessCode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[var(--andromeda-text-secondary)]/50 hover:text-[var(--andromeda-text-primary)] transition-colors focus:outline-none"
                  disabled={busy}
                  aria-label={showAccessCode ? "Hide access code" : "Show access code"}
                >
                  {showAccessCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <ErrorNote error={error} />
              <Button type="submit" disabled={busy || !accessCode.trim()} className={primaryButton}>
                {busy ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending code…
                  </>
                ) : (
                  <>
                    Email me a code <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-[var(--andromeda-text-primary)] mb-3">Check your email</h1>
            <p className="text-center text-[var(--andromeda-text-secondary)] mb-8">
              We sent a 6-digit code to <span className="text-[var(--andromeda-text-primary)]">{sentTo}</span>. It&apos;s valid for 10 minutes.
            </p>
            <form onSubmit={verifyCode} className="space-y-4">
              <label htmlFor="agreementCode" className="sr-only">
                6-digit code
              </label>
              <input
                id="agreementCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ""))}
                placeholder="000000"
                className={inputClass}
                autoFocus
                disabled={busy}
              />
              <ErrorNote error={error} />
              <Button type="submit" disabled={busy || code.replace(/\s/g, "").length !== 6} className={primaryButton}>
                {busy ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    Continue to the agreement <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-[var(--andromeda-text-secondary)]">
                Didn&apos;t get it?{" "}
                <button type="button" onClick={() => requestCode()} disabled={busy} className="underline hover:text-[var(--andromeda-accent-beige)] disabled:opacity-50">
                  Send a new code
                </button>
              </p>
            </form>
          </>
        )}

        <p className="text-center text-xs text-[var(--andromeda-text-secondary)]/60 mt-8">
          This agreement contains confidential information intended only for the recipient. If you received this link in error, please disregard.
        </p>
      </motion.div>
    </div>
  );
}

function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm">{error}</span>
    </motion.div>
  );
}
