/**
 * A project's maturity. Adding a value here fails `tsc` until it is classified
 * as delivered or not in `constants/capability-catalogue.ts` (DELIVERED).
 */
export type ProjectStatus = "Production" | "Research" | "Deployed" | "Development" | "Open Source" | "Experiment" | "Pilot";

export interface Project {
  id: string;
  name: string;
  contextLine: string; // Collapsed state
  outcomeLine: string; // Collapsed state
  status: ProjectStatus;
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  techStack: string[];
  isExpansionLayer: boolean;
  /** Where the work was done; omitted for remote / open-source projects. */
  location?: string;
  logos?: string[];
}

export const projects: Project[] = [
  {
    id: "rcmonsys",
    name: "RCMONSYS",
    contextLine: "Cloud-based monitoring system for refrigerated container operations",
    outcomeLine:
      "Eliminated paper-based workflows and automated reporting for port terminals",
    status: "Production",
    context:
      "Logistics teams across multiple port terminals recorded reefer container temperatures on paper, manually re-entered data into Excel spreadsheets, and converted them to PDF reports for shipping lines.",
    problem:
      "Manual paper-to-Excel-to-PDF workflows were slow, error-prone, and difficult to scale as container volumes and reporting frequency increased across multiple terminals.",
    approach:
      "Built a cloud-based web application that enables mobile-friendly field data capture, centralizes container tracking across terminals, and generates Excel and PDF reports on-demand. Designed for multi-terminal and multi-user access with role-based permissions.",
    outcome:
      "Eliminated paper-based recording and manual data re-entry, providing live container visibility, traceable history, and automated report generation for terminal operators and shipping line clients.",
    techStack: ["Next.js", "NestJS", "PostgreSQL", "Excel/PDF Generation"],
    isExpansionLayer: false,
    location: "Tema, Ghana",
    logos: ["/projects/rcmonsys_logo"],
  },
  {
    id: "proxima",
    name: "Proxima",
    contextLine: "Open-source AI coding agent for the terminal, model-agnostic and permission-controlled",
    outcomeLine:
      "Multi-step development tasks from natural language, with every action gated by the developer",
    status: "Open Source",
    context:
      "AI-assisted development is moving from code completion toward autonomous agents that work directly inside software projects, which takes far more than connecting a language model to a terminal.",
    problem:
      "Language models cannot inspect or change a local environment on their own, and unrestricted file and shell access is risky. Large codebases, limited context windows, differing providers and multi-step tasks add reliability challenges.",
    approach:
      "Designed and built a modular AI coding agent in Dart around a structured reasoning and tool-execution loop, with a unified interface for multiple LLM providers, a registry of development tools, a risk-aware permission gateway, token-aware context management and persistent sessions.",
    outcome:
      "An open-source agent that carries out multi-step development tasks in the terminal (codebase analysis, file changes, tests and Git operations) across cloud and local models, with configurable permissions and an extensible foundation for agentic tooling.",
    techStack: ["Dart", "Anthropic Claude", "OpenAI", "Ollama", "Git", "GitHub Actions"],
    isExpansionLayer: false,
  },
  {
    id: "crypto-trading",
    name: "Crypto Trading Analytics Backend",
    contextLine:
      "Performance optimization for real-time crypto analytics platform",
    outcomeLine:
      "Improved system performance while maintaining high availability under load",
    status: "Production",
    context:
      "A crypto analytics platform served thousands of concurrent users requiring real-time insights and uninterrupted availability.",
    problem:
      "Performance bottlenecks and backend inefficiencies risked degraded user experience and SLA violations under peak load.",
    approach:
      "Led backend architecture improvements focused on data optimization, concurrency handling, and observability. Introduced monitoring and alerting to proactively detect and resolve performance issues in production.",
    outcome:
      "Improved system performance substantially while maintaining high availability under sustained concurrent usage.",
    techStack: ["Node.js", "Redis", "MongoDB", "Grafana", "Sentry", "Prometheus", "Python", "React/Vue", "Telegram Bot"],
    isExpansionLayer: false,
    location: "Tallinn, Estonia",
    logos: ["/projects/tradelink_logo"],
  },
  {
    id: "eolang-java",
    name: "Eolang–Java Interoperability",
    contextLine: "Runtime-level interoperability for Eolang programming language",
    outcomeLine:
      "Expanded language usability and contributed to published academic work",
    status: "Research",
    context:
      "The Eolang programming language required seamless interoperability with the Java ecosystem to support real-world adoption.",
    problem:
      "Lack of native integration limited practical use and hindered integration with existing Java-based systems.",
    approach:
      "Designed and implemented runtime-level interoperability using Java reflection to generate dynamic wrappers, enabling Eolang programs to interact directly with Java applications. Supported this work with formal research and documentation.",
    outcome:
      "Expanded the language's usability and contributed to published academic work on language design and interoperability.",
    techStack: ["Java", "Eolang", "Maven", "JUnit"],
    isExpansionLayer: false,
    location: "Moscow, Russia",
    logos: ["/projects/hse_logo", "/projects/huawei_logo"],
  },
  {
    id: "legal-intelligence",
    name: "E-Judgment: Legal Research Assistant",
    contextLine:
        "Source-grounded AI research assistant over 8,200 Ghanaian court judgments",
    outcomeLine:
        "Hybrid search finds the right case in the top 20 for 88% of test questions, and every answer links to the passages that support it",
    status: "Pilot",
    context:
        "Ghanaian judgments are published by GhaLII, but finding the authority for a legal issue or a set of facts still means trying keywords and reading judgments one by one. General AI chatbots answer fluently but can invent cases, quotes and page numbers, which makes them unusable for legal work.",
    problem:
        "The source data was messy: about 8,800 records from a local export of GhaLII, with PDFs, scans, Word files and placeholder pages saved under misleading names, unreliable file paths, duplicates published under several citations, and viewer boilerplate instead of text. Lawyers need two things a plain chatbot can't give: exact lookup by citation or case name, and answers they can check against the judgment itself.",
    approach:
        "Built a retrieval-augmented generation (RAG) system that treats evidence as the product. An offline pipeline verifies, cleans, OCRs and chunks every judgment while keeping its provenance. Search combines exact citation lookup, keyword search and meaning-based search, then reranks the results. Answers keep only the claims that quote a retrieved passage verbatim and that a local entailment model confirms the passage supports. Citations, links and page numbers come from the database, never from the model. It runs on local models by default, with the corpus used non-commercially under GhaLII's CC BY-NC 4.0 licence and GhaLII credited in every view.",
    outcome:
        "A working pilot behind invite-only sign-in: search by citation, case name, phrase or facts, and cited answers that stream with visible progress. On a 60-question test set (engineer-drafted, pending lawyer review, so provisional), hybrid search with reranking finds a correct case in the top 20 for 88% of the questions that have one (MRR@10 0.63), and citation and case-name lookups 100%. The system declines to answer when the evidence isn't there.",
    techStack: [
      "Python",
      "FastAPI",
      "PostgreSQL + pgvector",
      "SentenceTransformers",
      "Ollama",
      "OpenAI API (opt-in)",
      "Tesseract OCR",
      "Next.js",
      "TypeScript",
      "Docker Compose",
      "Caddy",
      "GitHub Actions",
    ],
    isExpansionLayer: true,
    location: "Accra, Ghana",
  },
];
