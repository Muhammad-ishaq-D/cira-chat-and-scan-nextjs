import { useState, useEffect } from "react";
import { Users, MessageSquare, ScanFace, CreditCard, TrendingUp, ArrowUpRight, Activity, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const AdminOverview = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.allSettled([
          adminApi.getDashboard(),
          adminApi.getAnalytics().catch(() => null),
        ]);
        const d = dashRes.status === "fulfilled" ? dashRes.value : {};
        const a = analyticsRes.status === "fulfilled" ? analyticsRes.value : {};
        setDashboard({ ...d, ...a });
      } catch (e) {
        console.error("Admin dashboard error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div><div className="h-4 w-24 bg-muted rounded mb-2" /><div className="h-7 w-48 bg-muted rounded" /></div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl p-4 h-28" />)}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Total Users", value: dashboard?.total_users ?? "—", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Active Consultations", value: dashboard?.active_consultations ?? "—", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total Scans", value: dashboard?.total_scans ?? dashboard?.scans_completed ?? "—", icon: ScanFace, color: "bg-purple-50 text-purple-600" },
    { label: "Active Subscriptions", value: dashboard?.active_subscriptions ?? "—", icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "Revenue", value: dashboard?.total_revenue != null ? `₹${dashboard.total_revenue.toLocaleString()}` : "—", icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground font-body mb-1">Super Admin</p>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Dashboard Overview 👋</h1>
        <p className="text-sm text-muted-foreground font-body">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={16} /></div>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-0.5">{s.label}</p>
              <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Quick Summary</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <span className="font-medium text-foreground">{dashboard?.total_users ?? 0}</span> registered users on the platform</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.total_scans ?? dashboard?.scans_completed ?? 0}</span> vitals scans completed</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.active_subscriptions ?? 0}</span> active subscriptions</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.active_consultations ?? 0}</span> active consultations</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
