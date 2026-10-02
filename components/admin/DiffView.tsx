"use client";

import { useMemo, type ReactNode } from "react";
import { diffLines } from "./line-diff";

/**
 * Unified line diff of two texts: changed lines plus `context` lines around
 * them, gaps shown as "⋯". `−` lines are `before`, `+` lines are `after`.
 */
export function DiffView({ before, after, empty, context = 2, className = "max-h-72" }: { before: string; after: string; empty: ReactNode; context?: number; className?: string }) {
  const lines = useMemo(() => diffLines(before, after), [before, after]);
  const visible = useMemo(() => {
    const keep = new Set<number>();
    lines.forEach((line, i) => {
      if (line.type !== "same") for (let k = i - context; k <= i + context; k++) keep.add(k);
    });
    return lines.map((line, i) => ({ line, i, show: keep.has(i) }));
  }, [lines, context]);
  const unchanged = lines.every((l) => l.type === "same");
  return (
    <pre className={`${className} overflow-auto text-xs font-mono p-3 rounded bg-black/30 light:bg-black/5`}>
      {unchanged ? (
        <span className="text-[var(--andromeda-text-secondary)]">{empty}</span>
      ) : (
        visible.map(({ line, i, show }) => {
          if (!show) return visible[i - 1]?.show ? <div key={i} className="text-[var(--andromeda-text-secondary)]/50">⋯</div> : null;
          const tone =
            line.type === "add" ? "text-[var(--andromeda-success)]" : line.type === "del" ? "text-[var(--andromeda-error)]" : "text-[var(--andromeda-text-secondary)]/70";
          return (
            <div key={i} className={tone}>
              {line.type === "add" ? "+ " : line.type === "del" ? "− " : "  "}
              {line.text}
            </div>
          );
        })
      )}
    </pre>
  );
}
