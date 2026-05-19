import { Metadata } from "next";
import { BriefPageWrapper } from "@/components/brief/BriefPageWrapper";

interface BriefPageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata(): Metadata {
  return {
    title: "Protected Brief",
    description: "Enter your access code to view the creative brief",
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: "Protected Brief",
      description: "Enter your access code to view the creative brief",
    },
  };
}

export default async function BriefPage({ params }: BriefPageProps) {
  const { id } = await params;
  return <BriefPageWrapper briefId={id} />;
}
