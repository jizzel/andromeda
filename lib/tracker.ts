import { resolveTrackerPhases } from "@/constants/tracker-templates";
import {
  appendTrackerRows,
  getProposalAcceptance,
  getTrackerStates,
} from "@/lib/google-sheets";
import type {
  ProjectTrackerConfig,
  ProposalDataUnion,
  TrackerMilestoneState,
} from "@/types/proposal";

// "proposal-sent" is filled in manually on the sheet (its date predates anything
// the app can observe), so only "proposal-accepted" auto-completes on first seed.
const AUTO_DONE_ON_ACCEPTED = "proposal-accepted";
const AUTO_DONE_ON_ASSETS_READY = "service-agreement-signed";

const milestoneKey = (phaseId: string, milestoneId: string) => `${phaseId}::${milestoneId}`;

export async function getOrSeedTracker(
  proposalId: string,
  config: ProjectTrackerConfig,
  proposal: ProposalDataUnion
): Promise<TrackerMilestoneState[]> {
  const phases = resolveTrackerPhases(config);
  if (phases.length === 0) return [];

  const existing = await getTrackerStates(proposalId);
  const existingKeys = new Set(existing.map((s) => milestoneKey(s.phaseId, s.milestoneId)));
  const isFirstSeed = existing.length === 0;

  const acceptance = isFirstSeed ? await getProposalAcceptance(proposalId) : null;
  const acceptedAt = acceptance?.status === "accepted" ? acceptance.acceptedAt || new Date().toISOString() : null;
  const now = new Date().toISOString();

  const missing: TrackerMilestoneState[] = phases.flatMap((phase) =>
    phase.milestones
      .filter((m) => !existingKeys.has(milestoneKey(phase.id, m.id)))
      .map<TrackerMilestoneState>((milestone) => {
        const isAcceptedMilestone = isFirstSeed && milestone.id === AUTO_DONE_ON_ACCEPTED && acceptedAt;
        const isAgreementMilestone = isFirstSeed && milestone.id === AUTO_DONE_ON_ASSETS_READY && proposal.assetsReady;
        const autoDone = Boolean(isAcceptedMilestone || isAgreementMilestone);

        return {
          phaseId: phase.id,
          milestoneId: milestone.id,
          status: autoDone ? "done" : "pending",
          completedAt: autoDone ? (isAcceptedMilestone && acceptedAt ? acceptedAt : now) : undefined,
          updatedAt: now,
        };
      })
  );

  if (missing.length === 0) return existing;

  await appendTrackerRows(proposalId, missing);
  return [...existing, ...missing];
}
