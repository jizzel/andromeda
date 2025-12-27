export interface Project {
  id: string;
  name: string;
  contextLine: string; // Collapsed state
  outcomeLine: string; // Collapsed state
  status: "Production" | "Research" | "Deployed";
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  techStack: string[];
  isExpansionLayer: boolean;
}

export const projects: Project[] = [
  {
    id: "rcmonsys",
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
  },
  {
    id: "legal-intelligence",
    name: "Legal Intelligence Platform",
    contextLine: "AI-powered legal research platform for Ghanaian court rulings",
    outcomeLine:
      "Reduced research time while establishing foundation for legal intelligence products",
    status: "Deployed",
    context:
      "Legal research across decades of Ghanaian court rulings required extensive manual effort and fragmented sources.",
    problem:
      "Unstructured legal texts made retrieval slow, inconsistent, and dependent on individual researcher experience rather than systemized access.",
    approach:
      "Built an AI-powered research platform using structured ingestion pipelines and agentic workflows to transform historical rulings into searchable, semantically indexed data. Designed the system to support extensibility beyond research into commercial legal tooling.",
    outcome:
      "Reduced legal research time dramatically while establishing a foundation for scalable legal intelligence products in emerging markets.",
    techStack: ["Python", "LangChain", "Vector DB", "FastAPI"],
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
    techStack: ["Node.js", "Redis", "PostgreSQL", "Grafana"],
    isExpansionLayer: false,
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
    isExpansionLayer: true,
  },
  {
    id: "ai-marketplace",
    name: "AI Marketplace Architecture",
    contextLine:
      "Distributed system with AI-powered design generation and task automation",
    outcomeLine:
      "Reduced operational costs while improving fulfillment efficiency and scalability",
    status: "Deployed",
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
  },
];
