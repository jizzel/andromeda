import { profile } from "@/constants/profile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `Connect | ${profile.surname}`,
  description: `Get in touch with ${profile.name} - ${profile.title}`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--andromeda-primary)]">
      {children}
    </div>
  );
}
