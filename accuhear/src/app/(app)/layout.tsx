import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { PatientTabsBar, PatientTabsProvider } from "@/components/patient-tabs";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <PatientTabsProvider>
        <GlobalShortcuts />
        <div className="main-col">
          <div className="lg:hidden px-3 pt-3">
            <MobileNav />
          </div>
          <main className="main-content">
            <div className="xl:hidden mb-3">
              <PatientTabsBar />
            </div>
            {children}
          </main>
        </div>
        <div className="hidden xl:contents">
          <PatientTabsBar variant="rail" />
        </div>
      </PatientTabsProvider>
    </div>
  );
}
