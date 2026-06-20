import { useState, useEffect } from "react";
import i18n from "@/i18n";
import { DollarSign, Users, CreditCard, Search, Tag } from "lucide-react";
import { adminApi, type UnifiedPayment } from "@/lib/apiClient";

const STATUS_COLORS: Record<string, string> = {
  paid:     "bg-emerald-50 text-emerald-700",
  success:  "bg-emerald-50 text-emerald-700",
  pending:  "bg-amber-50 text-amber-700",
  failed:   "bg-red-50 text-red-700",
  refunded: "bg-blue-50 text-blue-700",
};
const TYPE_COLORS: Record<string, string> = {
  "Subscription":       "bg-purple-50 text-purple-700",
  "Prescription Refill":"bg-emerald-50 text-emerald-700",
  "Referral Letter":    "bg-violet-50 text-violet-700",
};

const AdminBilling = () => {
  const t = i18n.getFixedT("en");
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [payments, setPayments] = useState<UnifiedPayment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [txSearch, setTxSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const loadPayments = async (search?: string) => {
    try {
      const res = await adminApi.getAllPayments({
        search: search || undefined,
        status: "paid",
      });
      const list = Array.isArray(res) ? res : res?.payments ?? [];
      setPayments(list);
      setTotal(res?.total ?? list.length);
    } catch {
      setPayments([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, revRes] = await Promise.allSettled([
          adminApi.getDashboard(),
          adminApi.getRevenue().catch(() => null),
        ]);
        if (dashRes.status === "fulfilled") setDashboard(dashRes.value);
        if (revRes.status === "fulfilled" && revRes.value) setRevenue(revRes.value);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
    loadPayments();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadPayments(txSearch), 300);
    return () => clearTimeout(timer);
  }, [txSearch]);

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
  const activeSubs   = revenue?.active_subscriptions ?? dashboard?.active_subscriptions ?? 0;
  const totalUsers   = dashboard?.total_users ?? 0;

  const rxRevenue  = payments.filter(p => p.type === "Prescription Refill").reduce((s, p) => s + p.amount, 0);
  const refRevenue = payments.filter(p => p.type === "Referral Letter").reduce((s, p) => s + p.amount, 0);

  const filteredPayments = typeFilter === "all" ? payments : payments.filter(p => p.type === typeFilter);

  const stats = [
    { label: t("admin.billing.totalRevenue"),  value: `$${Number(totalRevenue).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-50 text-emerald-600" },
    { label: t("admin.billing.todayRevenue"),   value: `$${Number(todayRevenue).toLocaleString()}`, icon: CreditCard, color: "bg-amber-50 text-amber-600" },
    { label: "Prescription Revenue",            value: `€${rxRevenue.toFixed(2)}`,                  icon: CreditCard, color: "bg-teal-50 text-teal-600" },
    { label: "Referral Revenue",                value: `€${refRevenue.toFixed(2)}`,                  icon: DollarSign, color: "bg-violet-50 text-violet-600" },
    { label: t("admin.billing.activeSubs"),     value: activeSubs,                                   icon: Users,      color: "bg-blue-50 text-blue-600" },
    { label: t("admin.billing.totalUsers"),     value: totalUsers,                                   icon: Users,      color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.billing.title")}</h1>
        <p className="text-sm text-muted-foreground font-body">{t("admin.billing.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Paid Payments
            </h2>
            <p className="text-xs text-muted-foreground">Subscriptions · Prescription Refills · Referral Letters</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="py-1.5 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30 text-muted-foreground"
            >
              <option value="all">All Types</option>
              <option value="Subscription">Subscription</option>
              <option value="Prescription Refill">Prescription Refill</option>
              <option value="Referral Letter">Referral Letter</option>
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("admin.billing.search")}
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="w-full sm:w-48 pl-8 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("admin.billing.none")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left">
                  <th className="pb-2 font-medium text-muted-foreground">Type</th>
                  <th className="pb-2 font-medium text-muted-foreground">User / Ref</th>
                  <th className="pb-2 font-medium text-muted-foreground">Description</th>
                  <th className="pb-2 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-2 font-medium text-muted-foreground">Status</th>
                  <th className="pb-2 font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border/30 last:border-0">
                    <td className="py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_COLORS[p.type] ?? "bg-muted text-muted-foreground"}`}>
                        <Tag size={9} />
                        {p.type}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <div className="text-sm">{p.user_name || "—"}</div>
                      {p.reference_code && (
                        <div className="font-mono text-[10px] text-muted-foreground">{p.reference_code}</div>
                      )}
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">{p.description || "—"}</td>
                    <td className="py-2.5 font-medium">
                      {p.type === "Subscription" ? "$" : "€"}{p.amount?.toFixed(2) ?? "0.00"}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground"}`}>
                        {p.status || "—"}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("en") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > payments.length && (
          <p className="text-xs text-muted-foreground text-center pt-3">
            Showing {payments.length} of {total} records
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminBilling;
