import type { Metadata } from "next";
import { ProposalTab } from "@/components/proposals/hub/ProposalTab";

export const metadata: Metadata = {
  title: "Your Proposal",
  description: "Enter your access code to view this proposal",
  robots: { index: false, follow: false },
  openGraph: { title: "Your Proposal", description: "Enter your access code to view this proposal" },
};

export default function ProposalPage() {
  return <ProposalTab />;
}
