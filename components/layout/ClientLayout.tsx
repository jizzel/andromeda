"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FloatingBusinessCardButton } from "@/components/layout/FloatingBusinessCardButton";
import { FloatingContactButton } from "@/components/ui/FloatingContactButton";
import { IdentityAnchor } from "@/components/layout/IdentityAnchor";
import { HomeButton } from "@/components/layout/HomeButton";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useEffect, useState } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && (
        <>
          <IdentityAnchor />
          <HomeButton />
          <ThemeToggle />
          <FloatingBusinessCardButton />
          <FloatingContactButton />
          <BusinessCard />
        </>
      )}
      {children}
      <SiteFooter />
    </>
  );
}
