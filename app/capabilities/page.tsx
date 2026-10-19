import type { Metadata } from "next";
import { profile } from "@/constants/profile";
import { CAPABILITIES_INTRO } from "@/constants/capability-catalogue";
import { CapabilitiesView } from "@/components/capabilities/CapabilitiesView";

export const metadata: Metadata = {
  title: "What I Build",
  description: CAPABILITIES_INTRO,
  alternates: { canonical: "/capabilities" },
  openGraph: {
    title: `What I Build: ${profile.name}`,
    description: CAPABILITIES_INTRO,
    url: `${profile.siteUrl}/capabilities`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `What I Build: ${profile.name}`,
    description: CAPABILITIES_INTRO,
  },
};

/** The shareable "What I Build" page: the kinds of software Joseph can take on. */
export default function CapabilitiesPage() {
  return <CapabilitiesView />;
}
