"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="nav-logout-btn"
      aria-label="Sign out"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      <LogOut size={14} strokeWidth={1.9} />
      <span className="nav-logout-label">Sign out</span>
    </button>
  );
}
