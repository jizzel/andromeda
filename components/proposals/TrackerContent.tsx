"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  FileSignature,
  Rocket,
  Palette,
  CheckCircle,
  Globe,
  MapPin,
  Share2,
  ListChecks,
  ArrowLeft,
  AlertCircle,
  CircleDot,
  Clock,
  CheckCircle2,
  Ban,
} from "lucide-react";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { formatDate } from "@/lib/dates";
import type {
  ProjectTrackerConfig,
  TrackerMilestoneState,
  TrackerPhase,
  TrackerStatus,
} from "@/types/proposal";
import Link from "next/link";

interface TrackerContentProps {
  proposalId: string;
  accessCode: string;
  clientName: string;
  proposalTitle: string;
  config: ProjectTrackerConfig;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-signature": FileSignature,
  rocket: Rocket,
  palette: Palette,
  "check-circle": CheckCircle,
  globe: Globe,
  "map-pin": MapPin,
  "share-2": Share2,
};

function getPhaseIcon(name?: string) {
  return name && iconMap[name] ? iconMap[name] : ListChecks;
}

const STATUS_META: Record<TrackerStatus, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: {
    label: "Pending",
    classes: "bg-[var(--andromeda-text-secondary)]/10 text-[var(--andromeda-text-secondary)] border-[var(--andromeda-text-secondary)]/30",
    icon: CircleDot,
  },
  in_progress: {
    label: "In progress",
    classes: "bg-[var(--andromeda-accent-beige)]/15 text-[var(--andromeda-accent-beige)] border-[var(--andromeda-accent-beige)]/40",
    icon: Clock,
  },
  done: {
    label: "Done",
    classes: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    icon: CheckCircle2,
  },
  blocked: {
    label: "Blocked",
    classes: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    icon: Ban,
  },
};

