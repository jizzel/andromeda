import { z } from "zod";
import type { ProposalData, ProposalDataChurch, ProposalDataSocial } from "@/types/proposal";

/**
 * Runtime validation for proposal `data` (the JSON in the Proposals sheet),
 * used by the admin editor while typing and by the save API before writing.
 *
 * The schemas mirror `types/proposal.ts` exactly — the type assertions at the
 * bottom fail `tsc` if a type and its schema drift apart. When real data that
 * renders correctly fails validation, the fix is to correct the *type* (and
 * this schema with it), not to loosen validation.
 *
 * Severity: an unknown key is a warning (legacy fields like `pdfUrl` are still
 * in older sheet data and are simply ignored by the page); everything else is
 * an error and blocks saving, because components index into these fields
 * without guards and a malformed value can crash the client's page.
 */

const str = z.string();
const strList = z.array(str);

// --- Shared ------------------------------------------------------------------

const client = z.strictObject({ name: str, location: str, email: str.optional() });
const overview = z.strictObject({ situation: str, solution: str, primaryObjective: str });
const goal = z.strictObject({ id: str, title: str, description: str, icon: str });

const phaseOption = z.strictObject({
  id: str,
  name: str,
  price: str,
  recommended: z.boolean(),
  addon: z.boolean().optional(),
  deliverables: strList,
  purpose: strList,
  note: str.optional(),
});

const phase = z.strictObject({
  id: str,
  label: str,
  title: str,
  description: str,
  price: str.optional(),
  deliverables: strList.optional(),
  purpose: strList.optional(),
  note: str.optional(),
  image: str,
  options: z.array(phaseOption).optional(),
});

const pkg = z.strictObject({
  id: str,
  name: str,
  recommended: z.boolean(),
  totalPrice: str,
  includes: strList,
  comment: str,
});

const paymentMilestone = z.strictObject({ milestone: str, percentage: str.nullable(), amount: str.nullable() });

const paymentPlan = z.strictObject({
  id: str,
  name: str,
  badge: str,
  totalInvestment: str,
  premium: str.nullable(),
  structure: z.array(paymentMilestone),
  includes: strList,
  bestFor: str,
});

const timelineItem = z.strictObject({ phase: str, duration: str, description: str, phaseId: str.optional() });
const requirement = z.strictObject({ title: str, description: str });
const revisions = z.strictObject({ major: z.number(), minor: z.number(), note: str });
const hosting = z.strictObject({ annual: str, monthly: str, includes: strList, note: str });
const maintenancePlan = z.strictObject({ name: str, price: str, billing: str });
const maintenance = z.strictObject({
  title: str,
  description: str,
  includes: strList,
  excludes: strList,
  plans: z.array(maintenancePlan),
  note: str,
});

const inspiration = z.strictObject({ name: str, url: str, image: str, description: str.optional() });
const inspirations = z.strictObject({
  heading: str.optional(),
  subheading: str.optional(),
  footnote: str.optional(),
  hotel: z.array(inspiration).optional(),
  restaurant: z.array(inspiration).optional(),
  website: z.array(inspiration).optional(),
  items: z.array(inspiration).optional(),
});

const assetItem = z.strictObject({
  id: str,
  label: str,
  note: str.optional(),
  priority: z.enum(["required", "recommended", "optional"]).optional(),
});
const assetCategory = z.strictObject({
  id: str,
  title: str,
  description: str.optional(),
  icon: str.optional(),
  minimumCount: z.number().optional(),
  deadline: str.optional(),
  items: z.array(assetItem),
  note: str.optional(),
});
const assetRequest = z.strictObject({
  intro: str.optional(),
  uploadUrl: str.optional(),
  uploadLabel: str.optional(),
  deadline: str.optional(),
  categories: z.array(assetCategory),
  delayNotice: str.optional(),
});

const trackerMilestone = z.strictObject({
  id: str,
  label: str,
  description: str.optional(),
  clientApprovable: z.boolean().optional(),
});
const trackerPhase = z.strictObject({
  id: str,
  title: str,
  description: str.optional(),
  icon: str.optional(),
  milestones: z.array(trackerMilestone),
  insertAfter: str.optional(),
});
const trackerConfig = z.strictObject({
  templates: strList,
  startedAt: str.optional(),
  estimatedEndAt: str.optional(),
  exclude: strList.optional(),
  additions: z.array(trackerPhase).optional(),
});

