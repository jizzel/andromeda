import { projects, type Project } from "./projects";

/** A home-page project's card fields, for case studies that don't restate them. Throws at load if the id is missing. */
function projectById(id: string): Project {
  const project = projects.find((p) => p.id === id);
  if (!project) throw new Error(`projects-detail: no project "${id}" in constants/projects.ts`);
  return project;
}

export interface Challenge {
  title: string;
  description: string;
}

export interface Solution {
  title: string;
  description: string;
  impact?: string;
}

export interface Metric {
  label: string;
  value: string;
  description: string;
}

export interface Screenshot {
  src: string;
  alt: string;
  caption?: string;
}

export interface Publication {
  title: string;
  authors: string[];
  venue: string;
  year: string;
  doi: string;
  url: string;
  abstract: string;
}

export interface AcademicResource {
  label: string;
  url: string;
  type: 'book' | 'organization' | 'repository';
  description?: string;
}

export interface ProjectDetail extends Project {
  slug: string;
  fullDescription: string;
  challenges: Challenge[];
  solutions: Solution[];
  metrics?: Metric[];
  screenshots?: Screenshot[];
  videoUrl?: string;
  caseStudyUrl?: string; // External case study link
  repositoryUrl?: string; // GitHub repo (if public)
  publications?: Publication[]; // Academic publications
  academicResources?: AcademicResource[]; // Books, research groups, etc.
  lastModified: string; // ISO date string for SEO sitemap
}

