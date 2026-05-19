// Types for creative brief data from Google Sheets

export interface BriefVision {
  venueName: string;
  statement: string;
}

export interface BriefReferenceImage {
  src: string;
  alt: string;
  credit: string;
  takeaway: string;
}

export interface BriefReferenceCategory {
  id: string;
  title: string;
  description?: string;
  images: BriefReferenceImage[];
}

export interface BriefEditingDirection {
  dos: string[];
  donts: string[];
}

export interface BriefShotPriorityItem {
  label: string;
  description?: string;
}

export interface BriefShotPriorities {
  tier1: BriefShotPriorityItem[];
  tier2: BriefShotPriorityItem[];
}

export interface BriefShotItem {
  label: string;
  mustHave?: boolean;
}

export interface BriefShotArea {
  id: string;
  title: string;
  items: BriefShotItem[];
}

export interface BriefShotListVenue {
  venueName: string;
  areas: BriefShotArea[];
}

export interface BriefTimingWindow {
  label: string;
  range: string;
}

export interface BriefLogistics {
  recommendedDates: string;
  timing: BriefTimingWindow[];
  prepChecklist: string[];
  staffGuidance: string[];
}

export interface BriefDeliverableCategory {
  label: string;
  items: string[];
}

export interface BriefDeliverables {
  categories: BriefDeliverableCategory[];
}

export interface CreativeBriefData {
  projectTitle: string;
  shootClient: string;
  venueNames: string[];
  intro: string;
  contactEmail: string;
  /** Brief version (e.g. "1.0"). Helps photographers confirm they have the latest. */
  version: string;
  /** ISO date when the brief was last revised. */
  updatedAt: string;
  visions: BriefVision[];
  referenceCategories: BriefReferenceCategory[];
  editing: BriefEditingDirection;
  shotPriorities: BriefShotPriorities;
  shotList: BriefShotListVenue[];
  logistics: BriefLogistics;
  deliverables: BriefDeliverables;
}

export interface BriefSheetRow {
  id: string;
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
  data: CreativeBriefData;
}

export interface VerifyBriefResponse {
  success: boolean;
  brief?: CreativeBriefData;
  expiryDate?: string;
  error?: string;
}
