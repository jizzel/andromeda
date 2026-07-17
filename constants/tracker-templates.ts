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
        { id: "proposal-sent", label: "Proposal sent" },
        { id: "proposal-accepted", label: "Proposal accepted" },
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
        { id: "domain-registration", label: "Domain name registration/DNS setup" },
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
        { id: "final-approval", label: "Final approval", clientApprovable: true },
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
      description: "Setting up profiles and running the first month of active management.",
      icon: "share-2",
      milestones: [
        { id: "social-profile-setup", label: "Profile setup (accounts created, bios written, branding applied)" },
        { id: "social-meta-business-suite", label: "Meta Business Suite connected" },
        { id: "social-content-strategy", label: "Content strategy & posting cadence agreed" },
        { id: "social-starter-posts", label: "Starter posts published across hotel and restaurant" },
        { id: "social-first-month-management", label: "First month of active management & engagement" },
      ],
    },
  ],
};

// Recurring SMM retainer template (Ridge Medical Centre and similar). One
// onboarding phase plus one phase per contracted month. The 3-month minimum
// is pre-built; extend for longer engagements via per-proposal additions.
function makeMonthPhase(monthNumber: number): TrackerPhase {
  return {
    id: `smm-month-${monthNumber}`,
    title: `Month ${monthNumber}`,
    description: `Strategy, production, publishing, and reporting for Month ${monthNumber}.`,
    icon: "rocket",
    milestones: [
      { id: `smm-month-${monthNumber}-strategy`, label: "Strategy & content calendar delivered" },
      { id: `smm-month-${monthNumber}-session`, label: "Content production session held" },
      { id: `smm-month-${monthNumber}-published`, label: "Posts published & community managed" },
      { id: `smm-month-${monthNumber}-report`, label: "Monthly performance report sent" },
    ],
  };
}

const smmMonthlyEngagement: TrackerTemplate = {
  id: "smm-monthly-engagement",
  name: "Social Media Monthly Engagement",
  phases: [
    {
      id: "smm-onboarding",
      title: "Onboarding",
      description: "Account access, brand assets, and first strategy alignment.",
      icon: "file-signature",
      milestones: [
        { id: "smm-brand-assets-received", label: "Brand assets received (logo, colours, voice notes)" },
        { id: "smm-staff-photos-received", label: "Doctor headshots & bios received" },
        { id: "smm-social-access-granted", label: "Social account access granted" },
        { id: "smm-approval-workflow-agreed", label: "Content approval workflow agreed" },
        { id: "smm-kickoff-call", label: "Kickoff strategy call held" },
      ],
    },
    makeMonthPhase(1),
    makeMonthPhase(2),
    makeMonthPhase(3),
  ],
};

export const trackerTemplates: Record<string, TrackerTemplate> = {
  [websiteProject.id]: websiteProject,
  [googleBusiness.id]: googleBusiness,
  [socialMedia.id]: socialMedia,
  [smmMonthlyEngagement.id]: smmMonthlyEngagement,
};

export function composeTracker(templateIds: string[]): TrackerPhase[] {
  return templateIds.flatMap((id) => trackerTemplates[id]?.phases ?? []);
}

export function resolveTrackerPhases(config: ProjectTrackerConfig): TrackerPhase[] {
  const composed = composeTracker(config.templates);
  const ordered: TrackerPhase[] = [...composed];
  const trailing: TrackerPhase[] = [];
  // Per-anchor offset so multiple additions targeting the same anchor stay in
  // their declared order: the first goes at anchor+1, the second at anchor+2, etc.
  const offsetByAnchor = new Map<string, number>();

  for (const addition of config.additions ?? []) {
    if (!addition.insertAfter) {
      trailing.push(addition);
      continue;
    }
    const anchorIdx = ordered.findIndex((p) => p.id === addition.insertAfter);
    if (anchorIdx === -1) {
      trailing.push(addition);
      continue;
    }
    const offset = (offsetByAnchor.get(addition.insertAfter) ?? 0) + 1;
    offsetByAnchor.set(addition.insertAfter, offset);
    ordered.splice(anchorIdx + offset, 0, addition);
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
