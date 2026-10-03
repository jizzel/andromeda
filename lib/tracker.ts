import { resolveTrackerPhases } from "@/constants/tracker-templates";
import {
  appendTrackerRows,
  getProposalAcceptance,
  getTrackerStates,
  readAgreement,
  readEngagementState,
} from "@/lib/google-sheets";
import { effectiveOverrides } from "@/lib/engagement-gates";
import type {
  ProjectTrackerConfig,
  ProposalDataUnion,
  TrackerMilestoneState,
} from "@/types/proposal";

// "proposal-sent" is filled in manually on the sheet (its date predates anything
// the app can observe), so only "proposal-accepted" auto-completes on first seed.
const AUTO_DONE_ON_ACCEPTED = "proposal-accepted";
// Done when the agreement is executed (native signing), or — for engagements
// signed outside the app — when Joseph has switched the Assets tab on by hand.
export const AGREEMENT_SIGNED_MILESTONE = "service-agreement-signed";

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
  const agreementSignedAt = isFirstSeed ? await executedAgreementSignedAt(proposalId) : null;
  const signedOutsideApp = isFirstSeed && !agreementSignedAt ? await assetsSwitchedOn(proposalId, proposal) : false;
  const now = new Date().toISOString();

  const missing: TrackerMilestoneState[] = phases.flatMap((phase) =>
    phase.milestones
      .filter((m) => !existingKeys.has(milestoneKey(phase.id, m.id)))
      .map<TrackerMilestoneState>((milestone) => {
        const isAcceptedMilestone = isFirstSeed && milestone.id === AUTO_DONE_ON_ACCEPTED && acceptedAt;
        const isAgreementMilestone = isFirstSeed && milestone.id === AGREEMENT_SIGNED_MILESTONE && (agreementSignedAt || signedOutsideApp);
        const autoDone = Boolean(isAcceptedMilestone || isAgreementMilestone);
        const completedAt = isAcceptedMilestone && acceptedAt ? acceptedAt : isAgreementMilestone && agreementSignedAt ? agreementSignedAt : now;

        return {
          phaseId: phase.id,
          milestoneId: milestone.id,
          status: autoDone ? "done" : "pending",
          completedAt: autoDone ? completedAt : undefined,
          updatedAt: now,
        };
      })
  );

  if (missing.length === 0) return existing;

  await appendTrackerRows(proposalId, missing);
  return [...existing, ...missing];
}

/** When the client signed the agreement, if it's executed. Unreadable → null (falls back to the Assets switch). */
async function executedAgreementSignedAt(proposalId: string): Promise<string | null> {
  try {
    const agreement = await readAgreement(proposalId);
    return agreement?.status === "executed" ? (agreement.clientSignature?.signedAt ?? null) : null;
  } catch (error) {
    console.error(`Tracker seed for ${proposalId}: couldn't read the agreement:`, error);
    return null;
  }
}

/** Assets switched on by hand (override row, or the legacy JSON flag) — the "signed outside the app" signal. Unreadable → false. */
async function assetsSwitchedOn(proposalId: string, proposal: ProposalDataUnion): Promise<boolean> {
  try {
    return effectiveOverrides(proposal, await readEngagementState(proposalId)).overrides.assets === "on";
  } catch (error) {
    console.error(`Tracker seed for ${proposalId}: couldn't read the engagement state:`, error);
    return false;
  }
}