export function TrackerContent({ proposalId, accessCode, clientName, proposalTitle, config }: TrackerContentProps) {
  const { trackProposalTrackerPhaseViewed } = useAnalytics();
  const [phases, setPhases] = useState<TrackerPhase[]>([]);
  const [states, setStates] = useState<TrackerMilestoneState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const phaseRefs = useRef<Map<string, HTMLElement>>(new Map());
  const seenPhasesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          `/api/proposal/tracker?proposalId=${encodeURIComponent(proposalId)}&accessCode=${encodeURIComponent(accessCode)}`
        );
        const data = await res.json();
        if (data.success) {
          setPhases(data.phases as TrackerPhase[]);
          setStates(data.states as TrackerMilestoneState[]);
        } else {
          setError(data.error || "Couldn't load your project tracker.");
        }
      } catch {
        setError("Couldn't load your project tracker.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proposalId, accessCode]);

  const stateIndex = useMemo(() => {
    const map = new Map<string, TrackerMilestoneState>();
    for (const s of states) map.set(`${s.phaseId}::${s.milestoneId}`, s);
    return map;
  }, [states]);

  const { totalMilestones, doneMilestones, currentPhase, currentPhaseIndex, lastUpdatedAt } = useMemo(() => {
    let total = 0;
    let done = 0;
    let current: TrackerPhase | null = null;
    let currentIdx = 0;
    let lastUpdated = "";

    phases.forEach((phase, idx) => {
      let phaseDone = 0;
      phase.milestones.forEach((m) => {
        total += 1;
        const state = stateIndex.get(`${phase.id}::${m.id}`);
        if (state?.updatedAt && state.updatedAt > lastUpdated) lastUpdated = state.updatedAt;
        if (state?.status === "done") {
          done += 1;
          phaseDone += 1;
        }
      });
      if (!current && phaseDone < phase.milestones.length) {
        current = phase;
        currentIdx = idx;
      }
    });

    if (!current && phases.length > 0) {
      current = phases[phases.length - 1];
      currentIdx = phases.length - 1;
    }

    return {
      totalMilestones: total,
      doneMilestones: done,
      currentPhase: current,
      currentPhaseIndex: currentIdx,
      lastUpdatedAt: lastUpdated,
    };
  }, [phases, stateIndex]);

  const overallPercent = totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  // Phase view analytics — fire once per phase when visible
  useEffect(() => {
    if (loading || phases.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const phaseId = entry.target.getAttribute("data-phase-id");
          if (!phaseId || seenPhasesRef.current.has(phaseId)) continue;
          seenPhasesRef.current.add(phaseId);
          trackProposalTrackerPhaseViewed({ proposal_id: proposalId, phase_id: phaseId });
        }
      },
      { threshold: 0.4 }
    );
    phaseRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading, phases, proposalId, trackProposalTrackerPhaseViewed]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--andromeda-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--andromeda-accent-beige)]/30 border-t-[var(--andromeda-accent-beige)] rounded-full animate-spin" />
          <p className="text-sm text-[var(--andromeda-text-secondary)]">Loading project tracker…</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--andromeda-primary)] pb-24">
      {/* Hero */}
      <section className="relative px-6 pt-16 md:pt-24 pb-12 max-w-4xl mx-auto">
        <Link
          href={`/proposal/${proposalId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to proposal
        </Link>

        <ScrollReveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30 text-xs text-[var(--andromeda-accent-beige)] mb-4">
            {clientName}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[var(--andromeda-text-primary)] mb-3">
            Project Tracker
          </h1>
          <p className="text-base md:text-lg text-[var(--andromeda-text-secondary)] max-w-2xl">
            Live progress for <span className="text-[var(--andromeda-text-primary)]">{proposalTitle}</span>. We&apos;ll
            update milestones here as the work moves forward.
          </p>
        </ScrollReveal>
      </section>

      {/* Summary card */}
      <section className="px-6 max-w-4xl mx-auto mb-12">
        <ScrollReveal>
          <div className="rounded-xl border border-[var(--andromeda-accent-beige)]/20 bg-[var(--andromeda-secondary)]/40 p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-[var(--andromeda-text-secondary)] mb-1">
                  Where we are
                </div>
                <div className="text-xl md:text-2xl font-semibold text-[var(--andromeda-text-primary)]">
                  {currentPhase
                    ? `Phase ${currentPhaseIndex + 1} of ${phases.length} · ${currentPhase.title}`
                    : "Project starting soon"}
                </div>
              </div>
              <div className="text-3xl md:text-4xl font-bold text-[var(--andromeda-accent-beige)]">
                {overallPercent}%
              </div>
            </div>
            <div className="h-2 rounded-full bg-[var(--andromeda-text-secondary)]/15 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-[var(--andromeda-accent-beige)]"
              />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-xs text-[var(--andromeda-text-secondary)]">
              <span>{doneMilestones} of {totalMilestones} milestones complete</span>
              {config.startedAt && <span>Started {formatDate(config.startedAt)}</span>}
              {config.estimatedEndAt && <span>Estimated finish {formatDate(config.estimatedEndAt)}</span>}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {error && (
        <section className="px-6 max-w-4xl mx-auto mb-8">
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </section>
      )}

      {/* Phase timeline */}
      <section className="px-6 max-w-4xl mx-auto">
        <ol className="space-y-10">
          {phases.map((phase, phaseIdx) => {
            const PhaseIcon = getPhaseIcon(phase.icon);
            const phaseStates = phase.milestones.map((m) => stateIndex.get(`${phase.id}::${m.id}`));
            const phaseDone = phaseStates.filter((s) => s?.status === "done").length;
            const phasePercent = phase.milestones.length > 0
              ? Math.round((phaseDone / phase.milestones.length) * 100)
              : 0;

            return (
              <li
                key={phase.id}
                ref={(el) => {
                  if (el) phaseRefs.current.set(phase.id, el);
                }}
                data-phase-id={phase.id}
              >
                <ScrollReveal>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-[var(--andromeda-accent-beige)]/10 border border-[var(--andromeda-accent-beige)]/30 text-[var(--andromeda-accent-beige)]">
                      <PhaseIcon className="w-5 h-5" />
                    </div>
                    <div className="text-xs uppercase tracking-wider text-[var(--andromeda-text-secondary)]">
                      Phase {phaseIdx + 1}
                    </div>
                  </div>
                  <h2 className="text-2xl font-semibold text-[var(--andromeda-text-primary)] mb-1">
                    {phase.title}
                  </h2>
                  {phase.description && (
                    <p className="text-sm text-[var(--andromeda-text-secondary)] mb-4">{phase.description}</p>
                  )}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--andromeda-text-secondary)]/15 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${phasePercent}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full bg-[var(--andromeda-accent-beige)]"
                      />
                    </div>
                    <span className="text-xs text-[var(--andromeda-text-secondary)] tabular-nums">
                      {phaseDone}/{phase.milestones.length}
                    </span>
                  </div>
                  <ul className="space-y-3 border-l border-[var(--andromeda-accent-beige)]/15 pl-5 ml-4">
                    {phase.milestones.map((milestone) => {
                      const state = stateIndex.get(`${phase.id}::${milestone.id}`);
                      const status: TrackerStatus = state?.status ?? "pending";
                      const meta = STATUS_META[status];
                      const StatusIcon = meta.icon;
                      return (
                        <li
                          key={milestone.id}
                          className="relative rounded-lg border border-[var(--andromeda-accent-beige)]/10 bg-[var(--andromeda-secondary)]/30 px-4 py-3"
                        >
                          <span
                            className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full bg-[var(--andromeda-primary)] border-2 border-[var(--andromeda-accent-beige)]/50"
                            aria-hidden
                          />
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium ${status === "done" ? "text-[var(--andromeda-text-secondary)] line-through" : "text-[var(--andromeda-text-primary)]"}`}>
                                {milestone.label}
                              </div>
                              {milestone.description && (
                                <div className="text-xs text-[var(--andromeda-text-secondary)] mt-0.5">
                                  {milestone.description}
                                </div>
                              )}
                              {state?.note && (
                                <div className="mt-2 text-xs italic text-[var(--andromeda-text-secondary)] border-l-2 border-[var(--andromeda-accent-beige)]/40 pl-2">
                                  {state.note}
                                </div>
                              )}
                              {status === "done" && state?.completedAt && (
                                <div className="text-[11px] text-[var(--andromeda-text-secondary)]/80 mt-1">
                                  Completed {formatDate(state.completedAt)}
                                </div>
                              )}
                            </div>
                            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border ${meta.classes}`}>
                              <StatusIcon className="w-3 h-3" />
                              {meta.label}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </ScrollReveal>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Footer */}
      <section className="px-6 max-w-4xl mx-auto mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-[var(--andromeda-accent-beige)]/15">
          <p className="text-xs text-[var(--andromeda-text-secondary)]">
            {lastUpdatedAt
              ? `Last updated ${formatDate(lastUpdatedAt)}`
              : "Updates from Joseph will appear here as the project progresses."}
          </p>
          <Link
            href={`/proposal/${proposalId}`}
            className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-accent-beige)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to proposal
          </Link>
        </div>
      </section>
    </main>
  );
}
