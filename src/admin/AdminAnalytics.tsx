import { useState, useEffect } from "react";
import { TrendingUp, Users, ScanFace, Loader2 } from "lucide-react";
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
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div><div className="h-7 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded mt-2" /></div>
          <div className="grid grid-cols-2 gap-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl p-5 h-32" />)}</div>
        </div>
      </div>
    );
  }

  // Extract trend totals from arrays if available
  const signupCount = Array.isArray(data?.signups_trend)
    ? data.signups_trend.reduce((sum: number, d: any) => sum + (d.count || 0), 0)
    : data?.new_signups ?? "—";
  const scanCount = Array.isArray(data?.scans_trend)
    ? data.scans_trend.reduce((sum: number, d: any) => sum + (d.count || 0), 0)
    : data?.scans_completed ?? "—";

  const stats = [
    { label: "New Signups", value: signupCount, icon: Users, color: "bg-blue-50 text-blue-600", description: "Total registered users" },
    { label: "Scans Completed", value: scanCount, icon: ScanFace, color: "bg-purple-50 text-purple-600", description: "Total vitals scans performed" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Analytics</h1>
        <p className="text-sm text-muted-foreground font-body">Platform usage and engagement insights</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><Icon size={20} /></div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-body">{s.label}</p>
                  <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{s.description}</p>
            </div>
          );
        })}
      </div>

      {!data && (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No analytics data available yet</p>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
