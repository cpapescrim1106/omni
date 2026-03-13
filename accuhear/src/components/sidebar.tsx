"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";

type InboxSummary = {
  needsAttentionCount: number;
};

const POLL_MS = 5_000;

type NavItem = {
  label: string;
  href: string;
  showsBadge?: boolean;
  icon: React.ReactNode;
};

const navItems: readonly NavItem[] = [
  {
    label: "Patients",
    href: "/patients",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 15v-1.5a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3V15"/>
        <circle cx="8.5" cy="5.5" r="2.5"/>
        <path d="M15 8.5a2 2 0 0 0-1.5-1.94"/>
        <path d="M13.5 3.56a2 2 0 0 1 0 3.88"/>
      </svg>
    ),
  },
  {
    label: "Scheduling",
    href: "/scheduling",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="12" height="12" rx="2"/>
        <path d="M3 8h12M7 2v4M11 2v4"/>
      </svg>
    ),
  },
  {
    label: "Orders",
    href: "/orders",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h10l-1 8H5L4 4z"/>
        <path d="M4 4L3 2"/>
        <circle cx="7" cy="15" r="1"/>
        <circle cx="12" cy="15" r="1"/>
      </svg>
    ),
  },
  {
    label: "Marketing",
    href: "/marketing",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l6-6 6 6"/>
        <path d="M5 7v7a1 1 0 001 1h6a1 1 0 001-1V7"/>
      </svg>
    ),
  },
  {
    label: "Recalls",
    href: "/recalls",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9a6 6 0 0112 0"/>
        <path d="M3 9l2-2m-2 2l2 2"/>
        <path d="M9 5v4l2 2"/>
      </svg>
    ),
  },
  {
    label: "Messages",
    href: "/messages",
    showsBadge: true,
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 5h10a1 1 0 011 1v6a1 1 0 01-1 1H6l-3 3V6a1 1 0 011-1z"/>
      </svg>
    ),
  },
  {
    label: "Journal",
    href: "/journal",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h9a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path d="M7 7h4M7 10h2"/>
      </svg>
    ),
  },
  {
    label: "Sales",
    href: "/sales",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 2v14"/>
        <path d="M5 6c0-1.1 1.8-2 4-2s4 .9 4 2"/>
        <path d="M5 12c0 1.1 1.8 2 4 2s4-.9 4-2"/>
      </svg>
    ),
  },
  {
    label: "Documents",
    href: "/documents",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 3h6l4 4v8a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z"/>
        <path d="M11 3v4h4"/>
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ currentUser }: { currentUser: AuthenticatedUser }) {
  const pathname = usePathname();
  const [inboxSummary, setInboxSummary] = useState<InboxSummary>({ needsAttentionCount: 0 });

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/messages/inbox", { cache: "no-store" });
        if (!res.ok) return;
        const payload = (await res.json()) as Partial<InboxSummary>;
        if (!active) return;
        setInboxSummary({ needsAttentionCount: Number(payload.needsAttentionCount ?? 0) });
      } catch {
        // ignore
      }
    };

    void load();
    const interval = window.setInterval(() => void load(), POLL_MS);
    const onVis = () => void load();
    document.addEventListener("visibilitychange", onVis);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const badge = useMemo(() => {
    const count = inboxSummary.needsAttentionCount;
    if (!Number.isFinite(count) || count <= 0) return null;
    return count > 99 ? "99+" : String(count);
  }, [inboxSummary.needsAttentionCount]);

  return (
    <nav className="left-nav" aria-label="Main navigation">
      <div className="nav-logo">O</div>
      <div className="nav-items">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item${active ? " active" : ""}`}
              data-tip={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.showsBadge && badge ? (
                <span className="nav-badge">{badge}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
      <div className="nav-bottom">
        <div className="nav-bottom-status">
          <span className="nav-bottom-dot" />
        </div>
        <div className="nav-bottom-meta">
          <div className="nav-bottom-email">{currentUser.email}</div>
          <div className="nav-bottom-role">
            {currentUser.role === "ADMINISTRATOR" ? "Administrator" : "Employee"}
          </div>
        </div>
        <div className="nav-bottom-action">
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
