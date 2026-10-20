/**
 * The full catalogue of what Joseph builds, shown at /capabilities (a page to
 * share when someone asks what kinds of projects he can take on). The home
 * page's short Capabilities section (`constants/capabilities.ts`) links here.
 * Copy rules: no em dashes; British spelling.
 */

import type { CapabilityIconName } from "@/components/capabilities/icons";
import { profile } from "@/constants/profile";
import { projectsDetail } from "@/constants/projects-detail";
import type { ProjectStatus } from "@/constants/projects";

/** When this catalogue last changed (the sitemap's lastModified). Bump it when editing the content below. */
export const CAPABILITIES_LAST_MODIFIED = "2026-10-20";

/** Maturity of a piece of evidence: a case study's status, or one written on a proof without a case study. */
export type ProofStatus = ProjectStatus | "Delivered" | "In use" | "In development" | "In testing";

export interface CapabilityProof {
  /** What was built, in a few words. */
  label: string;
  /** A case study on this site, when there is one (its status comes from the case study). */
  slug?: string;
  /** Maturity for work without a case study, e.g. "Delivered", "In use", "In development". */
  status?: ProofStatus;
}

export interface CatalogueItem {
  id: string;
  title: string;
  description: string;
  examples: string[];
  /** One of `CAPABILITY_ICONS` (components/capabilities/icons.ts). */
  icon: CapabilityIconName;
  proof?: CapabilityProof[];
}

export interface CatalogueGroup {
  id: string;
  title: string;
  intro: string;
  items: CatalogueItem[];
}

export const CAPABILITIES_INTRO =
  "I design, build, integrate and maintain custom software for businesses, organisations and startups, including AI-powered tools: from a single module to a complete system, and from the first requirements session through deployment and ongoing support.";

export const CAPABILITY_GROUPS: CatalogueGroup[] = [
  {
    id: "business-systems",
    title: "Systems that run your business",
    intro: "Software your team and your customers use every day.",
    items: [
      {
        id: "web-applications",
        title: "Business Web Applications & Portals",
        description: "Custom web applications built around how your organisation actually works.",
        examples: ["Adding AI to an existing system", "Customer and client portals", "Dashboards", "Internal management systems", "Role-based staff tools"],
        icon: "LayoutDashboard",
        proof: [{ label: "A client portal for proposals, e-signed agreements and project tracking", status: "In use" }],
      },
      {
        id: "process-automation",
        title: "Process Automation & Enterprise Tools",
        description: "Replacing paper, spreadsheets and manual re-entry with reliable, auditable workflows.",
        examples: ["ERP-style systems", "Approval workflows", "Inventory management", "Operational tools and reporting"],
        icon: "Workflow",
        proof: [{ label: "RCMONSYS: paper-based container monitoring replaced with automated reports", slug: "rcmonsys" }],
      },
      {
        id: "booking-registration",
        title: "Booking, Registration & Ticketing",
        description: "Platforms that take people from sign-up to check-in without lists and phone calls.",
        examples: ["Appointment scheduling", "Hotel reservations", "Event registration with QR passes and check-in", "Service booking"],
        icon: "Ticket",
        proof: [{ label: "An event platform used at a live event: 232 registrations, QR check-in and 881 meal claims", status: "Delivered" }],
      },
      {
        id: "e-commerce",
        title: "E-Commerce & Marketplaces",
        description: "Selling online, from a single store to a marketplace with many vendors.",
        examples: ["Online stores", "Multi-vendor marketplaces", "Payment integrations", "Order management"],
        icon: "ShoppingCart",
      },
    ],
  },
  {
    id: "intelligence-data",
    title: "AI, data and visibility",
    intro: "Turning information into answers, decisions and early warnings.",
    items: [
      {
        id: "ai-applications",
        title: "AI-Powered Applications",
        description: "Practical AI that works on your own documents and processes, with answers you can check.",
        examples: ["AI agents and agentic workflows", "AI assistants", "Intelligent document processing", "Knowledge-base search", "Retrieval-augmented generation (RAG)", "AI workflow automation"],
        icon: "Sparkles",
        proof: [
          { label: "E-Judgment: source-grounded legal research assistant over 8,200 Ghanaian court judgments", slug: "legal-intelligence-platform" },
          { label: "Proxima: open-source AI coding agent with permission-controlled tool execution", slug: "proxima" },
        ],
      },
      {
        id: "data-analytics",
        title: "Data, Reporting & Analytics",
        description: "Pipelines and reports that put accurate numbers in front of the people who need them.",
        examples: ["Data processing pipelines", "Automated reporting", "Interactive dashboards", "Business intelligence tools"],
        icon: "BarChart3",
        proof: [{ label: "Crypto Trading Analytics Backend: automated analytics and reporting", slug: "crypto-trading-analytics" }],
      },
      {
        id: "real-time-monitoring",
        title: "Real-Time Tracking & Monitoring",
        description: "Live visibility into operations, with alerts before small problems become big ones.",
        examples: ["Live tracking dashboards", "GPS-enabled solutions", "Alerts and notifications", "Real-time communication"],
        icon: "Activity",
        proof: [{ label: "RCMONSYS: live container monitoring across terminals", slug: "rcmonsys" }],
      },
    ],
  },
  {
    id: "foundations",
    title: "The foundations",
    intro: "The technical groundwork that keeps systems connected, online and maintained.",
    items: [
      {
        id: "api-integration",
        title: "APIs & System Integration",
        description: "Connecting the software you already have, and building the services new software needs.",
        examples: ["Backend services", "REST and GraphQL APIs", "Third-party and payment-gateway integrations", "Connecting existing systems"],
        icon: "Plug",
        proof: [
          { label: "Crypto Trading Analytics Backend: real-time Telegram bot integration", slug: "crypto-trading-analytics" },
          { label: "Eolang–Java Interoperability: research on bridging two languages", slug: "eolang-java-interoperability" },
        ],
      },
      {
        id: "websites-cms",
        title: "Websites & Content Management",
        description: "Fast, credible websites your team can keep up to date.",
        examples: ["Corporate websites", "Institutional portals", "Hospitality websites", "CMS-powered sites", "Custom admin interfaces"],
        icon: "Globe",
      },
      {
        id: "cloud-devops",
        title: "Cloud, Deployment & Maintenance",
        description: "Getting software live, keeping it healthy and improving it over time.",
        examples: ["Deployment and cloud hosting", "Database management", "CI/CD pipelines", "Monitoring and performance tuning", "Ongoing maintenance"],
        icon: "Cloud",
      },
    ],
  },
];

