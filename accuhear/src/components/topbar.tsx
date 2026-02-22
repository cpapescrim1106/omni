"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const quickLinks = [
  { label: "New Patient", href: "/patients/new" },
  { label: "New Appointment", href: "/scheduling?new=1" },
  { label: "Start Recall", href: "/recalls" },
];

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  function handleNewAppointment() {
    const opener = (window as unknown as { __openAppointmentModal?: () => void }).__openAppointmentModal;
    if (typeof opener === "function") {
      opener();
      return;
    }
    if (pathname !== "/scheduling") {
      router.push("/scheduling?new=1");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[22px] bg-white/70 px-6 py-4 shadow-[0_18px_32px_rgba(24,20,50,0.08)]">
      <div>
        <div className="kicker">AccuHear CRM</div>
        <div className="text-lg font-semibold text-ink-strong">Clinical overview</div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {quickLinks.map((link) =>
          link.label === "New Appointment" ? (
            <Link
              key={link.label}
              href={link.href}
              data-testid="new-appointment"
              onClick={(event) => {
                if (pathname === "/scheduling") {
                  const opener = (window as unknown as { __openAppointmentModal?: () => void }).__openAppointmentModal;
                  if (typeof opener === "function") {
                    event.preventDefault();
                    opener();
                  }
                }
              }}
              className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-blue/40"
            >
              {link.label}
            </Link>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink transition hover:border-brand-blue/40"
            >
              {link.label}
            </Link>
          )
        )}
        <div className="flex items-center gap-3 rounded-full bg-surface-2 px-3 py-2 text-xs text-ink-muted">
          <span className="h-2 w-2 rounded-full bg-success"></span>
          Sat, Jan 31
        </div>
      </div>
    </div>
  );
}