/** Fields every layout shares (ProposalData minus the per-layout sections). */
const common = {
  client,
  title: str,
  subtitle: str,
  issuedAt: str.optional(),
  totalDuration: str.optional(),
  heroImage: str,
  contactEmail: str,
  overview,
  goals: z.array(goal),
  timeline: z.array(timelineItem),
  clientResponsibilities: z.array(requirement),
  revisions: revisions.optional(),
  exclusions: strList.optional(),
  assets: assetRequest.optional(),
  assetsReady: z.boolean().optional(),
  tracker: trackerConfig.optional(),
  trackerReady: z.boolean().optional(),
};

// --- Default (website / logistics / event … any other proposalType) --------------

export const defaultProposalSchema = z.strictObject({
  ...common,
  proposalType: str.optional(),
  phases: z.array(phase),
  packages: z.array(pkg),
  paymentPlans: z.array(paymentPlan),
  paymentClarification: str.optional(),
  hosting: hosting.optional(),
  maintenance: maintenance.optional(),
  inspirations: inspirations.optional(),
  phase2Preview: strList.optional(),
});

// --- Church asset management -------------------------------------------------------

const costBreakdown = z.strictObject({
  oneTime: z.strictObject({ amount: str, description: str, details: strList }).optional(),
  recurring: z.strictObject({
    type: z.enum(["monthly", "annual", "both"]),
    items: z.array(z.strictObject({ category: str, cost: str, details: strList.optional() })),
  }),
  commercial: z.strictObject({ description: str, pricing: str, terms: strList.optional() }).optional(),
});
const option = z.strictObject({
  id: str,
  label: str,
  title: str,
  description: str,
  badge: str.optional(),
  timeline: str,
  capabilities: strList.optional(),
  exclusions: strList.optional(),
  advantages: strList,
  limitations: strList,
  bestFor: strList,
  costBreakdown,
  note: str.optional(),
});
const decisionCriteria = z.strictObject({ optionId: str, optionName: str, criteria: strList });
const ipTerms = z.strictObject({ optionId: str, optionName: str, ownership: strList, terms: strList });

export const churchProposalSchema = z.strictObject({
  ...common,
  proposalType: z.literal("church-asset-management"),
  paymentClarification: str.optional(),
  hosting: hosting.optional(),
  maintenance: maintenance.optional(),
  phase2Preview: strList.optional(),
  options: z.array(option),
  decisionCriteria: z.strictObject({ option1: decisionCriteria, option2: decisionCriteria, warnings: strList }),
  subscriptionTiers: z
    .array(
      z.strictObject({
        id: str,
        size: str,
        assetRange: str,
        monthlyFee: str,
        annualFee: str,
        discount: str.optional(),
        recommended: z.boolean().optional(),
      })
    )
    .optional(),
  revenueProjections: z
    .strictObject({
      scenarios: z.array(z.strictObject({ branches: z.number(), monthlyRevenue: str, annualRevenue: str })),
      breakEven: z.strictObject({
        branches: z.number(),
        annualRevenue: str,
        annualCosts: str,
        netMargin: str,
        breakEvenTime: str,
      }),
      caveats: strList,
    })
    .optional(),
  criticalFactors: z.array(z.strictObject({ id: str, title: str, description: str, icon: str })).optional(),
  ipRights: z.strictObject({ option1: ipTerms, option2: ipTerms, warningMessage: str }),
  subscriptionTiersAverageExpected: str.optional(),
  criticalFactorsTitle: str.optional(),
  criticalFactorsSubtitle: str.optional(),
});

// --- Social media engagement ---------------------------------------------------------

export const socialProposalSchema = z.strictObject({
  ...common,
  proposalType: z.literal("social-media-engagement"),
  packages: z.array(pkg),
  contentPillars: z.array(
    z.strictObject({ id: str, title: str, description: str.optional(), items: strList, icon: str.optional() })
  ),
  scopeOfServices: z.array(z.strictObject({ id: str, title: str, items: strList, icon: str.optional() })),
  addOns: z
    .array(z.strictObject({ id: str, title: str, description: str.optional(), pricingNote: str.optional() }))
    .optional(),
  crossSell: z
    .strictObject({ title: str.optional(), intro: str, opportunities: strList, note: str.optional() })
    .optional(),
  engagement: z.strictObject({ minimumMonths: z.number(), recommendedRange: str, note: str.optional() }),
});

// --- Drift guard: schemas and types must describe exactly the same shape -----------

type Equals<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type _DefaultMatchesType = Assert<Equals<z.infer<typeof defaultProposalSchema>, ProposalData>>;
export type _ChurchMatchesType = Assert<Equals<z.infer<typeof churchProposalSchema>, ProposalDataChurch>>;
export type _SocialMatchesType = Assert<Equals<z.infer<typeof socialProposalSchema>, ProposalDataSocial>>;

// --- Validation ---------------------------------------------------------------------

