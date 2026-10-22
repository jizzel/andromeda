import type { Metadata } from "next";
import { profile } from "@/constants/profile";
import { CAPABILITIES_INTRO } from "@/constants/capability-catalogue";
import { CapabilitiesView } from "@/components/capabilities/CapabilitiesView";

export const metadata: Metadata = {
  title: "What I Do",
  description: CAPABILITIES_INTRO,
  alternates: { canonical: "/capabilities" },
  openGraph: {
    title: `What I Do: ${profile.name}`,
    description: CAPABILITIES_INTRO,
    url: `${profile.siteUrl}/capabilities`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `What I Do: ${profile.name}`,
    description: CAPABILITIES_INTRO,
  },
};

/** The shareable "What I Do" page: advising, the software Joseph builds, and putting it to work. */
export default function CapabilitiesPage() {
  return <CapabilitiesView />;
}
