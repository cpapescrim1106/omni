import { redirect } from "next/navigation";
import { SetupAdminForm } from "@/components/auth/setup-admin-form";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const [userCount, currentUser] = await Promise.all([prisma.user.count(), getCurrentUser()]);

  if (userCount > 0) {
    if (currentUser) {
      redirect("/patients");
    }
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-surface-0 px-4 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[18px] border border-[rgba(38,34,96,0.08)] bg-[rgba(255,255,255,0.82)] shadow-[0_1px_3px_rgba(38,34,96,0.06),0_0_0_1px_rgba(38,34,96,0.04)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="bg-surface-1 px-8 py-10">
            <div className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-ink-soft">
              First-time setup
            </div>
            <h1 className="mt-4 font-display text-[28px] font-bold leading-tight text-ink-strong">
              Create the first administrator account.
            </h1>
            <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-muted">
              This is the only public setup step. After the first administrator is created, the app switches to
              authenticated access and future users are added from Settings.
            </p>
          </div>
          <div className="px-6 py-8 sm:px-8">
            <div className="text-[10px] font-display font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Administrator bootstrap
            </div>
            <h2 className="mt-3 font-display text-[24px] font-bold text-ink-strong">Secure the workspace</h2>
            <p className="mt-2 text-[13px] text-ink-muted">Use a strong password. Additional employees can be created later.</p>
            <div className="mt-6">
              <SetupAdminForm />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
