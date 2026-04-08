import { useState, useEffect } from "react";
import { Users, MessageSquare, ScanFace, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Globe, Clock, Eye, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const defaultStats = [
  { label: "Total Users", value: "—", change: "—", up: true, icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Active Today", value: "—", change: "—", up: true, icon: Activity, color: "bg-emerald-50 text-emerald-600" },
  { label: "Total Scans", value: "—", change: "—", up: true, icon: ScanFace, color: "bg-purple-50 text-purple-600" },
  { label: "Chat Messages", value: "—", change: "—", up: true, icon: MessageSquare, color: "bg-primary/10 text-primary" },
  { label: "Revenue (MTD)", value: "—", change: "—", up: true, icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  { label: "Churn Rate", value: "—", change: "—", up: false, icon: TrendingUp, color: "bg-red-50 text-red-500" },
];

const activityColor: Record<string, string> = {
  upgrade: "bg-emerald-50 text-emerald-600",
  scan: "bg-purple-50 text-purple-600",
  signup: "bg-blue-50 text-blue-600",
  chat: "bg-primary/10 text-primary",
  payment: "bg-amber-50 text-amber-600",
  report: "bg-cyan-50 text-cyan-600",
  alert: "bg-red-50 text-red-500",
  downgrade: "bg-muted text-muted-foreground",
};

const AdminOverview = () => {
  const [stats, setStats] = useState(defaultStats);
  const [systemHealth, setSystemHealth] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [planDistribution, setPlanDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, health, activity] = await Promise.allSettled([
          adminApi.getDashboard(),
          adminApi.getSystemHealth(),
          adminApi.getRecentActivity(),
        ]);
        if (dashboard.status === "fulfilled") {
          const d = dashboard.value;
          if (d.stats) setStats(prev => prev.map((s, i) => d.stats[i] ? { ...s, ...d.stats[i] } : s));
          if (d.topPages) setTopPages(d.topPages);
          if (d.planDistribution) setPlanDistribution(d.planDistribution);
        }
        if (health.status === "fulfilled") setSystemHealth(Array.isArray(health.value) ? health.value : health.value.items || []);
        if (activity.status === "fulfilled") setRecentActivity(Array.isArray(activity.value) ? activity.value : activity.value.items || []);
      } catch (e) {
        console.error("Admin dashboard error:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground font-body mb-1">Super Admin</p>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Dashboard Overview 👋</h1>
        <p className="text-sm text-muted-foreground font-body">{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} • Real-time data</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}><Icon size={16} /></div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                  {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{s.change}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground font-body mb-0.5">{s.label}</p>
              <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Activity + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Live Activity</h2>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live</span>
          </div>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-1">
              {recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${activityColor[a.type] || "bg-muted text-muted-foreground"}`}>
                    {a.avatar || (a.user || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate"><span className="font-medium">{a.user}</span></p>
                    <p className="text-xs text-muted-foreground truncate">{a.action}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>System Health</h2>
            {systemHealth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data available</p>
            ) : (
              <div className="space-y-3">
                {systemHealth.map((s: any) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{s.value}</span>
                      <span className={`w-2 h-2 rounded-full ${s.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {planDistribution.length > 0 && (
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
              <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Plan Distribution</h2>
              <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
                {planDistribution.map((p: any) => (
                  <div key={p.plan} className={`${p.color || "bg-primary"} rounded-full`} style={{ width: `${p.pct}%` }} />
                ))}
              </div>
              <div className="space-y-2">
                {planDistribution.map((p: any) => (
                  <div key={p.plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color || "bg-primary"}`} />
                      <span className="text-xs text-muted-foreground">{p.plan}</span>
                    </div>
                    <span className="text-xs font-medium text-foreground">{p.count} ({p.pct}%)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Pages */}
      {topPages.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={16} className="text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Top Pages</h2>
          </div>
          <div className="space-y-2">
            {topPages.map((p: any, i: number) => (
              <div key={p.page} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
                <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                <span className="text-sm font-mono text-foreground flex-1">{p.page}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye size={12} /> {p.views}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {p.sessions}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOverview;
