import { Metadata } from "next";
import { AssetsPageWrapper } from "@/components/proposals/AssetsPageWrapper";

interface AssetsPageProps {
  params: Promise<{ id: string }>;
}

export function generateMetadata(): Metadata {
  return {
    title: "Project Assets",
    description: "Provide the assets and content required to begin your project",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AssetsPage({ params }: AssetsPageProps) {
  const { id } = await params;
  return <AssetsPageWrapper proposalId={id} />;
}
