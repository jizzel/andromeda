export interface Project {
  id: string;
  name: string;
  contextLine: string; // Collapsed state
  outcomeLine: string; // Collapsed state
  status: "Production" | "Research" | "Deployed" | "Development";
  context: string;
  problem: string;
  approach: string;
  outcome: string;
  techStack: string[];
  isExpansionLayer: boolean;
  location: string;
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
    location: "Tema, Ghana"
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
    techStack: ["Node.js", "Redis", "MongoDB", "Grafana", "Prometheus", "Python", "Telegram Bot"],
    isExpansionLayer: false,
    location: "Tallinn, Estonia"
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
    location: "Moscow, Russia"
  },
  {
    id: "legal-intelligence",
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
    location: "Accra, Ghana"
  },
];
