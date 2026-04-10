import { useState, useEffect } from "react";
import { DollarSign, Users, CreditCard, Search, Filter } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const AdminBilling = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const [txStatus, setTxStatus] = useState("all");

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, revRes, txRes] = await Promise.allSettled([
          adminApi.getDashboard(),
          adminApi.getRevenue().catch(() => null),
          adminApi.getTransactions().catch(() => null),
        ]);
        if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
        if (revRes.status === "fulfilled" && revRes.value) setRevenue(revRes.value);
        if (txRes.status === "fulfilled" && txRes.value) {
          setTransactions(Array.isArray(txRes.value) ? txRes.value : txRes.value?.transactions ?? []);
        }
      } catch (e) {
        console.error("Billing error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const searchTransactions = async () => {
    try {
      const params: any = {};
      if (txSearch) params.search = txSearch;
      if (txStatus !== "all") params.status = txStatus;
      const res = await adminApi.getTransactions(params);
      setTransactions(Array.isArray(res) ? res : res?.transactions ?? []);
    } catch (e) {
      console.error("Transaction search error:", e);
    }
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(searchTransactions, 300);
      return () => clearTimeout(timer);
    }
  }, [txSearch, txStatus]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div><div className="h-7 w-40 bg-muted rounded" /><div className="h-4 w-56 bg-muted rounded mt-2" /></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl p-4 h-28" />)}</div>
          <div className="bg-card/80 border border-border/50 rounded-xl p-5 h-64" />
        </div>
      </div>
    );
  }

  const totalRevenue = revenue?.total_revenue ?? dashboard?.total_revenue ?? 0;
  const todayRevenue = revenue?.today_revenue ?? dashboard?.today_revenue ?? 0;
  const activeSubs = revenue?.active_subscriptions ?? dashboard?.active_subscriptions ?? 0;
  const totalUsers = dashboard?.total_users ?? 0;

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: "Today's Revenue", value: `$${todayRevenue.toLocaleString()}`, icon: CreditCard, color: "bg-amber-50 text-amber-600" },
    { label: "Active Subscriptions", value: activeSubs, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Total Users", value: totalUsers, icon: Users, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Billing & Revenue</h1>
        <p className="text-sm text-muted-foreground font-body">Financial overview and transaction history</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}><Icon size={18} /></div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transactions */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Transactions</h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <select
              value={txStatus}
              onChange={(e) => setTxStatus(e.target.value)}
              className="text-sm bg-background border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="pb-2 font-medium text-muted-foreground">User</th>
                  <th className="pb-2 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-2 font-medium text-muted-foreground">Plan</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx: any, i: number) => (
                  <tr key={tx.id || i} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5">{tx.user_name || tx.email || "—"}</td>
                    <td className="py-2.5 font-medium">${tx.amount?.toLocaleString() ?? 0}</td>
                    <td className="py-2.5">{tx.plan || tx.plan_id || "—"}</td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        tx.status === "pending" ? "bg-amber-50 text-amber-700" :
                        tx.status === "failed" ? "bg-red-50 text-red-700" :
                        tx.status === "refunded" ? "bg-blue-50 text-blue-700" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {tx.status || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;
