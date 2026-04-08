const transactions = [
  { id: "TXN-001", user: "Priya Sharma", plan: "Pro", amount: "₹499", date: "2025-04-07", status: "success" },
  { id: "TXN-002", user: "Arjun Reddy", plan: "Pro", amount: "₹499", date: "2025-04-06", status: "success" },
  { id: "TXN-003", user: "Anita Das", plan: "Enterprise", amount: "₹1,999", date: "2025-04-05", status: "success" },
  { id: "TXN-004", user: "Vikram Singh", plan: "Pro", amount: "₹499", date: "2025-04-04", status: "failed" },
  { id: "TXN-005", user: "Meera Patel", plan: "Pro", amount: "₹499", date: "2025-04-03", status: "refunded" },
  { id: "TXN-006", user: "Rahul Verma", plan: "Pro", amount: "₹499", date: "2025-04-02", status: "success" },
];

const summaryCards = [
  { label: "Monthly Revenue", value: "₹48,200" },
  { label: "Active Subscriptions", value: "186" },
  { label: "Avg Revenue/User", value: "₹259" },
  { label: "Churn Rate", value: "3.2%" },
];

const statusStyle: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-500",
  refunded: "bg-amber-50 text-amber-600",
};

const AdminBilling = () => (
  <div className="p-6 space-y-6">
    <h1 className="font-heading text-2xl font-semibold text-foreground">Billing & Revenue</h1>

    {/* Summary */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((c) => (
        <div key={c.label} className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
          <p className="text-xl font-bold text-foreground">{c.value}</p>
        </div>
      ))}
    </div>

    {/* Transactions */}
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="font-heading text-base font-semibold text-foreground">Recent Transactions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transaction ID</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                <td className="px-4 py-3 font-medium text-foreground">{t.user}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.plan}</td>
                <td className="px-4 py-3 text-right font-medium text-foreground">{t.amount}</td>
                <td className="px-4 py-3 text-muted-foreground">{t.date}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle[t.status] || ""}`}>{t.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default AdminBilling;
