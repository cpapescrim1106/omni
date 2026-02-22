const documents = [
  { title: "HIPAA Consent", category: "Other", date: "01/07/2026", addedBy: "Rodeo, Amy" },
  { title: "Insurance Card", category: "Insurance", date: "01/07/2026", addedBy: "Rodeo, Amy" },
  { title: "Driver&apos;s License", category: "Drivers license", date: "01/07/2026", addedBy: "Rodeo, Amy" },
  { title: "Purchase Agreement", category: "Purchase", date: "12/16/2024", addedBy: "Newcomb, Kristen" },
];

export default function DocumentsPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <aside className="glass-panel p-6">
        <div className="section-title text-xs text-brand-ink">Categories</div>
        <div className="mt-4 space-y-2 text-xs text-ink-muted">
          <div className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
            <span>All</span>
            <span className="badge">12</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2">
            <span>Driver&apos;s license</span>
            <span className="badge">3</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2">
            <span>Insurance</span>
            <span className="badge">4</span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-white/60 px-3 py-2">
            <span>Purchase</span>
            <span className="badge">1</span>
          </div>
        </div>
      </aside>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-title text-xs text-brand-ink">Documents</div>
            <div className="text-sm text-ink-muted">Preview inline or open full record.</div>
          </div>
          <button className="rounded-full border border-transparent bg-brand-blue/10 px-4 py-2 text-xs font-semibold text-brand-ink">
            Upload
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          {documents.map((doc) => (
            <div key={doc.title} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white/80 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-ink-strong">{doc.title}</div>
                <div className="text-xs text-ink-muted">{doc.category} · {doc.date}</div>
              </div>
              <div className="text-xs text-ink-soft">Added by {doc.addedBy}</div>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-surface-3 bg-white/60 p-4 text-sm text-ink-muted">
            Large preview: select a document to display the PDF image inline.
          </div>
        </div>
      </section>
    </div>
  );
}
