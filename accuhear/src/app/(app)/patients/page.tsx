import { PatientSearch } from "@/components/patient-search";

const pinBoard = [
  {
    name: "Solomon, Neil",
    note: "Hearing exam today 10am",
    status: "Needs action",
  },
  {
    name: "Buschel Sr, John",
    note: "Clean & check 1:30pm",
    status: "Needs action",
  },
  {
    name: "Howe, Claire",
    note: "Consult 3pm",
    status: "Today",
  },
];

export default function PatientsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
      <aside className="glass-panel flex flex-col gap-4 p-5">
        <div>
          <div className="section-title text-xs text-brand-ink">Pinned</div>
          <div className="text-xs text-ink-muted">Quick access to active patients.</div>
        </div>
        <div className="flex flex-col gap-3">
          {pinBoard.map((item) => (
            <div key={item.name} className="rounded-2xl bg-white/80 p-4 shadow-[0_10px_20px_rgba(24,20,50,0.08)]">
              <div className="text-sm font-semibold text-ink-strong">{item.name}</div>
              <div className="text-xs text-ink-muted">{item.note}</div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-brand-ink">
                {item.status}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-dashed border-surface-3 p-4 text-xs text-ink-muted">
          Drag patients here to pin for quick recall, or keep your schedule view open.
        </div>
      </aside>
      <div className="flex flex-col gap-6">
        <PatientSearch />
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="section-title text-xs text-brand-ink">Recent Activity</div>
              <div className="text-sm text-ink-muted">Latest updates across patient records.</div>
            </div>
            <button className="rounded-full border border-transparent bg-brand-orange/10 px-4 py-2 text-xs font-semibold text-brand-ink">
              View all
            </button>
          </div>
          <div className="mt-4 grid gap-3">
            {[
              "Journal note added for Irene Angers",
              "Recall created for Joseph Pisano",
              "Appointment rescheduled for Sharon Trumble",
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink-muted">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
