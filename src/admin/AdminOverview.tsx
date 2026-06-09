import { useState, useEffect } from "react";
import i18n from "@/i18n";
import { Users, ScanFace, CreditCard, TrendingUp, Activity, FileText, DollarSign } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const AdminOverview = () => {
  const t = i18n.getFixedT("en");
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
    { label: t("admin.overview.totalUsers"), value: dashboard?.total_users ?? "—", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: t("admin.overview.activeConsultations"), value: dashboard?.active_consultations ?? "—", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
    { label: t("admin.overview.totalScans"), value: dashboard?.total_scans ?? dashboard?.scans_completed ?? "—", icon: ScanFace, color: "bg-purple-50 text-purple-600" },
    { label: t("admin.overview.activeSubs"), value: dashboard?.active_subscriptions ?? "—", icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: t("admin.overview.totalRevenue"), value: dashboard?.total_revenue != null ? `$${Number(dashboard.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—", icon: CreditCard, color: "bg-amber-50 text-amber-600" },
    { label: t("admin.overview.todayRevenue"), value: dashboard?.today_revenue != null ? `$${Number(dashboard.today_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—", icon: DollarSign, color: "bg-green-50 text-green-600" },
    { label: t("admin.overview.totalReports"), value: dashboard?.total_reports ?? "—", icon: FileText, color: "bg-indigo-50 text-indigo-600" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <p className="text-sm text-muted-foreground font-body mb-1">{t("admin.overview.superAdmin")}</p>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.overview.title")}</h1>
        <p className="text-sm text-muted-foreground font-body">{new Date().toLocaleDateString("en", { month: "long", day: "numeric", year: "numeric" })}</p>
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
        <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.overview.quickSummary")}</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>• <span className="font-medium text-foreground">{dashboard?.total_users ?? 0}</span> {t("admin.overview.sumUsers")}</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.total_scans ?? dashboard?.scans_completed ?? 0}</span> {t("admin.overview.sumScans")}</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.active_subscriptions ?? 0}</span> {t("admin.overview.sumSubs")}</p>
          <p>• <span className="font-medium text-foreground">{dashboard?.active_consultations ?? 0}</span> {t("admin.overview.sumConsults")}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
