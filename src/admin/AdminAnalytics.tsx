import { useState, useEffect } from "react";
import { TrendingUp, Users, ScanFace, MessageSquare, Clock, Globe, Smartphone, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const AdminAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics()
      .then(setData)
      .catch((e) => console.error("Analytics error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const dailyStats = data?.dailyStats || [];
  const featureUsage = data?.featureUsage || [];
  const deviceBreakdown = data?.deviceBreakdown || [];
  const topLocations = data?.topLocations || [];
  const retentionData = data?.retentionData || [];
  const maxUsers = Math.max(...dailyStats.map((d: any) => d.users || 0), 1);

  const featureIcons: Record<string, any> = { "AI Chat": MessageSquare, "Face Scan": ScanFace, "Health Reports": TrendingUp, "Doctor Booking": Users };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Analytics</h1>
        <p className="text-sm text-muted-foreground font-body">Usage patterns, retention, and engagement insights</p>
      </div>

      {dailyStats.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Weekly Active Users</h2>
          <div className="flex items-end gap-2 h-32">
            {dailyStats.map((d: any) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-foreground">{d.users}</span>
                <div className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all" style={{ height: `${(d.users / maxUsers) * 100}%` }} />
                <span className="text-[10px] text-muted-foreground">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {featureUsage.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Feature Usage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featureUsage.map((f: any) => {
              const Icon = featureIcons[f.feature] || TrendingUp;
              return (
                <div key={f.feature} className="bg-accent/20 rounded-xl p-4 flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color || "bg-primary/10 text-primary"}`}><Icon size={18} /></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{f.feature}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground"><span>{f.sessions} sessions</span><span>•</span><span>Avg {f.avgDuration}</span></div>
                    <div className="flex items-center gap-1 mt-1"><span className="text-xs font-medium text-emerald-600">{f.satisfaction}</span><span className="text-[10px] text-muted-foreground">satisfaction</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deviceBreakdown.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><Smartphone size={16} className="text-muted-foreground" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Devices</h2></div>
            <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
              {deviceBreakdown.map((d: any) => (<div key={d.device} className={`${d.color || "bg-primary"} rounded-full`} style={{ width: `${d.pct}%` }} />))}
            </div>
            <div className="space-y-2">
              {deviceBreakdown.map((d: any) => (
                <div key={d.device} className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${d.color || "bg-primary"}`} /><span className="text-xs text-muted-foreground">{d.device}</span></div>
                  <span className="text-xs font-medium text-foreground">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {topLocations.length > 0 && (
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4"><Globe size={16} className="text-muted-foreground" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Top Locations</h2></div>
            <div className="space-y-2.5">
              {topLocations.map((l: any) => (
                <div key={l.city} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16">{l.city}</span>
                  <div className="flex-1 h-2 bg-accent/30 rounded-full overflow-hidden"><div className="h-full bg-primary/60 rounded-full" style={{ width: `${l.pct}%` }} /></div>
                  <span className="text-xs font-medium text-foreground w-10 text-right">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {retentionData.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><Clock size={16} className="text-muted-foreground" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Retention</h2></div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {retentionData.map((r: any) => (
              <div key={r.period} className="bg-accent/20 rounded-xl p-3 text-center">
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{r.rate}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{r.period}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!data && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No analytics data available yet</p>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
