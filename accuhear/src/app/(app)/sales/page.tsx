import { Button } from "@/components/ui/button";

const sales = [
  { date: "01/07/2026", id: "5403", item: "Extended warranty", type: "Payment", debit: "$99.00" },
  { date: "01/07/2026", id: "16899", item: "Extended warranty", type: "Sale", debit: "$99.00" },
  { date: "02/19/2024", id: "4657", item: "Cash", type: "Payment", debit: "$10.00" },
  { date: "10/24/2023", id: "4482", item: "Wax filters", type: "Payment", debit: "$18.00" },
];

export default function SalesPage() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="section-title text-xs text-brand-ink">Sales History</div>
            <div className="text-sm text-ink-muted">Read-only ledger view.</div>
          </div>
          <Button variant="secondary" size="sm">
            Export
          </Button>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-surface-2">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Txn ID</th>
                <th>Item</th>
                <th>Type</th>
                <th>Debit</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => (
                <tr key={row.id}>
                  <td>{row.date}</td>
                  <td>{row.id}</td>
                  <td>{row.item}</td>
                  <td>{row.type}</td>
                  <td>{row.debit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="glass-panel p-6">
        <div>
          <div className="section-title text-xs text-brand-ink">Balances</div>
          <div className="text-xs text-ink-muted">Computed from ledger.</div>
        </div>
        <div className="mt-4 space-y-3">
          <BalanceCard label="Patient balance" value="$0.00" />
          <BalanceCard label="Pending reimbursement" value="$0.00" />
          <BalanceCard label="No-show rate" value="0%" />
        </div>
      </aside>
    </div>
  );
}

function BalanceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4">
      <div className="text-xs text-ink-muted">{label}</div>
      <div className="mt-2 text-lg font-semibold text-ink-strong">{value}</div>
    </div>
  );
}
