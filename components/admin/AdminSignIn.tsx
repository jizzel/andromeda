"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";

type Step = "request" | "verify";

/**
 * Two-step admin sign-in: email a one-time code to the profile address, then
 * enter it. The code is never shown or chosen here — only Joseph's inbox gets it.
 */
export function AdminSignIn() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("request");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Never rejects: a network failure comes back as an error result, so the
  // controls always become usable again.
  const post = async (url: string, body?: object): Promise<{ success?: boolean; error?: string }> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      return (await res.json().catch(() => ({}))) as { success?: boolean; error?: string };
    } catch {
      return { error: "Connection failed. Check your network and try again." };
    }
  };

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await post("/api/admin/login/request");
      if (data.success) {
        setStep("verify");
        setCode("");
      } else {
        setError(data.error || "Couldn't send a code.");
      }
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    let signedIn = false;
    try {
      const data = await post("/api/admin/login/verify", { code });
      if (data.success) {
        signedIn = true;
        router.replace("/admin");
        router.refresh();
      } else {
        setError(data.error || "Couldn't verify the code.");
      }
    } finally {
      // Stay disabled while navigating to the dashboard after success.
      if (!signedIn) setBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30">
            <Lock className="w-7 h-7 text-[var(--andromeda-accent-beige)]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Admin sign-in</h1>

        {step === "request" ? (
          <>
            <p className="text-sm text-center text-[var(--andromeda-text-secondary)] mb-8">
              A one-time code will be emailed to the site owner&apos;s address.
            </p>
            <button
              type="button"
              onClick={requestCode}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Email me a sign-in code
            </button>
          </>
        ) : (
          <form onSubmit={verifyCode}>
            <p className="text-sm text-center text-[var(--andromeda-text-secondary)] mb-8">
              Enter the 6-digit code from your inbox. It expires in 10 minutes.
            </p>
            <label htmlFor="admin-code" className="sr-only">
              Sign-in code
            </label>
            <input
              id="admin-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              placeholder="000000"
              className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 mb-4 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--andromeda-accent-beige)]/50"
            />
            <button
              type="submit"
              disabled={busy || code.length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 disabled:opacity-50"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
            <button
              type="button"
              onClick={requestCode}
              disabled={busy}
              className="w-full mt-3 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] disabled:opacity-50"
            >
              Send a new code
            </button>
          </form>
        )}

        {error && (
          <p role="alert" className="flex items-center gap-2 mt-4 text-sm text-[var(--andromeda-error)]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