export const projectsDetail: ProjectDetail[] = [
  {
    id: "rcmonsys",
    slug: "rcmonsys",
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
    fullDescription:
      "RCMONSYS is a cloud-based logistics monitoring system designed to digitize and streamline the recording, tracking, and reporting of refrigerated container (reefer) conditions across multiple port terminals. The system replaces manual paper-based workflows with a centralized web application, enabling real-time data capture from field officers, structured container tracking by container number, and on-demand report generation for shipping lines and terminal management.",
    challenges: [
      {
        title: "Paper-Based Recording Workflow",
        description:
          "Field officers recorded container temperatures on paper forms during morning and evening checks. This created illegible entries, lost records, and no real-time visibility into container health.",
      },
      {
        title: "Manual Excel Re-Entry and PDF Conversion",
        description:
          "Office staff manually re-typed paper readings into Excel spreadsheets, then converted them to PDF reports for shipping lines. This process was time-consuming, error-prone, and difficult to scale.",
      },
      {
        title: "Container Lifecycle Tracking Across Days",
        description:
          "Containers remained in yards for multiple days, got evacuated, or returned later. Manual tracking made it difficult to maintain continuous history and avoid duplicate entries for the same container.",
      },
      {
        title: "Client Access and Report Delivery Delays",
        description:
          "Shipping lines depended on emailed excel/PDF reports, creating delays and lack of transparency. Clients had no independent access to view container status or download reports on-demand.",
      },
    ],
    solutions: [
      {
        title: "Mobile-Friendly Field Data Capture",
        description:
          "Built a responsive web interface accessible from desktop, tablet, or mobile devices. Field officers can record container readings directly from the terminal, capturing set point temperature, return air, ventilation, humidity, and remarks for morning and evening checks.",
        impact:
          "Eliminated paper-based recording and manual data re-entry, reducing data entry workload by 95%.",
      },
      {
        title: "Container Lifecycle Tracking by Number",
        description:
          "Implemented unique container tracking by container number with historical records preserved across days, evacuations, and re-entries. Prevents duplicate entries and improves data continuity throughout the container lifecycle.",
        impact:
          "Reduced duplicate entries and provided complete traceable history for each container.",
      },
      {
        title: "On-Demand Excel and PDF Report Generation",
        description:
          "Created automated report generation using live data, producing Excel and PDF formats aligned with operational and client reporting standards. Reports are generated on-demand without manual compilation or reformatting.",
        impact:
          "Reduced report preparation time from 4+ hours to under 2 minutes.",
      },
      {
        title: "Multi-Terminal Support with Client Access Portal",
        description:
          "Designed for multi-terminal (GPHA, MPS) and multi-user access with role-based permissions for field officers, office staff, and shipping line clients. Shipping lines can log in to view container status and download reports at any time.",
        impact:
          "Improved visibility and trust through near real-time client access, eliminating reliance on emailed reports.",
      },
    ],
    metrics: [
      {
        label: "Manual Work Eliminated",
        value: "95%",
        description: "Removed paper recording and Excel re-entry workflows",
      },
      {
        label: "Report Generation Time",
        value: "< 2 min",
        description: "Down from 4+ hours of manual preparation",
      },
      {
        label: "Multi-Terminal Coverage",
        value: "100%",
        description: "Deployed across all port terminals (GPHA, MPS)",
      },
      {
        label: "Client Self-Service Access",
        value: "24/7",
        description: "Shipping lines can view and download reports anytime",
      },
    ],
    screenshots: [
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767362535/andromeda/rcmonsys_dashboard.png",
        alt: "Real-time monitoring dashboard showing container temperature data",
        caption: "Live dashboard displaying real-time temperature monitoring across multiple terminals"
      },
    ],
    lastModified: "2024-06-15",
    location: "Tema, Ghana",
    logos: ["/projects/rcmonsys_logo"],
  },
  {
    // The card fields (name, lines, context/problem/approach/outcome, stack) live in constants/projects.ts.
    ...projectById("proxima"),
    slug: "proxima",
    fullDescription:
      "Proxima is an open-source, terminal-native AI coding agent written in Dart that lets developers understand, navigate, modify and maintain software projects in natural language. Built around an autonomous agent loop, it gives language models controlled access to development tools: inspecting codebases, locating symbols and dependencies, editing files, running shell commands and tests, and working with Git, all within explicit permission boundaries. It is model-agnostic, supporting Anthropic and OpenAI models alongside locally hosted models through Ollama and compatible endpoints, and its layered architecture keeps AI reasoning separate from tool execution, security enforcement, context management and terminal interaction.",
    challenges: [
      {
        title: "Orchestrating Autonomous Tool Execution",
        description:
          "Turning a model's proposed steps into reliable actions means interpreting tool requests, validating arguments, executing operations and feeding results back, without repetitive loops, malformed calls or steps that make no progress.",
      },
      {
        title: "Securing Filesystem and Shell Access",
        description:
          "A useful agent must edit files and run commands, but destructive operations need explicit user authorization, and that security has to be enforced by the runtime rather than by instructions to the model.",
      },
      {
        title: "Managing Limited Context Windows",
        description:
          "Repositories hold far more than a model can process at once. Keeping relevant code, history, tool results and token budgets under control during long sessions affects cost, limits and reasoning quality.",
      },
      {
        title: "Supporting Different Model Providers",
        description:
          "Cloud and local models differ in APIs, context limits, tool calling, streaming and error handling, and the agent's core logic could not be duplicated per provider.",
      },
      {
        title: "Reliability Across Multi-Step Tasks",
        description:
          "Reading files, finding references, editing code, running tests and fixing errors depend on each other. A failure at any step can leave the agent in an inconsistent state.",
      },
    ],
    solutions: [
      {
        title: "Autonomous Agent Execution Engine",
        description:
          "A structured reasoning and execution loop in which the model inspects its environment, selects tools, executes them and evaluates the results until the task is done or a limit is reached. Tool requests are validated against schemas, with safeguards against repeated and unproductive calls.",
        impact: "Multi-step engineering workflows from natural language, with execution governed by the application rather than the model.",
      },
      {
        title: "Model-Agnostic LLM Integration",
        description:
          "A unified provider abstraction for Anthropic Claude, OpenAI and local Ollama models, plus configurable OpenAI-compatible endpoints, with models switchable inside a session.",
        impact: "Less dependence on any one AI vendor, and the option to run without a cloud AI dependency at all.",
      },
      {
        title: "Risk-Based Permission Gateway",
        description:
          "Every tool request passes a central gateway that classifies it as Safe (runs automatically), Confirm (needs approval), High Risk (explicit confirmation) or Blocked (always rejected), with configurable modes, command restrictions, audit logging, credential masking and previews of proposed actions.",
        impact: "Enforceable boundaries between AI-generated instructions and the developer's machine.",
      },
      {
        title: "Codebase Navigation and Development Tools",
        description:
          "A tool registry for reading and editing files, traversing directories, pattern search, symbol discovery, reference and import analysis, shell execution, testing and Git, each with an input schema and a risk classification.",
        impact: "From conversational assistance to practical repository analysis, modification and workflow automation.",
      },
      {
        title: "Token-Aware Context Management",
        description:
          "Context budgeting, codebase indexing, file chunking, relevance-based selection and conversation compaction keep the important information in view during long sessions.",
        impact: "Coherent multi-step work within finite model context windows.",
      },
      {
        title: "Persistent Sessions, Audit Trails and Undo",
        description:
          "Resumable sessions that track files accessed and changed, execution history and token usage, an append-only permission audit log, automatic backups and an undo command.",
        impact: "Continuity, traceability and recoverability during AI-assisted development.",
      },
      {
        title: "Specialist Subagent Delegation",
        description:
          "The main agent can hand bounded subtasks to specialist agents for code analysis, refactoring and testing, with limits that prevent runaway task expansion.",
        impact: "Structured task decomposition while keeping execution control central.",
      },
      {
        title: "Extensible Plugin Architecture",
        description:
          "Plugins add tools without changing the core, through JSON descriptors and a structured input/output protocol, with discovery, installation, removal, integrity checks and project or global scope.",
        impact: "An extensible tool ecosystem for new capabilities and integrations.",
      },
      {
        title: "Cross-Platform CLI and Automated Releases",
        description:
          "An interactive terminal interface with streaming responses, keyboard navigation, command completion and model selection, plus GitHub Actions workflows that publish standalone executables for macOS, Linux and Windows.",
        impact: "A portable tool that runs without installing the Dart SDK, interactively or as a one-shot task runner.",
      },
    ],
    metrics: [
      {
        label: "Model Providers",
        value: "3+",
        description: "Anthropic, OpenAI and local Ollama, plus OpenAI-compatible endpoints",
      },
      {
        label: "Permission Levels",
        value: "4",
        description: "Safe, Confirm, High Risk and Blocked, enforced by the runtime",
      },
      {
        label: "Platforms",
        value: "3",
        description: "Standalone binaries for macOS, Linux and Windows",
      },
      {
        label: "License",
        value: "MIT",
        description: "Open source on GitHub",
      },
    ],
    repositoryUrl: "https://github.com/jizzel/proxima",
    lastModified: "2026-10-19",
  },
  {
    // The card fields (name, lines, context/problem/approach/outcome, stack) live in constants/projects.ts.
    ...projectById("crypto-trading"),
    slug: "crypto-trading-analytics",
    fullDescription:
      "Backend performance optimization project for a crypto trading analytics platform serving real-time market data, portfolio tracking, and algorithmic trading signals to thousands of concurrent users. The work focused on identifying and eliminating performance bottlenecks, optimizing database queries, implementing caching strategies, and establishing comprehensive monitoring to maintain SLA compliance under peak load conditions.",
    challenges: [
      {
        title: "Query Performance Degradation",
        description:
          "Complex analytical queries against large datasets caused response times to exceed acceptable thresholds during market volatility when query volume spiked.",
      },
      {
        title: "User Engagement and Mobile Accessibility",
        description:
          "Traders needed instant access to portfolio updates, market alerts, and trading signals beyond the web platform. Mobile-first accessibility was critical for time-sensitive trading decisions.",
      },
      {
        title: "Lack of Observability",
        description:
          "No structured performance monitoring existed. Issues were discovered reactively through user complaints rather than proactive alerts.",
      },
      {
        title: "Manual Reporting and Data Aggregation",
        description:
          "Daily PnL reports and performance analytics required manual data collection from exchange APIs and spreadsheet compilation, consuming hours of operational overhead.",
      },
    ],
    solutions: [
      {
        title: "Query Optimization and Indexing",
        description:
          "Analyzed slow query logs, added strategic database indexes, and refactored N+1 query patterns into efficient batch operations. Introduced read replicas for analytical workloads.",
        impact:
          "Reduced P95 query latency by 70% and eliminated timeout errors.",
      },
      {
        title: "Real-Time Telegram Bot Integration",
        description:
          "Designed and built a Python-based Telegram bot providing traders with instant access to portfolio analytics, market alerts, index performance tracking, and trading signals. Users receive real-time notifications for price movements, position updates, and PnL changes directly in Telegram.",
        impact:
          "Increased daily active users by 30% through mobile-first accessibility and instant notifications.",
      },
      {
        title: "Automated Analytics and Reporting Pipeline",
        description:
          "Engineered a periodic data pipeline that pulls market data from Binance API every 55 minutes, processes trading metrics, stores structured data in MongoDB, and automatically generates daily PnL reports in Google Sheets. Designed for near real-time insights without manual intervention.",
        impact:
          "Eliminated manual reporting overhead and enabled automated daily performance tracking.",
      },
      {
        title: "Feature Development and Critical Bug Resolution",
        description:
          "Implemented new features and resolved critical bugs across the full stack (Node.js backend, React/Vue frontend, MongoDB database). Contributions included enhancing portfolio tracking accuracy, improving index calculation logic, and fixing data synchronization issues affecting user experience.",
        impact:
          "Contributed to 10% increase in customer satisfaction scores through improved platform reliability and feature richness.",
      },
      {
        title: "Comprehensive Monitoring and Observability",
        description:
          "Implemented and integrated observability tooling, including self-hosted Sentry for error tracking and Grafana dashboards with Prometheus metrics, to monitor API latency, error rates, database performance, and system resource utilization. Configured proactive alerts for SLA breaches and capacity thresholds.",
        impact:
          "Enabled proactive issue detection and resolution before user impact.",
      },
    ],
    metrics: [
      {
        label: "Query Latency (P95)",
        value: "-70%",
        description: "Reduction in 95th percentile query response time",
      },
      {
        label: "Daily Active Users",
        value: "+30%",
        description: "Growth from Telegram bot mobile-first accessibility",
      },
      {
        label: "Customer Satisfaction",
        value: "+10%",
        description: "Improvement through enhanced features and stability",
      },
      {
        label: "System Uptime",
        value: "99.9%",
        description: "SLA compliance maintained under peak load",
      },
    ],
    screenshots: [
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767373284/andromeda/tl_analytics_a.png",
        alt: "Cryptocurrency trading charts and data visualization",
        caption: "Real-time market data aggregation and analysis dashboard"
      },
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767373283/andromeda/tl_analytics_b.png",
        alt: "Trading analytics and performance metrics",
        caption: "Portfolio analytics showing trading signals and performance metrics"
      }
    ],
    lastModified: "2024-08-20",
  },
  {
    id: "eolang-java",
    slug: "eolang-java-interoperability",
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
    fullDescription:
      "Research project focused on enabling seamless interoperability between the Eolang programming language and the Java Virtual Machine (JVM) ecosystem. The work involved designing runtime mechanisms for bidirectional communication between Eolang objects and Java classes, implementing dynamic type mapping using reflection, and validating the approach through formal testing and academic publication.",
    challenges: [
      {
        title: "Type System Mismatch",
        description:
          "Eolang's object-oriented paradigm differs fundamentally from Java's class-based model. Mapping between type systems required careful design to preserve semantics.",
      },
      {
        title: "Runtime Performance Overhead",
        description:
          "Reflection-based dynamic invocation introduced performance costs that needed to be measured and minimized to ensure practical usability.",
      },
      {
        title: "Limited Existing Research",
        description:
          "Few precedents existed for this specific language pairing, requiring original research into interoperability patterns and validation methodologies.",
      },
    ],
    solutions: [
      {
        title: "Reflection-Based Dynamic Wrappers",
        description:
          "Implemented a wrapper generation system using Java reflection API to dynamically introspect Java classes and generate Eolang-compatible bindings at runtime.",
        impact:
          "Enabled Eolang programs to instantiate and invoke Java objects without manual binding code.",
      },
      {
        title: "Bidirectional Type Mapping",
        description:
          "Designed type conversion rules mapping Eolang data structures to Java primitives and objects, with runtime validation to detect incompatible operations.",
        impact: "Achieved type-safe interoperability between both languages.",
      },
      {
        title: "Formal Testing and Validation",
        description:
          "Created comprehensive test suites covering edge cases, performance benchmarks, and integration scenarios. Documented findings in academic paper format.",
        impact:
          "Validated approach rigorously and contributed to published research.",
      },
    ],
    screenshots: [
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767358230/andromeda/eolang_code_snippet.png",
        alt: "Code editor showing programming language development",
        caption: "Eolang sample code snippet"
      },
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767358040/andromeda/type_system.png",
        alt: "Software development and code structure",
        caption: "Type system mapping between Eolang and Java runtime"
      },
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767356363/andromeda/eo_reflections.png",
        alt: "Programming and software architecture",
        caption: "Reflection-based wrapper generation system architecture"
      },
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767354738/andromeda/eolang_metrics.png",
        alt: "Testing and validation framework",
        caption: "Comprehensive test suite validating cross-language integration"
      }
    ],
    publications: [
      {
        title: "Exploring the Eolang-Java Integration and Interoperability",
        authors: ["Joseph Afriyie Attakorah", "Co-authors"],
        venue: "Procedia Computer Science",
        year: "2021",
        doi: "10.1016/j.procs.2021.09.234",
        url: "https://doi.org/10.1016/j.procs.2021.09.234",
        abstract: "In recent times, the subject of interoperability has become very popular. In large-scale software applications development, it is a common practice to combine multiple languages in solving peculiar problems and developing robust solutions. The ability to combine multiple languages allows an easy migration of an existing project from one language to another or use existing libraries in another language. This makes interoperability a force to be reckoned with when developing new programming languages. The Eolang programming language is a new research and development initiative aimed at achieving true Object-Oriented Programming by having all components of the program as objects. As such, the construct and syntax of Eolang is vastly different from that of Java. This makes integration and interoperability between these two languages a challenging issue related to method/object naming conventions, keywords and operators, etc. In this paper we explore the potential of Eolang interoperability with Java by looking at the interoperability mechanisms of some other languages with Java, describe ways to overcome these challenges with Eolang and develop the solution. Specifically, we focus on the possibility to call Java code from Eolang while the semantics of both languages remain preserved. Our solution allows Java code to be called in Eolang through wrappers that turn Java classes and methods into Eolang Objects."
      }
    ],
    academicResources: [
      {
        label: "Co-authored Book: Elegant Objects",
        url: "https://www.objectionary.com/eo-book/book.pdf",
        type: "book",
        description: "Comprehensive guide to the Eolang programming language and its object-oriented principles"
      },
      {
        label: "HSE Eolang Research Group",
        url: "https://github.com/HSE-Eolang",
        type: "organization",
        description: "Academic research organization advancing Eolang language development"
      },
      {
        label: "Main Eolang Repository",
        url: "https://github.com/objectionary/eo",
        type: "repository",
        description: "Official Eolang compiler and runtime implementation"
      }
    ],
    repositoryUrl: "https://github.com/objectionary/eo",
    lastModified: "2024-03-10",
    location: "Moscow, Russia",
    logos: ["/projects/hse_logo", "/projects/huawei_logo"],
  },
  {
    // The card fields (name, lines, context/problem/approach/outcome, stack, status) live in constants/projects.ts.
    ...projectById("legal-intelligence"),
    slug: "legal-intelligence-platform",
    fullDescription:
        "E-Judgment is a legal research assistant over about 8,200 Ghanaian judgments, built so that a lawyer can trust and check every statement it makes. An ingestion pipeline turns a messy export of 8,803 records into a verified corpus of 159,000 passages, each an exact span of its judgment and tied to its source, extraction method, licence and original GhaLII link. Search fuses exact citation lookup, Postgres full-text search and pgvector embedding search with Reciprocal Rank Fusion, reranks with a cross-encoder and groups results by case, so one long judgment can't crowd out the rest. Answers come from a local LLM (Ollama, or OpenAI when explicitly enabled) as structured claims, and the server keeps only the claims it can verify against the passages; when nothing survives, the system declines. Around this sits production work: invite-only accounts with Argon2id passwords and lockout, hashed audit logs with retention, a Next.js research workspace with a side-by-side evidence panel and streamed, cancellable answers, an in-app tool for lawyers to review test questions, reproducible evaluation runs, and a Docker Compose deployment with backups, restore drills and CI gates.",
    challenges: [
      {
        title: "Untrustworthy Source Files",
        description:
            "The export saved every download as .pdf, but by file signature the files were PDFs, Word documents, scans and 553 copies of the same placeholder web page. File names were truncated citations, so some paths pointed at another judgment's file, and about 10% of judgments were re-published under different citations.",
      },
      {
        title: "Exact Lookup and Meaning in One Search",
        description:
            "Lawyers search both ways: by citation or case name, where embeddings can't reliably tell [2019] GHASC 12 from [2019] GHASC 21, and by describing a legal issue or facts, where keyword search found almost none of the right cases.",
      },
      {
        title: "Answers That Can Be Trusted",
        description:
            "Language models can invent cases, quotes and page numbers, and a quote that exists doesn't prove the claim built on it. Legal answers had to be checkable down to the passage, with page numbers only when they are certain.",
      },
      {
        title: "Measuring Quality Honestly",
        description:
            "Changes to search and generation needed numbers, not impressions, but the only test questions available at first were written by an engineer rather than a lawyer, so any numbers from them had to be clearly marked as provisional.",
      },
    ],
    solutions: [
      {
        title: "Verified Ingestion with Provenance",
        description:
            "Each source file is identified by its signature and hash and cross-checked against the record's text with character n-gram matching before it is used. Records that can't be trusted are quarantined with a reason code. Word files are converted and scans are OCR'd page by page with Tesseract, with confidence scores. Text is split into passages of 300–400 tokens, each an exact span of its source. Every stage is idempotent, so re-running it changes nothing.",
        impact:
            "Of 8,803 records, 8,242 judgments are searchable; 561 were quarantined rather than indexed (553 of them placeholder pages with no judgment text). 1,476 scanned pages were recovered by OCR.",
      },
      {
        title: "Hybrid Retrieval with Case-Level Results",
        description:
            "Exact citation and case-name lookup run first. Postgres full-text search and pgvector embeddings (bge-small) are fused with Reciprocal Rank Fusion and reranked by a cross-encoder. Results are grouped by case, and re-publications of the same judgment collapse into one result. Filters are strict and never silently widened, and a degraded search (e.g. a model missing) says so.",
        impact:
            "On the provisional test set, correct cases appear in the top 20 for 88% of answerable questions, against 39% for keyword search alone, and citation and case-name questions score 100%.",
      },
      {
        title: "Verified, Server-Built Answers",
        description:
            "The model returns structured claims, each with a quote and its sources. A claim is kept only if the quote appears verbatim in a cited passage, the claim adds no citation or page number of its own, and an NLI cross-encoder judges the passage to entail it. The server builds the answer from the surviving claims and adds citations, GhaLII links and page numbers from the database, the latter only for pages it has verified. Answers stream with live progress and can be cancelled.",
        impact:
            "Answers carry no model-written citations, links or page numbers; each statement links to the exact passage behind it, and the system declines to answer when no claim survives.",
      },
      {
        title: "Reproducible Evaluation and Cost Control",
        description:
            "Every evaluation run stores the models, settings and a fingerprint of the corpus, so results can be reproduced. Lawyers review test questions in the app, with versioned edits and history, and metrics are reported separately for approved questions. OpenAI is opt-in, with a usage ledger and a per-run budget stop, and a protocol is ready for comparing search quality with GhaLII's own site search.",
        impact:
            "A 20-question pilot on an OpenAI model cost under 1 cent, and every reported number is tied to a stored, reproducible run.",
      },
    ],
    metrics: [
      {
        label: "Correct Case in Top 20",
        value: "88%",
        description: "Hybrid search with reranking, on the provisional 60-question test set",
      },
      {
        label: "Citation and Case-Name Lookup",
        value: "100%",
        description: "Exact lookups on the same test set",
      },
      {
        label: "Searchable Judgments",
        value: "8,242",
        description: "Ghanaian court judgments from GhaLII, verified and cleaned (of 8,803 records)",
      },
      {
        label: "Passages",
        value: "159,000",
        description: "Indexed spans, each tied to its source and licence",
      },
    ],
    lastModified: "2026-10-20",
  },
];
