import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { PatientTabsBar, PatientTabsProvider } from "@/components/patient-tabs";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen px-4 py-4">
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_260px]">
        <div className="sticky top-4 hidden h-[calc(100vh-32px)] lg:block">
          <Sidebar />
        </div>
        <PatientTabsProvider>
          <div className="flex min-w-0 flex-col gap-3">
            <MobileNav />
            <main className="flex min-h-[calc(100vh-40px)] flex-1 flex-col gap-4">
              <div className="xl:hidden">
                <PatientTabsBar />
              </div>
              {children}
            </main>
          </div>
          <aside className="hidden xl:block">
            <PatientTabsBar variant="rail" />
          </aside>
        </PatientTabsProvider>
      </div>
    </div>
  );
}
