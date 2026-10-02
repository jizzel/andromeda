"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface AdminDialogProps {
  open: boolean;
  /** Called on Escape, backdrop click, the close button, or when the dialog closes itself. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Footer actions (buttons), right-aligned. */
  actions?: ReactNode;
}

/**
 * Modal dialog for the admin surface, built on the native `<dialog>` element:
 * `showModal()` gives focus trapping, Escape to close, a backdrop and top-layer
 * stacking without a dialog library. Focus returns to the opener on close.
 * On open, focus goes to the element marked `data-autofocus` (inputs are also
 * selected, so a suggested value can be typed over) — React's `autoFocus`
 * only fires on mount, and the content is mounted while the dialog is closed.
 */
export function AdminDialog({ open, onClose, title, description, children, actions }: AdminDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      const target = dialog.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus();
      if (target instanceof HTMLInputElement) target.select();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      // A click on the dialog element itself (not its content) is the backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[min(92vw,30rem)] p-0 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)] text-[var(--andromeda-text-primary)] shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h2 id={titleId} className="text-lg font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 -m-1 rounded text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {description && (
          <div id={descriptionId} className="text-sm text-[var(--andromeda-text-secondary)] mb-4">
            {description}
          </div>
        )}
        {children}
        {actions && <div className="flex justify-end gap-2 mt-6">{actions}</div>}
      </div>
    </dialog>
  );
}

export const dialogButton = {
  primary:
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 disabled:opacity-40",
  secondary:
    "px-4 py-2 rounded-lg text-sm border border-white/15 light:border-black/15 hover:border-[var(--andromeda-accent-beige)]/50",
  danger:
    "px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--andromeda-error)]/15 text-[var(--andromeda-error)] hover:bg-[var(--andromeda-error)]/25",
};
