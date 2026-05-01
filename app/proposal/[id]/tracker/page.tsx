import { Metadata } from "next";
import { TrackerPageWrapper } from "@/components/proposals/TrackerPageWrapper";

interface TrackerPageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata(): Metadata {
  return {
    title: "Project Tracker",
    description: "Live progress for your project — phases, milestones, and updates",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TrackerPage({ params }: TrackerPageProps) {
  const { id } = await params;
  return <TrackerPageWrapper proposalId={id} />;
}
