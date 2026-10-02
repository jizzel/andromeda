"use client";

import { Component, useMemo, useState, type ReactNode } from "react";
import { XCircle } from "lucide-react";
import type { ProposalAcceptance } from "@/types/proposal";
import { formSectionProblem, layoutOf, type FormSection, type FormSectionProblem, type ProposalIssue } from "@/lib/proposal-schema";
import { AdminDialog, dialogButton } from "../AdminDialog";
import { IssueIndex } from "./fields";
import { PackagesForm } from "./PackagesForm";
import { PaymentPlansForm } from "./PaymentPlansForm";
import { TimelineForm } from "./TimelineForm";
import type { DeleteRequest, Mutate } from "./shared";

/** Which form sections each layout has (the rest is edited as JSON). */
const SECTIONS = {
  default: { packages: true, paymentPlans: true, timeline: true },
  social: { packages: true, paymentPlans: false, timeline: true },
  church: { packages: false, paymentPlans: false, timeline: true },
} as const;

interface SectionFormsProps {
  data: Record<string, unknown>;
  errors: ProposalIssue[];
  acceptance: ProposalAcceptance | null;
  onChange: (mutate: Mutate) => void;
  /** Opens a path in the JSON view (used when a section can't be shown as a form). */
  onShowInJson: (path: string) => void;
}

const SECTION_TITLES: Record<FormSection, string> = { packages: "Packages", paymentPlans: "Payment plans", timeline: "Timeline" };

/**
 * Structured forms for the most-revised sections. They edit the same parsed
 * draft as the JSON editor (via `onChange`), so validation, preview, drafts
 * and saving are shared and nothing here keeps its own copy of the data.
 */
export function SectionForms({ data, errors, acceptance, onChange, onShowInJson }: SectionFormsProps) {
  const issues = useMemo(() => new IssueIndex(errors), [errors]);
  const [pendingDelete, setPendingDelete] = useState<DeleteRequest | null>(null);
  const sections = SECTIONS[layoutOf(data)];
  const props = { data, issues, onChange, acceptance, requestDelete: setPendingDelete };
  // A section whose values have the wrong types (valid JSON, wrong shape) is
  // shown as a notice instead of a form: the form would crash on it, and
  // editing it field by field could overwrite what's there.
  const problem = (section: FormSection) => formSectionProblem(data, section);
  const render = (section: FormSection, form: ReactNode) => {
    const found = problem(section);
    return found ? <SectionProblem key={section} title={SECTION_TITLES[section]} problem={found} onShowInJson={onShowInJson} /> : form;
  };

  return (
    <div className="space-y-8">
      {sections.packages && render("packages", <PackagesForm {...props} />)}
      {sections.paymentPlans && render("paymentPlans", <PaymentPlansForm {...props} />)}
      {sections.timeline && render("timeline", <TimelineForm {...props} />)}
      <p className="text-xs text-[var(--andromeda-text-secondary)]">Everything else in the proposal is edited in the JSON view.</p>

      <AdminDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete this item?"
        description={
          pendingDelete && (
            <>
              This removes the {pendingDelete.label} from the draft. It isn&apos;t saved until you press Save.
              {pendingDelete.clientChoice && (
                <span className="block mt-2 text-amber-500">It&apos;s {pendingDelete.clientChoice} — deleting it means they&apos;ll have to choose again.</span>
              )}
            </>
          )
        }
        actions={
          <>
            <button type="button" data-autofocus onClick={() => setPendingDelete(null)} className={dialogButton.secondary}>
              Keep it
            </button>
            <button
              type="button"
              onClick={() => {
                pendingDelete?.confirm();
                setPendingDelete(null);
              }}
              className={dialogButton.danger}
            >
              Delete
            </button>
          </>
        }
      />
    </div>
  );
}

function SectionProblem({ title, problem, onShowInJson }: { title: string; problem: NonNullable<FormSectionProblem>; onShowInJson: (path: string) => void }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div role="alert" className="flex items-start gap-2 p-3 rounded-lg border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm">
        <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-error)]" />
        <p>
          The form can&apos;t edit this section: <code className="font-mono text-xs">{problem.path}</code> — {problem.message}.{" "}
          <button type="button" onClick={() => onShowInJson(problem.path)} className="underline hover:text-[var(--andromeda-accent-beige)]">
            Fix it in the JSON view
          </button>
          .
        </p>
      </div>
    </section>
  );
}

/**
 * Last line of defence: if a form still throws on some draft the shape check
 * didn't anticipate, show a notice instead of taking down the editor. Resets
 * when `resetKey` (the draft text) changes, so fixing the JSON brings it back.
 */
export class FormErrorBoundary extends Component<{ resetKey: string; onShowJson: () => void; children: ReactNode }, { failed: boolean; key: string }> {
  state = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { resetKey: string }, state: { failed: boolean; key: string }) {
    return props.resetKey === state.key ? null : { failed: false, key: props.resetKey };
  }

  componentDidCatch(error: unknown) {
    console.error("Admin form view failed to render this draft:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="p-4 rounded-xl border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm">
        The form can&apos;t display this draft. Your changes are safe —{" "}
        <button type="button" onClick={this.props.onShowJson} className="underline hover:text-[var(--andromeda-accent-beige)]">
          edit it in the JSON view
        </button>
        .
      </div>
    );
  }
}
