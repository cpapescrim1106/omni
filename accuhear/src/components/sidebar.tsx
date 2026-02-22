"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type InboxSummary = {
  needsAttentionCount: number;
};

const POLL_MS = 5_000;

type NavItem = {
  label: string;
  href: string;
  showsBadge?: boolean;
};

const navItems: readonly NavItem[] = [
  { label: "Patients", href: "/patients" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Marketing", href: "/marketing" },
  { label: "Recalls", href: "/recalls" },
  { label: "Messages", href: "/messages", showsBadge: true },
  { label: "Journal", href: "/journal" },
  { label: "Sales", href: "/sales" },
  { label: "Documents", href: "/documents" },
  { label: "Settings", href: "/settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
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
    <aside className="flex h-full flex-col gap-6 rounded-[28px] bg-white/80 p-6 shadow-[0_22px_40px_rgba(24,20,50,0.12)]">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top,#1F95B8_0%,#262260_70%)] text-white shadow-[0_10px_24px_rgba(31,149,184,0.25)]">
          <span className="text-lg font-semibold">A</span>
        </div>
        <div>
          <div className="section-title text-sm text-brand-ink">AccuHear</div>
          <div className="text-xs text-ink-soft">CRM Workspace</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition hover:bg-surface-1 ${
                active ? "bg-surface-1 text-ink-strong" : "text-ink"
              }`}
            >
              <span>{item.label}</span>
              <span className="flex items-center gap-2">
                {item.showsBadge && badge ? (
                  <span className="inline-flex min-w-[22px] justify-center rounded-full bg-brand-orange/20 px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                    {badge}
                  </span>
                ) : null}
                <span className={`text-xs text-ink-soft transition ${active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                  →
                </span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl bg-surface-1 p-4 text-xs text-ink-muted">
        <div className="font-semibold text-ink">Active location</div>
        <div>Spring Hill (SHD)</div>
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success"></span>
          System healthy
        </div>
      </div>
    </aside>
  );
}
