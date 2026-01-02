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
    screenshots: [
      {
        src: "https://res.cloudinary.com/attakorah/image/upload/v1767362535/andromeda/rcmonsys_dashboard.png",
        alt: "Real-time monitoring dashboard showing container temperature data",
        caption: "Live dashboard displaying real-time temperature monitoring across multiple terminals"
      },
    ],
    lastModified: "2024-06-15",
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
    screenshots: [
      {
        src: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1200&q=80",
        alt: "Cryptocurrency trading charts and data visualization",
        caption: "Real-time market data aggregation and analysis dashboard"
      },
      {
        src: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&q=80",
        alt: "Trading analytics and performance metrics",
        caption: "Portfolio analytics showing trading signals and performance metrics"
      },
      {
        src: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80",
        alt: "System monitoring and infrastructure metrics",
        caption: "Backend performance monitoring with Grafana dashboards"
      },
      {
        src: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&q=80",
        alt: "API architecture and microservices",
        caption: "Microservices architecture handling high-throughput trading data"
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
    screenshots: [
      {
        src: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&q=80",
        alt: "Legal documents and research materials",
        caption: "Semantic search interface for legal document discovery"
      },
      {
        src: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&q=80",
        alt: "Data visualization and analytics dashboard",
        caption: "Case law analytics showing citation networks and precedent relationships"
      },
      {
        src: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
        alt: "AI-powered research assistant interface",
        caption: "Agentic research workflow generating structured legal summaries"
      },
      {
        src: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&q=80",
        alt: "Document processing and indexing system",
        caption: "Vector database indexing pipeline for legal corpus"
      }
    ],
    lastModified: "2024-09-05",
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
    screenshots: [
      {
        src: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=1200&q=80",
        alt: "AI-generated creative designs and artwork",
        caption: "AI-powered design generation system creating custom artworks"
      },
      {
        src: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&q=80",
        alt: "Team collaboration and project management",
        caption: "Task allocation and crowdsourcing platform for design validation"
      },
      {
        src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&q=80",
        alt: "System architecture and microservices",
        caption: "Microservices architecture handling distributed AI workloads"
      },
      {
        src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80",
        alt: "Quality metrics and performance monitoring",
        caption: "Automated quality validation pipeline with AI-driven scoring"
      }
    ],
    lastModified: "2024-11-12",
  },
];
