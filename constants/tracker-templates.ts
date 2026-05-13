import type { ProjectTrackerConfig, TrackerPhase, TrackerTemplate } from "@/types/proposal";

const websiteProject: TrackerTemplate = {
  id: "website-project",
  name: "Website Project",
  phases: [
    {
      id: "proposal-agreement",
      title: "Proposal & Agreement",
      description: "Pre-project alignment and paperwork.",
      icon: "file-signature",
      milestones: [
        { id: "discovery-call", label: "Initial discovery" },
        { id: "proposal-sent-accepted", label: "Proposal sent & accepted" },
        { id: "service-agreement-signed", label: "Service agreement signed" },
        { id: "initial-payment-received", label: "Initial payment received" },
      ],
    },
    {
      id: "kickoff",
      title: "Project Kickoff",
      description: "Getting set up to start the work.",
      icon: "rocket",
      milestones: [
        { id: "kickoff-call", label: "Project initiation (kickoff, tools/access setup)" },
        { id: "asset-gathering", label: "Content & asset gathering" },
        { id: "deeper-discovery", label: "Deeper discovery and analysis" },
        { id: "domain-registration", label: "Domain name registration" },
        { id: "project-planning", label: "Project planning" },
      ],
    },
    {
      id: "testing-review",
      title: "Review & Revisions",
      description: "Quality assurance and final approval.",
      icon: "check-circle",
      milestones: [
        { id: "qa-cross-device", label: "QA / cross-device testing" },
        { id: "client-review-round", label: "Client review round" },
        { id: "revisions-fixes", label: "Revisions & fixes" },
        { id: "final-approval", label: "Final approval" },
      ],
    },
    {
      id: "deployment-delivery",
      title: "Launch",
      description: "Going live and handing over.",
      icon: "globe",
      milestones: [
        { id: "go-live", label: "Deployment / go-live" },
        { id: "handover-docs", label: "Handover & documentation" },
        { id: "post-launch-check", label: "Post-launch check" },
        { id: "training-support", label: "Training & support" },
      ],
    },
  ],
};

const googleBusiness: TrackerTemplate = {
  id: "google-business",
  name: "Google Business Setup",
  phases: [
    {
      id: "google-business-setup",
      title: "Google Business Setup",
      description: "Post-delivery add-on for local discoverability.",
      icon: "map-pin",
      milestones: [
        { id: "profile-claim", label: "Profile setup / claim" },
        { id: "photos-details", label: "Photos, hours, description" },
        { id: "verification", label: "Verification" },
        { id: "client-walkthrough", label: "Client walkthrough" },
      ],
    },
  ],
};

const socialMedia: TrackerTemplate = {
  id: "social-media",
  name: "Social Media Setup & Management",
  phases: [
    {
      id: "social-media",
      title: "Social Media Setup & Management",
      description: "Establishing and running social presence.",
      icon: "share-2",
      milestones: [
        { id: "social-placeholder-1", label: "Milestone 1 (TBD)" },
        { id: "social-placeholder-2", label: "Milestone 2 (TBD)" },
        { id: "social-placeholder-3", label: "Milestone 3 (TBD)" },
      ],
    },
  ],
};

export const trackerTemplates: Record<string, TrackerTemplate> = {
  [websiteProject.id]: websiteProject,
  [googleBusiness.id]: googleBusiness,
  [socialMedia.id]: socialMedia,
};

export function composeTracker(templateIds: string[]): TrackerPhase[] {
  return templateIds.flatMap((id) => trackerTemplates[id]?.phases ?? []);
}

export function resolveTrackerPhases(config: ProjectTrackerConfig): TrackerPhase[] {
  const composed = composeTracker(config.templates);
  const ordered: TrackerPhase[] = [...composed];
  const trailing: TrackerPhase[] = [];

  for (const addition of config.additions ?? []) {
    if (!addition.insertAfter) {
      trailing.push(addition);
      continue;
    }
    const anchorIdx = ordered.findIndex((p) => p.id === addition.insertAfter);
    if (anchorIdx === -1) {
      trailing.push(addition);
    } else {
      ordered.splice(anchorIdx + 1, 0, addition);
    }
  }

  const all = [...ordered, ...trailing];
  const excluded = new Set(config.exclude ?? []);
  if (excluded.size === 0) return all;

  return all
    .map((phase) => ({
      ...phase,
      milestones: phase.milestones.filter((m) => !excluded.has(m.id)),
    }))
    .filter((phase) => phase.milestones.length > 0);
}
