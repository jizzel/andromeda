"use client";

import type { ProposalPackage } from "@/types/proposal";
import { Field, IdField, ItemCard, StringListField, TextArea, TextField, Toggle, move, nextId } from "./fields";
import { ChoiceBadge, Section, listAt, recordedResponse, type SectionProps } from "./shared";

export function PackagesForm({ data, issues, onChange, acceptance, requestDelete }: SectionProps) {
  const packages = Array.isArray(data.packages) ? (data.packages as ProposalPackage[]) : [];
  const response = recordedResponse(acceptance);
  const chosenId = response?.packageId;
  const edit = (fn: (list: ProposalPackage[]) => void) => onChange((d) => fn(listAt<ProposalPackage>(d, "packages")));
  const set = (index: number, patch: Partial<ProposalPackage>) => edit((list) => Object.assign(list[index], patch));

  const orphaned = chosenId && !packages.some((p) => p.id === chosenId);

  return (
    <Section
      title="Packages"
      description="The options the client chooses between in Pricing."
      path="packages"
      error={issues.at("packages")}
      warning={
        orphaned ? (
          <>
            The client&apos;s recorded choice <code className="font-mono">{chosenId}</code> no longer matches a package — they&apos;ll have to choose again.
          </>
        ) : undefined
      }
      addLabel="Add package"
      onAdd={() =>
        edit((list) =>
          list.push({ id: nextId("pkg", list.map((p) => p.id)), name: "New package", recommended: false, totalPrice: "", includes: [], comment: "" })
        )
      }
    >
      {packages.map((pkg, index) => {
        const path = `packages[${index}]`;
        const isChoice = !!chosenId && pkg.id === chosenId;
        return (
          <ItemCard
            key={index}
            title={pkg.name}
            summary={[pkg.totalPrice, pkg.recommended ? "Recommended" : ""].filter(Boolean).join(" · ")}
            badge={isChoice ? <ChoiceBadge>{response?.status === "accepted" ? "Accepted" : "Client's preference"}</ChoiceBadge> : undefined}
            errorCount={issues.countUnder(path)}
            index={index}
            count={packages.length}
            onMove={(delta) => edit((list) => list.splice(0, list.length, ...move(list, index, delta)))}
            onDuplicate={() =>
              edit((list) => list.splice(index + 1, 0, { ...structuredClone(pkg), id: nextId("pkg", list.map((p) => p.id)), name: `${pkg.name} (copy)` }))
            }
            onDelete={() =>
              requestDelete({
                label: `package "${pkg.name || pkg.id}"`,
                clientChoice: isChoice ? "the client's recorded choice" : undefined,
                confirm: () => edit((list) => list.splice(index, 1)),
              })
            }
          >
            {/* A package-level problem, e.g. no payment plan applies to it. */}
            {issues.at(path) && (
              <p role="alert" data-path={path} tabIndex={-1} className="text-xs text-[var(--andromeda-error)]">
                {issues.at(path)}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Name" path={`${path}.name`} value={pkg.name ?? ""} onChange={(v) => set(index, { name: v })} error={issues.at(`${path}.name`)} />
              <TextField
                label="Total price"
                path={`${path}.totalPrice`}
                value={pkg.totalPrice ?? ""}
                onChange={(v) => set(index, { totalPrice: v })}
                error={issues.at(`${path}.totalPrice`)}
                placeholder="GH₵ 12,000"
              />
            </div>
            <Field label="Recommended" error={issues.at(`${path}.recommended`)}>
              <Toggle checked={!!pkg.recommended} onChange={(v) => set(index, { recommended: v })} on="Highlighted as recommended" off="Not highlighted" />
            </Field>
            <StringListField
              label="Includes"
              path={`${path}.includes`}
              items={Array.isArray(pkg.includes) ? pkg.includes : []}
              onChange={(items) => set(index, { includes: items })}
              issues={issues}
            />
            <TextArea label="Comment" path={`${path}.comment`} value={pkg.comment ?? ""} onChange={(v) => set(index, { comment: v })} error={issues.at(`${path}.comment`)} />
            <IdField
              path={`${path}.id`}
              value={pkg.id ?? ""}
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