export const ENGAGEMENT_MODES: { title: string; description: string }[] = [
  { title: "End-to-end delivery", description: "Requirements, architecture, build, deployment and maintenance." },
  { title: "Joining your team", description: "An extra engineer inside an existing development team." },
  { title: "A specific module", description: "One feature or component, built to fit your system." },
  { title: "Modernising legacy software", description: "Moving an ageing application onto a maintainable footing." },
  { title: "New capabilities", description: "Adding AI, integrations or automation to software you already run." },
];

/**
 * A proof's maturity: the case study's own status (so it can't go stale), or
 * the status written on the proof for work without a case study.
 */
export function proofStatus(proof: CapabilityProof): ProofStatus | undefined {
  if (proof.slug) return projectsDetail.find((p) => p.slug === proof.slug)?.status;
  return proof.status;
}

/**
 * Whether each status is delivered or shipped work (what "Built" claims).
 * A closed, exhaustive table: an unknown status can't be written on a proof,
 * and a new case-study status (ProjectStatus) fails `tsc` until it's
 * classified here, so nothing counts as delivered by default.
 */
const DELIVERED: Record<ProofStatus, boolean> = {
  Production: true,
  Deployed: true,
  "Open Source": true,
  Research: true,
  Pilot: true,
  Delivered: true,
  "In use": true,
  Development: false,
  Experiment: false,
  "In development": false,
  "In testing": false,
};

/** Whether a proof is delivered or shipped work. No status (e.g. an unknown slug) counts as not delivered. */
export function isDeliveredProof(proof: CapabilityProof): boolean {
  const status = proofStatus(proof);
  return status !== undefined && DELIVERED[status];
}

/** Whether an item is backed by delivered or shipped work. One rule for the page and the PDF. */
export const isDelivered = (item: CatalogueItem): boolean => !!item.proof?.some(isDeliveredProof);

/** Technologies used in delivered work (case studies and this site). Keep it to what the projects show. */
export const TECH_EXPERTISE: { area: string; items: string[] }[] = [
  { area: "Frontend", items: ["React", "Next.js", "TypeScript", "Tailwind CSS"] },
  { area: "Backend", items: ["Node.js", "NestJS", "Python (FastAPI)", "Java", "Dart"] },
  { area: "Data", items: ["PostgreSQL", "MongoDB", "Redis", "Vector databases (pgvector)"] },
  { area: "AI", items: ["Anthropic Claude", "OpenAI", "Ollama", "RAG"] },
  { area: "Cloud & DevOps", items: ["Digital Ocean", "Docker", "GitHub Actions", "Grafana", "Prometheus", "CI/CD", "GCP", "Railway", "Vercel", "Caddy", "Envoy"] },
];

/** The one-page PDF's title (the web page stays "What I Build"). */
export const STATEMENT_TITLE = "Software Engineering & Solutions Capabilities Statement";

/** A ready-to-forward introduction for people referring Joseph (copied from the page). */
export const REFERRAL_INTRO =
  `${profile.name} is a software engineer who designs, builds and maintains custom software: business web applications and portals, process automation, booking and registration platforms, AI-powered tools, data and reporting systems, and the APIs and cloud infrastructure behind them. He can deliver a complete system end to end, build a specific module, or join an existing team. His capabilities and past work: ${profile.siteUrl}/capabilities`;
