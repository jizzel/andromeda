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

// Church proposal types
export interface ProposalCostBreakdown {
  oneTime?: {
    amount: string;
    description: string;
    details: string[];
  };
  recurring: {
    type: "monthly" | "annual" | "both";
    items: {
      category: string;
      cost: string;
      details?: string[];
    }[];
  };
  commercial?: {
    description: string;
    pricing: string;
    terms?: string[];
  };
}

export interface ProposalOption {
  id: string;
  label: string; // "OPTION 1" or "OPTION 2"
  title: string;
  description: string;
  badge?: string; // "Pragmatic Choice" or "Strategic Investment"
  timeline: string;
  capabilities?: string[];
  exclusions?: string[];
  advantages: string[];
  limitations: string[];
  bestFor: string[];
  costBreakdown: ProposalCostBreakdown;
  note?: string;
}

export interface SubscriptionTier {
  id: string;
  size: string;
  assetRange: string;
  monthlyFee: string;
  annualFee: string;
  discount?: string;
  recommended?: boolean;
}

export interface RevenueScenario {
  branches: number;
  monthlyRevenue: string;
  annualRevenue: string;
}

export interface BreakEvenAnalysis {
  branches: number;
  annualRevenue: string;
  annualCosts: string;
  netMargin: string;
  breakEvenTime: string;
}

export interface DecisionCriteria {
  optionId: string;
  optionName: string;
  criteria: string[];
}

export interface CriticalFactor {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface IPTerms {
  optionId: string;
  optionName: string;
  ownership: string[];
  terms: string[];
}

// Church-style proposal type
export interface ProposalDataChurch extends Omit<ProposalData, 'phases' | 'packages' | 'paymentPlans' | 'inspirations' | 'timeline'> {
  proposalType: 'church-asset-management';
  options: ProposalOption[];
  decisionCriteria: {
    option1: DecisionCriteria;
    option2: DecisionCriteria;
    warnings: string[];
  };
  subscriptionTiers?: SubscriptionTier[];
  revenueProjections?: {
    scenarios: RevenueScenario[];
    breakEven: BreakEvenAnalysis;
    caveats: string[];
  };
  criticalFactors?: CriticalFactor[];
  ipRights: {
    option1: IPTerms;
    option2: IPTerms;
    warningMessage: string;
  };
  timeline: ProposalTimelineItem[];
  subscriptionTiersAverageExpected?: string;
  criticalFactorsTitle?: string;
  criticalFactorsSubtitle?: string;
}

// Union type for all proposal types
export type ProposalDataUnion = ProposalData | ProposalDataChurch;

// API response types
export interface VerifyAccessResponse {
  success: boolean;
  error?: string;
  proposal?: ProposalDataUnion;
}
