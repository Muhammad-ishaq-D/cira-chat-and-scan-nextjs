import { useState } from "react";
import { CreditCard, TrendingUp, ArrowUpRight, Users, RefreshCw, Download, Search, Filter, IndianRupee } from "lucide-react";

const summaryCards = [
  { label: "Monthly Revenue", value: "₹4,82,000", change: "+15%", icon: IndianRupee, color: "bg-emerald-50 text-emerald-600" },
  { label: "Active Subscriptions", value: "406", change: "+8%", icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Avg Revenue/User", value: "₹386", change: "+5%", icon: TrendingUp, color: "bg-purple-50 text-purple-600" },
  { label: "Refunds (MTD)", value: "₹4,990", change: "3 total", icon: RefreshCw, color: "bg-amber-50 text-amber-600" },
];

const transactions = [
  { id: "TXN-4821", user: "Priya Sharma", email: "priya@example.com", plan: "Pro → Enterprise", amount: "₹1,999", date: "2025-04-08", time: "10:24 AM", method: "UPI", status: "success" },
  { id: "TXN-4820", user: "Arjun Reddy", email: "arjun@example.com", plan: "Pro Renewal", amount: "₹499", date: "2025-04-07", time: "3:18 PM", method: "Card", status: "success" },
  { id: "TXN-4819", user: "Anita Das", email: "anita@example.com", plan: "Enterprise Renewal", amount: "₹1,999", date: "2025-04-07", time: "11:02 AM", method: "Net Banking", status: "success" },
  { id: "TXN-4818", user: "Vikram Singh", email: "vikram@example.com", plan: "Pro Renewal", amount: "₹499", date: "2025-04-06", time: "9:45 AM", method: "UPI", status: "failed" },
  { id: "TXN-4817", user: "Meera Patel", email: "meera@example.com", plan: "Free → Pro", amount: "₹499", date: "2025-04-06", time: "7:30 PM", method: "Card", status: "success" },
  { id: "TXN-4816", user: "Kavya Nair", email: "kavya@example.com", plan: "Pro", amount: "₹499", date: "2025-04-05", time: "2:15 PM", method: "UPI", status: "refunded" },
  { id: "TXN-4815", user: "Sanjay Gupta", email: "sanjay@example.com", plan: "Pro Renewal", amount: "₹499", date: "2025-04-05", time: "10:00 AM", method: "Card", status: "success" },
  { id: "TXN-4814", user: "Rahul Verma", email: "rahul@example.com", plan: "Free → Pro", amount: "₹499", date: "2025-04-04", time: "4:45 PM", method: "UPI", status: "success" },
];

const revenueByPlan = [
  { plan: "Pro", amount: "₹3,18,000", users: 318, pct: 66 },
  { plan: "Enterprise", amount: "₹1,64,000", users: 82, pct: 34 },
];

const statusStyle: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-600",
  failed: "bg-red-50 text-red-500",
  refunded: "bg-amber-50 text-amber-600",
};

const AdminBilling = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = transactions.filter((t) => {
    const matchSearch = t.user.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Billing & Revenue</h1>
        <p className="text-sm text-muted-foreground font-body">Financial overview and transaction management</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}>
                  <Icon size={16} />
                </div>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                  <ArrowUpRight size={12} />{c.change}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-0.5">{c.label}</p>
              <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue by Plan */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Revenue by Plan</h2>
        <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
          <div className="bg-primary rounded-full" style={{ width: "66%" }} />
          <div className="bg-amber-500 rounded-full" style={{ width: "34%" }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {revenueByPlan.map((r) => (
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

      {/* Transactions */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Recent Transactions</h2>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-border/50 bg-background text-xs outline-none w-full sm:w-40"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-border/50 bg-background text-xs outline-none text-foreground"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden p-4 space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="bg-accent/20 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">{t.user}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle[t.status]}`}>{t.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t.plan}</span>
                <span className="font-semibold text-foreground">{t.amount}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>{t.id} • {t.method}</span>
                <span>{t.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
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
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{t.user}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.plan}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.method}</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{t.amount}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}<br/><span className="text-[10px]">{t.time}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusStyle[t.status]}`}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminBilling;
