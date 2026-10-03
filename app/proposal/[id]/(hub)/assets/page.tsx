import type { Metadata } from "next";
import { AssetsTab } from "@/components/proposals/hub/EngagementTabs";

export const metadata: Metadata = {
  title: "Project Assets",
  description: "Provide the assets and content required to begin your project",
  robots: { index: false, follow: false },
};

export default function AssetsPage() {
  return <AssetsTab />;
}
