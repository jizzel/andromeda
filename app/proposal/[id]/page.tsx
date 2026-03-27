import { Metadata } from "next";
import { ProposalPageWrapper } from "@/components/proposals/ProposalPageWrapper";

interface ProposalPageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata(): Metadata {
  return {
    title: "Protected Proposal",
    description: "Enter your access code to view this proposal",
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title: "Protected Proposal",
      description: "Enter your access code to view this proposal",
    },
  };
}

export default async function ProposalPage({ params }: ProposalPageProps) {
  const { id } = await params;

  return <ProposalPageWrapper proposalId={id} />;
}
