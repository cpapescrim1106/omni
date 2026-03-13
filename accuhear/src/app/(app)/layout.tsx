import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { GlobalShortcuts } from "@/components/global-shortcuts";
import { PatientTabsBar, PatientTabsProvider } from "@/components/patient-tabs";
import { requirePageUser, requireSetupRedirect } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireSetupRedirect();
  const currentUser = await requirePageUser();

  return (
    <div className="shell">
      <Sidebar currentUser={currentUser} />
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
