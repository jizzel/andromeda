"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const router = useRouter();
  const signOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };
  return (
    <button
      type="button"
      onClick={signOut}
      className="inline-flex items-center gap-2 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );
}
