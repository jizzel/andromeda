"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FloatingBusinessCardButton } from "@/components/layout/FloatingBusinessCardButton";
import { FloatingContactButton } from "@/components/ui/FloatingContactButton";
import { IdentityAnchor } from "@/components/layout/IdentityAnchor";
import { HomeButton } from "@/components/layout/HomeButton";
import { BusinessCard } from "@/components/layout/BusinessCard";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Routes that should have minimal UI (no nav elements, no footer)
const MINIMAL_UI_ROUTES = ["/connect"];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const isMinimalUI = MINIMAL_UI_ROUTES.includes(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {mounted && !isMinimalUI && (
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
      {!isMinimalUI && <SiteFooter />}
    </>
  );
}
