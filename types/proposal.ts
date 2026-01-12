// Types for proposal data from Google Sheets

export interface ProposalClient {
  name: string;
  location: string;
}

export interface ProposalOverview {
  situation: string;
  solution: string;
  primaryObjective: string;
}

export interface ProposalGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ProposalPhaseOption {
  id: string;
  name: string;
  price: string;
  recommended: boolean;
  addon?: boolean;
  deliverables: string[];
  purpose: string[];
  note?: string;
}

export interface ProposalPhase {
  id: string;
  label: string;
  title: string;
  description: string;
  price?: string;
  deliverables?: string[];
  purpose?: string[];
  note?: string;
  image: string;
  options?: ProposalPhaseOption[];
}

export interface ProposalPackage {
  id: string;
  name: string;
  recommended: boolean;
  totalPrice: string;
  includes: string[];
  comment: string;
}

export interface PaymentMilestone {
  milestone: string;
  percentage: string | null;
  amount: string;
}

export interface ProposalPaymentPlan {
  id: string;
  name: string;
  badge: string;
  totalInvestment: string;
  premium: string | null;
  structure: PaymentMilestone[];
  includes: string[];
  bestFor: string;
}

export interface ProposalTimelineItem {
  phase: string;
  duration: string;
  description: string;
}

export interface ProposalRequirement {
  title: string;
  description: string;
}

export interface ProposalRevisions {
  major: number;
  minor: number;
  note: string;
}

export interface ProposalHosting {
  annual: string;
  monthly: string;
  includes: string[];
  note: string;
}

export interface ProposalInspiration {
  name: string;
  url: string;
  image: string;
}

export interface ProposalInspirations {
  hotel: ProposalInspiration[];
  restaurant: ProposalInspiration[];
}

export interface ProposalAccess {
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
}

export interface ProposalData {
  id: string;
  client: ProposalClient;
  title: string;
  subtitle: string;
  validityDays: number;
  heroImage: string;
  pdfUrl: string;
  contactEmail: string;
  overview: ProposalOverview;
  goals: ProposalGoal[];
  phases: ProposalPhase[];
  packages: ProposalPackage[];
  paymentPlans: ProposalPaymentPlan[];
  timeline: ProposalTimelineItem[];
  clientResponsibilities: ProposalRequirement[];
  revisions: ProposalRevisions;
  hosting: ProposalHosting;
  exclusions: string[];
  inspirations: ProposalInspirations;
  phase2Preview: string[];
}

export interface ProposalSheetRow extends ProposalAccess {
  data: ProposalData;
}

// API response types
export interface VerifyAccessResponse {
  success: boolean;
  error?: string;
  proposal?: ProposalData;
}
