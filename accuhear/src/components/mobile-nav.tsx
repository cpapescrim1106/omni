import Link from "next/link";

const navItems = [
  { label: "Patients", href: "/patients" },
  { label: "Schedule", href: "/scheduling" },
  { label: "Marketing", href: "/marketing" },
  { label: "Recalls", href: "/recalls" },
  { label: "Messages", href: "/messages" },
  { label: "Journal", href: "/journal" },
  { label: "Sales", href: "/sales" },
  { label: "Docs", href: "/documents" },
];

export function MobileNav() {
  return (
    <div className="flex gap-2 overflow-x-auto rounded-2xl bg-white/70 p-3 shadow-[0_10px_24px_rgba(24,20,50,0.08)] lg:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="whitespace-nowrap rounded-full bg-surface-1 px-4 py-2 text-xs font-semibold text-ink"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
