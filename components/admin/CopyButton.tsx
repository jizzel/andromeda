"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (e.g. insecure context) — nothing useful to do.
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${label}`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10"
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}
