"use client";

import type { ProjectTrackerConfig, ProposalTimelineItem } from "@/types/proposal";
import { resolveTrackerPhases } from "@/constants/tracker-templates";
import { Field, ItemCard, TextArea, TextField, inputClass, move } from "./fields";
import { Section, listAt, type SectionProps } from "./shared";

/** Tracker phases a timeline row can link to, or null when no tracker is configured. */
function trackerPhases(tracker: unknown): { id: string; title: string }[] | null {
  const config = tracker as ProjectTrackerConfig | undefined;
  if (!config || !Array.isArray(config.templates)) return null;
  try {
    return resolveTrackerPhases(config).map((p) => ({ id: p.id, title: p.title }));
  } catch {
    return null; // unknown template id — fall back to a free-text field
  }
}

export function TimelineForm({ data, issues, onChange, requestDelete }: Omit<SectionProps, "acceptance">) {
  const timeline = Array.isArray(data.timeline) ? (data.timeline as ProposalTimelineItem[]) : [];
  const phases = trackerPhases(data.tracker);
  const edit = (fn: (list: ProposalTimelineItem[]) => void) => onChange((d) => fn(listAt<ProposalTimelineItem>(d, "timeline")));
  const set = (index: number, patch: Partial<ProposalTimelineItem>) =>
    edit((list) => {
      Object.assign(list[index], patch);
      // `phaseId` is optional: drop the key rather than store an empty string.
      if (!list[index].phaseId) delete list[index].phaseId;
    });

  return (
    <Section
      title="Timeline"
      description="Project phases with an estimated duration."
      path="timeline"
      error={issues.at("timeline")}
      addLabel="Add timeline phase"
      onAdd={() => edit((list) => list.push({ phase: "New phase", duration: "", description: "" }))}
    >
      {timeline.map((item, index) => {
        const path = `timeline[${index}]`;
        const phaseIdError = issues.at(`${path}.phaseId`);
        const knownPhase = phases?.some((p) => p.id === item.phaseId);
        return (
          <ItemCard
            key={index}
            title={item.phase}
            summary={item.duration}
            errorCount={issues.countUnder(path)}
            index={index}
            count={timeline.length}
            onMove={(delta) => edit((list) => list.splice(0, list.length, ...move(list, index, delta)))}
            onDuplicate={() => edit((list) => list.splice(index + 1, 0, { ...structuredClone(item), phase: `${item.phase} (copy)` }))}
            onDelete={() => requestDelete({ label: `timeline phase "${item.phase || index + 1}"`, confirm: () => edit((list) => list.splice(index, 1)) })}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextField label="Phase" path={`${path}.phase`} value={item.phase ?? ""} onChange={(v) => set(index, { phase: v })} error={issues.at(`${path}.phase`)} />
              <TextField
                label="Duration"
                path={`${path}.duration`}
                value={item.duration ?? ""}
                onChange={(v) => set(index, { duration: v })}
                error={issues.at(`${path}.duration`)}
                placeholder="1–2 weeks"
              />
            </div>
            <TextArea
              label="Description"
              path={`${path}.description`}
              value={item.description ?? ""}
              onChange={(v) => set(index, { description: v })}
              error={issues.at(`${path}.description`)}
            />
            {phases ? (
              <Field label="Tracker phase" error={phaseIdError} hint="Shows this duration estimate on the matching phase of the project tracker.">
                <select
                  data-path={`${path}.phaseId`}
                  value={item.phaseId ?? ""}
                  onChange={(e) => set(index, { phaseId: e.target.value })}
                  className={`${inputClass} border-white/10 light:border-black/10`}
                >
                  <option value="">Not linked</option>
                  {phases.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.id})
                    </option>
                  ))}
                  {item.phaseId && !knownPhase && <option value={item.phaseId}>{item.phaseId} (not in this tracker)</option>}
                </select>
              </Field>
            ) : (
              <TextField
                label="Tracker phase id"
                path={`${path}.phaseId`}
                value={item.phaseId ?? ""}
                onChange={(v) => set(index, { phaseId: v })}
                error={phaseIdError}
                mono
                hint="Optional. Links this row to a project tracker phase once a tracker is configured."
              />
            )}
          </ItemCard>
        );
      })}
    </Section>
  );
}