/** Sheets rejects cells over 50,000 characters; keep headroom for the `data` cell. */
export const MAX_PROPOSAL_JSON_CHARS = 49_000;

/** Keys from older proposal formats that the pages no longer read. */
const LEGACY_KEYS = new Set(["id", "pdfUrl", "validityDays", "nextSteps"]);

export interface ProposalIssue {
  /** Dotted path, e.g. `packages[1].totalPrice`; "" for the root. */
  path: string;
  message: string;
}

export interface ProposalValidation {
  errors: ProposalIssue[];
  warnings: ProposalIssue[];
}

function formatPath(path: PropertyKey[]): string {
  return path.reduce<string>((out, part) => {
    if (typeof part === "number") return `${out}[${part}]`;
    return out ? `${out}.${String(part)}` : String(part);
  }, "");
}

export type ProposalLayout = "default" | "church" | "social";

/** Which layout a proposal renders with — same rule as `ProposalShell`. */
export function layoutOf(data: unknown): ProposalLayout {
  const type = (data as { proposalType?: unknown } | null)?.proposalType;
  if (type === "church-asset-management") return "church";
  if (type === "social-media-engagement") return "social";
  return "default";
}

/**
 * Whether the admin forms can render each section they edit. The forms
 * tolerate *missing* fields (shown blank; validation still reports them as
 * required) and unknown keys (kept, reported as warnings), but not wrong
 * types — `packages: [null]`, a number where text belongs — which they'd
 * dereference or call string methods on. Relaxed versions of the section
 * schemas check exactly that. `null` means the section is editable;
 * otherwise the first offending path and why, for a "fix it in JSON" notice.
 */
const formShapes = {
  packages: z.array(z.looseObject(pkg.shape).partial()),
  paymentPlans: z.array(
    z.looseObject({ ...paymentPlan.shape, structure: z.array(z.looseObject(paymentMilestone.shape).partial()) }).partial()
  ),
  timeline: z.array(z.looseObject(timelineItem.shape).partial()),
};

export type FormSection = keyof typeof formShapes;
export type FormSectionProblem = { path: string; message: string } | null;

export function formSectionProblem(data: Record<string, unknown>, section: FormSection): FormSectionProblem {
  const value = data[section];
  if (value === undefined) return null; // absent: the form starts an empty list
  const result = formShapes[section].safeParse(value);
  if (result.success) return null;
  const issue = result.error.issues[0];
  return { path: formatPath([section, ...issue.path]), message: issue.message };
}

export function schemaFor(data: unknown) {
  return { default: defaultProposalSchema, church: churchProposalSchema, social: socialProposalSchema }[layoutOf(data)];
}

/**
 * Package and payment-plan ids must be unique: a client's response records
 * the chosen ids, and the acceptance API resolves them against the proposal.
 * Reported on each repeat, at its `id` path.
 */
function duplicateIdErrors(data: Record<string, unknown>): ProposalIssue[] {
  const errors: ProposalIssue[] = [];
  for (const [key, label] of [["packages", "Package"], ["paymentPlans", "Payment plan"]] as const) {
    const list = data[key];
    if (!Array.isArray(list)) continue;
    const seen = new Set<string>();
    list.forEach((item, index) => {
      const id = (item as { id?: unknown } | null)?.id;
      if (typeof id !== "string") return;
      if (seen.has(id)) errors.push({ path: `${key}[${index}].id`, message: `${label} ids must be unique — "${id}" is already used` });
      seen.add(id);
    });
  }
  return errors;
}

export function validateProposal(data: unknown): ProposalValidation {
  const errors: ProposalIssue[] = [];
  const warnings: ProposalIssue[] = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { errors: [{ path: "", message: "The proposal must be a JSON object" }], warnings };
  }

  const result = schemaFor(data).safeParse(data);
  if (!result.success) {
    for (const issue of result.error.issues) {
      const path = formatPath(issue.path);
      if (issue.code === "unrecognized_keys") {
        for (const key of issue.keys) {
          const keyPath = path ? `${path}.${key}` : key;
          warnings.push({
            path: keyPath,
            message: !path && LEGACY_KEYS.has(key) ? "Legacy field — ignored by the page" : "Unknown field — not used by the page (typo?)",
          });
        }
      } else {
        errors.push({ path, message: issue.message });
      }
    }
  }

  errors.push(...duplicateIdErrors(data as Record<string, unknown>));

  const size = JSON.stringify(data).length;
  if (size > MAX_PROPOSAL_JSON_CHARS) {
    errors.push({
      path: "",
      message: `Proposal is ${size.toLocaleString()} characters — over the ${MAX_PROPOSAL_JSON_CHARS.toLocaleString()}-character sheet cell limit`,
    });
  }
  return { errors, warnings };
}
