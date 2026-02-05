import Link from "next/link";

const navItems = [
  { label: "Patients", href: "/patients" },
  { label: "Scheduling", href: "/scheduling" },
  { label: "Marketing", href: "/marketing" },
  { label: "Recalls", href: "/recalls" },
  { label: "Journal", href: "/journal" },
  { label: "Sales", href: "/sales" },
  { label: "Documents", href: "/documents" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar() {
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
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-surface-1"
          >
            <span>{item.label}</span>
            <span className="text-xs text-ink-soft opacity-0 transition group-hover:opacity-100">
              →
            </span>
          </Link>
        ))}
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
