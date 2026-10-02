"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import type { PaymentMilestone, ProposalPaymentPlan } from "@/types/proposal";
import { Field, IdField, ItemCard, MiniButton, NullableTextField, StringListField, TextArea, TextField, inputClass, move, nextId, type IssueIndex } from "./fields";
import { ChoiceBadge, Section, listAt, recordedResponse, type SectionProps } from "./shared";

/** Sum of the milestones' percentages, or null unless every one is a plain "NN%" value. */
function percentageTotal(structure: PaymentMilestone[]): number | null {
  if (!structure.length) return null;
  let total = 0;
  for (const m of structure) {
    if (typeof m?.percentage !== "string") return null;
    const match = m.percentage.trim().match(/^(\d+(?:\.\d+)?)\s*%$/);
    if (!match) return null;
    total += Number(match[1]);
  }
  return total;
}

export function PaymentPlansForm({ data, issues, onChange, acceptance, requestDelete }: SectionProps) {
  const plans = Array.isArray(data.paymentPlans) ? (data.paymentPlans as ProposalPaymentPlan[]) : [];
  const response = recordedResponse(acceptance);
  const chosenId = response?.paymentPlanId;
  const edit = (fn: (list: ProposalPaymentPlan[]) => void) => onChange((d) => fn(listAt<ProposalPaymentPlan>(d, "paymentPlans")));
  const set = (index: number, patch: Partial<ProposalPaymentPlan>) => edit((list) => Object.assign(list[index], patch));

  const orphaned = chosenId && !plans.some((p) => p.id === chosenId);

  return (
    <Section
      title="Payment plans"
      description="How the client can pay — milestones with a percentage, an amount, or both."
      path="paymentPlans"
      error={issues.at("paymentPlans")}
      warning={
        orphaned ? (
          <>
            The client&apos;s recorded choice <code className="font-mono">{chosenId}</code> no longer matches a payment plan — they&apos;ll have to choose again.
          </>
        ) : undefined
      }
      addLabel="Add payment plan"
      onAdd={() =>
        edit((list) =>
          list.push({
            id: nextId("plan", list.map((p) => p.id)),
            name: "New payment plan",
            badge: "",
            totalInvestment: "",
            premium: null,
            structure: [{ milestone: "", percentage: null, amount: null }],
            includes: [],
            bestFor: "",
          })
        )
      }
    >
      {plans.map((plan, index) => {
        const path = `paymentPlans[${index}]`;
        const isChoice = !!chosenId && plan.id === chosenId;
        const structure = Array.isArray(plan.structure) ? plan.structure : [];
        const total = percentageTotal(structure);
        return (
          <ItemCard
            key={index}
            title={plan.name}
            summary={[plan.badge, plan.totalInvestment, `${structure.length} ${structure.length === 1 ? "milestone" : "milestones"}`].filter(Boolean).join(" · ")}
            badge={isChoice ? <ChoiceBadge>{response?.status === "accepted" ? "Accepted" : "Client's preference"}</ChoiceBadge> : undefined}
            errorCount={issues.countUnder(path)}
            index={index}
            count={plans.length}
            onMove={(delta) => edit((list) => list.splice(0, list.length, ...move(list, index, delta)))}
            onDuplicate={() =>
              edit((list) => list.splice(index + 1, 0, { ...structuredClone(plan), id: nextId("plan", list.map((p) => p.id)), name: `${plan.name} (copy)` }))
            }
            onDelete={() =>
              requestDelete({
                label: `payment plan "${plan.name || plan.id}"`,
                clientChoice: isChoice ? "the client's recorded choice" : undefined,
                confirm: () => edit((list) => list.splice(index, 1)),
              })
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Name" path={`${path}.name`} value={plan.name ?? ""} onChange={(v) => set(index, { name: v })} error={issues.at(`${path}.name`)} />
              <TextField label="Badge" path={`${path}.badge`} value={plan.badge ?? ""} onChange={(v) => set(index, { badge: v })} error={issues.at(`${path}.badge`)} placeholder="Best Value" />
              <TextField
                label="Total investment"
                path={`${path}.totalInvestment`}
                value={plan.totalInvestment ?? ""}
                onChange={(v) => set(index, { totalInvestment: v })}
                error={issues.at(`${path}.totalInvestment`)}
              />
              <NullableTextField
                label="Premium"
                path={`${path}.premium`}
                value={plan.premium ?? null}
                onChange={(v) => set(index, { premium: v })}
                error={issues.at(`${path}.premium`)}
                hint="Leave blank for none."
              />
            </div>
            <MilestonesField
              path={`${path}.structure`}
              structure={structure}
              total={total}
              issues={issues}
              onChange={(next) => set(index, { structure: next })}
            />
            <StringListField
              label="Includes"
              path={`${path}.includes`}
              items={Array.isArray(plan.includes) ? plan.includes : []}
              onChange={(items) => set(index, { includes: items })}
              issues={issues}
            />
            <TextArea label="Best for" path={`${path}.bestFor`} value={plan.bestFor ?? ""} onChange={(v) => set(index, { bestFor: v })} error={issues.at(`${path}.bestFor`)} />
            <IdField
              path={`${path}.id`}
              value={plan.id ?? ""}
              onChange={(v) => set(index, { id: v })}
              error={issues.at(`${path}.id`)}
              warning={isChoice ? "The client's recorded response points at this id — changing it detaches their choice." : undefined}
            />
          </ItemCard>
        );
      })}
    </Section>
  );
}

function MilestonesField({
  path,
  structure,
  total,
  issues,
  onChange,
}: {
  path: string;
  structure: PaymentMilestone[];
  total: number | null;
  issues: IssueIndex;
  onChange: (next: PaymentMilestone[]) => void;
}) {
  const set = (index: number, patch: Partial<PaymentMilestone>) => onChange(structure.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  const blankToNull = (value: string) => (value === "" ? null : value);
  const cell = (index: number, key: "milestone" | "percentage" | "amount", placeholder: string) => {
    const cellPath = `${path}[${index}].${key}`;
    const error = issues.at(cellPath);
    const value = structure[index][key];
    return (
      <input
        data-path={cellPath}
        value={value ?? ""}
        placeholder={placeholder}
        aria-label={`Milestone ${index + 1} ${key}`}
        aria-invalid={!!error}
        title={error}
        onChange={(e) => set(index, key === "milestone" ? { milestone: e.target.value } : { [key]: blankToNull(e.target.value) })}
        className={`${inputClass} ${error ? "border-[var(--andromeda-error)]/60" : "border-white/10 light:border-black/10"}`}
      />
    );
  };
  return (
    <Field
      label="Milestones"
      error={issues.at(path)}
      hint={total !== null && total !== 100 ? <span className="text-amber-500">Percentages add up to {total}%, not 100%.</span> : undefined}
    >
      <div data-path={path} className="space-y-1.5">
        <div className="hidden sm:grid grid-cols-[1fr_6rem_8rem_auto] gap-1 text-[11px] uppercase tracking-wider text-[var(--andromeda-text-secondary)]">
          <span>When</span>
          <span>Percentage</span>
          <span>Amount</span>
          <span className="w-[4.5rem]" />
        </div>
        {structure.map((_, index) => (
          <div key={index} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_6rem_8rem_auto] gap-1 items-center">
            <div className="col-span-2 sm:col-span-1">{cell(index, "milestone", "Upon contract signing")}</div>
            <div className="grid grid-cols-2 gap-1 sm:contents">
              {cell(index, "percentage", "40%")}
              {cell(index, "amount", "GH₵ 4,800")}
            </div>
            <div className="flex">
              <MiniButton title="Move up" disabled={index === 0} onClick={() => onChange(move(structure, index, -1))}>
                <ArrowUp className="w-3.5 h-3.5" />
              </MiniButton>
              <MiniButton title="Move down" disabled={index === structure.length - 1} onClick={() => onChange(move(structure, index, 1))}>
                <ArrowDown className="w-3.5 h-3.5" />
              </MiniButton>
              <MiniButton title="Remove milestone" onClick={() => onChange(structure.filter((_, i) => i !== index))}>
                <X className="w-3.5 h-3.5" />
              </MiniButton>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...structure, { milestone: "", percentage: null, amount: null }])}
          className="inline-flex items-center gap-1 text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
        >
          <Plus className="w-3.5 h-3.5" /> Add milestone
        </button>
      </div>
    </Field>
  );
}
