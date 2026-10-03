import type { Metadata } from "next";
import { ProgressTab } from "@/components/proposals/hub/EngagementTabs";

export const metadata: Metadata = {
  title: "Project Progress",
  description: "Follow your project's progress",
  robots: { index: false, follow: false },
};

export default function TrackerPage() {
  return <ProgressTab />;
}
