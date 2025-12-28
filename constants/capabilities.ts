export interface Capability {
  id: string;
  title: string;
  tagline: string;
  description: string;
  examples: string[];
  icon?: string; // Lucide icon name
}

export const capabilities: Capability[] = [
  {
    id: "operational-management",
    title: "Operational Management Systems",
    tagline: "Building software that replaces manual workflows with reliable automation",
    description:
      "Full-stack systems that automate complex operational processes, from data ingestion to reporting and compliance. Designed for real production environments where reliability and clarity matter.",
    examples: [
      "Real-time monitoring dashboards with automated alerting",
      "Automated compliance reporting and audit trails",
      "Role-based access control and workflow management",
      "Mobile-first data capture and validation",
    ],
    icon: "Settings",
  },
  {
    id: "monitoring-alerting",
    title: "Monitoring and Alerting Platforms",
    tagline: "Systems that turn operational data into actionable visibility",
    description:
      "Monitoring solutions that provide real-time visibility into system health, operational metrics, and critical events. Built for environments where downtime has consequences.",
    examples: [
      "Near real-time data ingestion and validation",
      "Customizable alert thresholds and escalation",
      "Historical data analysis and trend visualization",
      "Integration with existing operational workflows",
    ],
    icon: "Activity",
  },
  {
    id: "workflow-automation",
    title: "Workflow Automation",
    tagline: "Eliminating manual processes through intelligent automation",
    description:
      "Automated workflows that reduce human intervention, minimize errors, and improve operational efficiency. Focused on practical automation that solves real business problems.",
    examples: [
      "Automated report generation and distribution",
      "Task allocation and intelligent routing",
      "Data synchronization across systems",
      "Quality control and validation automation",
    ],
    icon: "Workflow",
  },
  {
    id: "api-integration",
    title: "API Development and System Integration",
    tagline: "Connecting systems with robust, well-designed APIs",
    description:
      "RESTful APIs and integration layers that connect disparate systems, enable data flow, and support scalable architectures. Emphasis on reliability, performance, and clear documentation.",
    examples: [
      "RESTful API design and implementation",
      "Third-party service integration",
      "WebSocket connections for real-time updates",
      "Database optimization and query performance",
    ],
    icon: "Plug",
  },
];
