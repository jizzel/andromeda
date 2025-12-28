import type { Project } from "./projects";

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
}

export const projectsDetail: ProjectDetail[] = [
  {
    id: "rcmonsys",
    slug: "rcmonsys",
    name: "RCMONSYS",
    contextLine: "Cold-chain monitoring system for port terminal operations",
    outcomeLine:
      "Replaced manual tracking with reliable, auditable operational visibility",
    status: "Production",
    context:
      "Cold-chain operators across multiple port terminals relied on manual temperature logging and fragmented spreadsheets to monitor reefer containers.",
    problem:
      "Manual workflows created blind spots, delayed incident response, and made compliance reporting slow and error-prone at scale.",
    approach:
      "Designed and delivered a centralized monitoring system that ingests temperature data in near real time, validates readings, and automates reporting across container lifecycles. Modeled operational workflows directly into system modules to reduce human intervention and failure points.",
    outcome:
      "Replaced manual tracking and reporting with a reliable, auditable system that improved operational visibility and significantly reduced turnaround time for compliance reporting.",
    techStack: ["Next.js", "NestJS", "PostgreSQL", "WebSockets"],
    isExpansionLayer: false,
    fullDescription:
      "RCMONSYS is a production monitoring system deployed across multiple port terminals to track and validate reefer container temperatures throughout the cold-chain logistics cycle. The system ingests sensor data in near real-time, validates readings against operational thresholds, generates compliance reports, and provides operational dashboards for terminal supervisors and logistics coordinators.",
    challenges: [
      {
        title: "Manual Data Entry at Scale",
        description:
          "Terminal operators manually logged temperature readings for hundreds of containers daily across multiple sites. This created data entry errors, delays in incident detection, and incomplete audit trails.",
      },
      {
        title: "Fragmented Reporting Systems",
        description:
          "Compliance reports were generated from disconnected spreadsheets, requiring hours of manual aggregation and validation before submission to regulatory bodies.",
      },
      {
        title: "Delayed Incident Response",
        description:
          "Temperature excursions (out-of-range readings) were only detected during manual review cycles, often hours after the incident occurred, increasing cargo loss risk.",
      },
      {
        title: "No Historical Trend Analysis",
        description:
          "Operators had no systematic way to identify recurring issues, predict equipment failures, or optimize container placement strategies based on historical performance data.",
      },
    ],
    solutions: [
      {
        title: "Real-Time Data Ingestion Pipeline",
        description:
          "Built an ingestion layer that receives temperature sensor data via WebSocket connections, validates readings against configured thresholds, and stores timestamped records in PostgreSQL with millisecond precision.",
        impact:
          "Reduced data entry workload by 95% and eliminated manual logging errors.",
      },
      {
        title: "Automated Alert System",
        description:
          "Implemented threshold-based alerting that detects temperature excursions immediately and notifies operators via dashboard alerts and email notifications with container-specific context.",
        impact:
          "Reduced incident response time from hours to minutes, preventing cargo loss.",
      },
      {
        title: "Compliance Reporting Automation",
        description:
          "Created a report generation module that aggregates temperature logs, calculates compliance metrics, and generates PDF reports formatted to regulatory standards on-demand or on schedule.",
        impact:
          "Reduced report preparation time from 4+ hours to under 2 minutes.",
      },
      {
        title: "Operational Dashboards",
        description:
          "Built real-time dashboards showing live container status, alert history, and trend analysis. Supervisors can filter by terminal, container type, and time range to identify operational patterns.",
        impact:
          "Improved operational visibility and enabled data-driven container placement decisions.",
      },
    ],
    metrics: [
      {
        label: "Data Entry Reduction",
        value: "95%",
        description: "Eliminated manual temperature logging across all terminals",
      },
      {
        label: "Incident Response Time",
        value: "< 5 min",
        description: "From temperature excursion to operator notification",
      },
      {
        label: "Report Generation",
        value: "< 2 min",
        description: "Down from 4+ hours of manual preparation",
      },
      {
        label: "System Uptime",
        value: "99.8%",
        description: "Measured over 12 months in production",
      },
    ],
  },
  {
    id: "crypto-trading",
    slug: "crypto-trading-analytics",
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
    techStack: ["Node.js", "Redis", "PostgreSQL", "Grafana"],
    isExpansionLayer: false,
    fullDescription:
      "Backend performance optimization project for a crypto trading analytics platform serving real-time market data, portfolio tracking, and algorithmic trading signals to thousands of concurrent users. The work focused on identifying and eliminating performance bottlenecks, optimizing database queries, implementing caching strategies, and establishing comprehensive monitoring to maintain SLA compliance under peak load conditions.",
    challenges: [
      {
        title: "Query Performance Degradation",
        description:
          "Complex analytical queries against large datasets caused response times to exceed acceptable thresholds during market volatility when query volume spiked.",
      },
      {
        title: "Connection Pool Exhaustion",
        description:
          "Database connection pools were undersized for concurrent load, causing request queuing and timeout errors during peak trading hours.",
      },
      {
        title: "Lack of Observability",
        description:
          "No structured performance monitoring existed. Issues were discovered reactively through user complaints rather than proactive alerts.",
      },
      {
        title: "Cache Invalidation Complexity",
        description:
          "Market data required frequent updates, but naive cache invalidation strategies either served stale data or negated cache benefits entirely.",
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
        title: "Redis Caching Layer",
        description:
          "Implemented multi-tier caching with Redis for frequently accessed market data, user portfolios, and computed analytics. Used time-based TTLs and pub/sub for cache invalidation.",
        impact:
          "Reduced database load by 60% and improved API response times by 50%.",
      },
      {
        title: "Connection Pool Tuning",
        description:
          "Right-sized connection pools based on load testing results, implemented connection pooling best practices, and added pool exhaustion alerts.",
        impact: "Eliminated connection timeout errors under peak load.",
      },
      {
        title: "Comprehensive Monitoring",
        description:
          "Built Grafana dashboards tracking API latency, error rates, database performance, cache hit rates, and system resources. Configured alerting for SLA violations and capacity thresholds.",
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
        label: "Cache Hit Rate",
        value: "85%",
        description: "Percentage of requests served from cache",
      },
      {
        label: "Database Load",
        value: "-60%",
        description: "Reduction in database query volume",
      },
      {
        label: "System Uptime",
        value: "99.9%",
        description: "SLA compliance maintained under peak load",
      },
    ],
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
    repositoryUrl: "https://github.com/objectionary/eo",
  },
  {
    id: "legal-intelligence",
    slug: "legal-intelligence-platform",
    name: "Legal Intelligence Platform",
    contextLine: "AI-powered legal research platform for Ghanaian court rulings",
    outcomeLine:
      "Reduced research time while establishing foundation for legal intelligence products",
    status: "Development",
    context:
      "Legal research across decades of Ghanaian court rulings required extensive manual effort and fragmented sources.",
    problem:
      "Unstructured legal texts made retrieval slow, inconsistent, and dependent on individual researcher experience rather than systemized access.",
    approach:
      "Built an AI-powered research platform using structured ingestion pipelines and agentic workflows to transform historical rulings into searchable, semantically indexed data. Designed the system to support extensibility beyond research into commercial legal tooling.",
    outcome:
      "Reduced legal research time dramatically while establishing a foundation for scalable legal intelligence products in emerging markets.",
    techStack: ["Python", "LangChain", "Vector DB", "FastAPI"],
    isExpansionLayer: true,
    fullDescription:
      "AI-powered platform designed to modernize legal research in emerging markets by transforming decades of unstructured court rulings into semantically searchable, structured data. The system uses vector embeddings and agentic workflows to enable natural language search across historical case law, extract relevant precedents, and generate research summaries. Built with extensibility to support future commercial legal intelligence products.",
    challenges: [
      {
        title: "Unstructured Legacy Documents",
        description:
          "Court rulings existed in inconsistent formats (PDFs, scanned images, text files) with no standardized metadata or indexing.",
      },
      {
        title: "Semantic Search Complexity",
        description:
          "Legal concepts require understanding of context, precedent hierarchies, and domain-specific terminology that simple keyword search cannot capture.",
      },
      {
        title: "Data Quality and Validation",
        description:
          "OCR errors, incomplete documents, and inconsistent citation formats required extensive cleaning and validation pipelines.",
      },
    ],
    solutions: [
      {
        title: "Structured Ingestion Pipeline",
        description:
          "Built ETL pipeline that extracts text from multiple formats, normalizes structure, extracts metadata (court, date, judges, citations), and validates data quality before indexing.",
        impact:
          "Processed decades of historical rulings into structured, searchable format.",
      },
      {
        title: "Vector Embedding and Semantic Search",
        description:
          "Implemented vector database indexing using embeddings trained on legal corpus. Enables natural language queries that return semantically relevant results rather than keyword matches.",
        impact:
          "Reduced research time from hours to minutes for complex legal queries.",
      },
      {
        title: "Agentic Research Workflows",
        description:
          "Designed LangChain-based agents that decompose research questions, query multiple data sources, synthesize findings, and generate structured summaries with citations.",
        impact:
          "Automated multi-step research workflows previously requiring manual coordination.",
      },
    ],
  },
  {
    id: "ai-marketplace",
    slug: "ai-marketplace-architecture",
    name: "AI Marketplace Architecture",
    contextLine:
      "Distributed system with AI-powered design generation and task automation",
    outcomeLine:
      "Reduced operational costs while improving fulfillment efficiency and scalability",
    status: "Development",
    context:
      "A large-scale marketplace aimed to connect thousands of users while automating design generation and operational workflows using AI.",
    problem:
      "Manual coordination and quality control created cost overhead and limited scalability.",
    approach:
      "Architected a distributed system integrating AI services for design generation, intelligent task allocation, and automated quality checks. Focused on modular services and cost-aware AI integration.",
    outcome:
      "Reduced operational costs while improving fulfillment efficiency and scalability across a growing user base.",
    techStack: ["Python", "AWS", "OpenAI API", "Microservices"],
    isExpansionLayer: true,
    fullDescription:
      "Distributed marketplace platform architecture integrating AI-powered services for automated design generation, intelligent task routing, and quality assurance. The system handles thousands of concurrent users, coordinates between multiple AI service providers, implements cost-aware request batching, and maintains quality standards through automated validation pipelines. Designed for horizontal scalability and extensibility to support new AI capabilities.",
    challenges: [
      {
        title: "AI API Cost Management",
        description:
          "Unconstrained AI service usage could rapidly exceed budget. Needed intelligent request batching, caching, and fallback strategies.",
      },
      {
        title: "Quality Consistency",
        description:
          "AI-generated outputs vary in quality. Manual review didn't scale, requiring automated quality validation before delivery.",
      },
      {
        title: "Latency vs. Throughput Trade-offs",
        description:
          "Users expect fast responses, but batching requests for cost efficiency introduces latency. Needed smart queuing strategies.",
      },
    ],
    solutions: [
      {
        title: "Cost-Aware Request Orchestration",
        description:
          "Implemented request batching, result caching, and tiered AI service selection based on complexity. Monitors cost per request and triggers fallback to cheaper models when appropriate.",
        impact: "Reduced AI service costs by 40% while maintaining quality standards.",
      },
      {
        title: "Automated Quality Validation",
        description:
          "Built validation pipeline using heuristics and secondary AI models to score output quality, detect issues, and trigger regeneration when needed.",
        impact:
          "Maintained quality standards without manual review bottlenecks.",
      },
      {
        title: "Microservices Architecture",
        description:
          "Separated concerns into independent services (design generation, task allocation, quality validation, user management) communicating via message queues.",
        impact:
          "Enabled independent scaling and deployment of high-load components.",
      },
    ],
  },
];
