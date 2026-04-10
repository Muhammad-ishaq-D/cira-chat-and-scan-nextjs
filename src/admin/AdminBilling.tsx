import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, Users, RefreshCw, IndianRupee, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";

const AdminBilling = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(setDashboard)
      .catch((e) => console.error("Billing error:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
        <div className="animate-pulse space-y-6">
          <div><div className="h-7 w-40 bg-muted rounded" /><div className="h-4 w-56 bg-muted rounded mt-2" /></div>
          <div className="grid grid-cols-2 gap-3">{[...Array(2)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl p-4 h-28" />)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Billing & Revenue</h1>
        <p className="text-sm text-muted-foreground font-body">Financial overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600"><IndianRupee size={20} /></div>
            <div>
              <p className="text-[11px] text-muted-foreground">Revenue</p>
              <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>${dashboard?.revenue ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600"><Users size={20} /></div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total Users</p>
              <p className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{dashboard?.total_users ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Transactions</h2>
        <p className="text-sm text-muted-foreground text-center py-8">Transaction history will be available once the billing API endpoints are implemented on the backend.</p>
      </div>
    </div>
  );
};

export default AdminBilling;
