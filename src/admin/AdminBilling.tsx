import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, ArrowUpRight, Users, RefreshCw, Search, IndianRupee, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

const defaultSummary = [
  { label: "Monthly Revenue", value: "—", change: "—", icon: IndianRupee, color: "bg-emerald-50 text-emerald-600" },
  { label: "Active Subscriptions", value: "—", change: "—", icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Avg Revenue/User", value: "—", change: "—", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  { label: "Refunds (MTD)", value: "—", change: "—", icon: RefreshCw, color: "bg-amber-50 text-amber-600" },
];

const statusStyle: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-500",
  refunded: "bg-amber-50 text-amber-600",
};

const AdminBilling = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summaryCards, setSummaryCards] = useState(defaultSummary);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [revenue, txns] = await Promise.allSettled([
          adminApi.getRevenue(),
          adminApi.getTransactions({ search, status: statusFilter }),
        ]);
        if (revenue.status === "fulfilled") {
          const r = revenue.value;
          if (r.summary) setSummaryCards(prev => prev.map((s, i) => r.summary[i] ? { ...s, ...r.summary[i] } : s));
          if (r.revenueByPlan) setRevenueByPlan(r.revenueByPlan);
        }
        if (txns.status === "fulfilled") {
          setTransactions(Array.isArray(txns.value) ? txns.value : txns.value.transactions || []);
        }
      } catch (e) {
        toast.error("Failed to load billing data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [statusFilter]);

  const filtered = transactions.filter((t: any) => {
    const matchSearch = (t.user || "").toLowerCase().includes(search.toLowerCase()) || (t.id || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Billing & Revenue</h1>
        <p className="text-sm text-muted-foreground font-body">Financial overview and transaction management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}><Icon size={16} /></div>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5"><ArrowUpRight size={12} />{c.change}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-0.5">{c.label}</p>
              <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {revenueByPlan.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Revenue by Plan</h2>
          <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
            {revenueByPlan.map((r: any) => (
              <div key={r.plan} className={`${r.plan === "Pro" ? "bg-primary" : "bg-amber-500"} rounded-full`} style={{ width: `${r.pct}%` }} />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {revenueByPlan.map((r: any) => (
              <div key={r.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${r.plan === "Pro" ? "bg-primary" : "bg-amber-500"}`} />
                  <span className="text-sm text-foreground">{r.plan}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{r.amount}</p>
                  <p className="text-[10px] text-muted-foreground">{r.users} users • {r.pct}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Recent Transactions</h2>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs outline-none w-full sm:w-40" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1.5 rounded-lg border border-border/50 bg-background text-xs outline-none text-foreground">
              <option value="all">All</option><option value="success">Success</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions found</p>
        ) : (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Plan</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Method</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Date</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t: any) => (
                  <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="px-4 py-3"><p className="font-medium text-foreground">{t.user}</p><p className="text-xs text-muted-foreground">{t.email}</p></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.plan}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.method}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{t.amount}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}<br/><span className="text-[10px]">{t.time}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle[t.status] || "bg-muted text-muted-foreground"}`}>{t.status}</span></td>
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
