const entries = [
  { date: "01/17/2026", type: "Consult", user: "Pape, Chris", text: "Adjusted HA, reviewed warranty." },
  { date: "01/07/2026", type: "Payment", user: "Rodeo, Amy", text: "$99.00 received." },
  { date: "12/19/2025", type: "Note", user: "Pape, Chris", text: "Patient doing well." },
  { date: "12/02/2025", type: "Marketing contact", user: "Alaimo, Nicole", text: "Click2Mail response." },
];

export default function JournalPage() {
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="section-title text-xs text-brand-ink">Journal</div>
          <div className="text-sm text-ink-muted">Filter by user or entry type.</div>
        </div>
        <div className="flex gap-2">
          <span className="tab-pill" data-active="true">All</span>
          <span className="tab-pill">Notes</span>
          <span className="tab-pill">Payments</span>
          <span className="tab-pill">Appointments</span>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>User</th>
              <th>Text</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={`${entry.date}-${entry.type}`}>
                <td>{entry.date}</td>
                <td>{entry.type}</td>
                <td>{entry.user}</td>
                <td>{entry.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
