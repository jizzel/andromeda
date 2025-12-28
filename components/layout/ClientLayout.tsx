"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FloatingBusinessCardButton } from "@/components/layout/FloatingBusinessCardButton";
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
          <ThemeToggle />
          <FloatingBusinessCardButton />
        </>
      )}
      {children}
    </>
  );
}
