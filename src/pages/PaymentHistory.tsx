import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Download, Receipt, CheckCircle2, Clock, XCircle,
  Loader2, AlertTriangle, RotateCcw, Ban
} from "lucide-react";
import { billingApi } from "@/lib/apiClient";
import { toast } from "sonner";

const statusIcon = (status: string) => {
  if (status === "Paid" || status === "success") return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "Pending" || status === "pending") return <Clock size={14} className="text-amber-500" />;
  if (status === "Free" || status === "free") return <CheckCircle2 size={14} className="text-blue-500" />;
  return <XCircle size={14} className="text-red-500" />;
};

const statusStyle = (status: string) => {
  const s = status.toLowerCase();
  if (s === "paid" || s === "success") return "text-emerald-600 bg-emerald-50";
  if (s === "pending") return "text-amber-600 bg-amber-50";
  if (s === "free") return "text-blue-600 bg-blue-50";
  return "text-red-600 bg-red-50";
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const [paymentsData, subData] = await Promise.allSettled([
        billingApi.getPaymentHistory(),
        billingApi.getSubscription(),
      ]);
      if (paymentsData.status === "fulfilled") {
        setPayments(Array.isArray(paymentsData.value) ? paymentsData.value : paymentsData.value.payments || []);
      }
      if (subData.status === "fulfilled") setSubscription(subData.value);
    } catch {
      toast.error("Failed to load payment history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? You'll keep access until the end of your billing period.")) return;
    setActionLoading(true);
    try {
      await billingApi.cancelSubscription();
      toast.success("Subscription will cancel at the end of your billing period");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to cancel subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      await billingApi.reactivateSubscription();
      toast.success("Subscription reactivated — it will continue renewing automatically");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Failed to reactivate subscription");
    } finally {
      setActionLoading(false);
    }
  };

  const totalSpent = payments
    .filter((p: any) => {
      const s = (p.status || "").toLowerCase();
      return s === "paid" || s === "success" || s === "" || s === "completed";
    })
    .reduce((sum: number, p: any) => sum + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);

  const isBasicPlan = !subscription || ["basic", "free"].includes((subscription.plan_name || subscription.plan_id || "").toLowerCase());
  const cancelAtPeriodEnd: boolean = !!subscription?.cancel_at_period_end;
  const periodEnd = subscription?.current_period_end || subscription?.expires_at;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Receipt size={20} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Payment History</h1>
            <p className="text-sm text-muted-foreground">View all your transactions and invoices</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {subscription?.plan_name || "Basic"}
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  ${totalSpent.toFixed(2)}
                </p>
              </div>
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  {cancelAtPeriodEnd ? "Cancels On" : "Next Billing"}
                </p>
                <p className={`text-lg font-semibold ${cancelAtPeriodEnd ? "text-amber-600" : "text-foreground"}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {formatDate(periodEnd)}
                </p>
              </div>
            </div>

            {/* Cancellation banner */}
            {cancelAtPeriodEnd && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
                <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">Subscription cancellation scheduled</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Your {subscription?.plan_name} plan will end on <strong>{formatDate(periodEnd)}</strong>. You have full access until then.
                  </p>
                </div>
                <button
                  onClick={handleReactivate}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                  Undo
                </button>
              </div>
            )}

            {/* Subscription management */}
            {!isBasicPlan && !cancelAtPeriodEnd && (
              <div className="flex items-center justify-between bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl px-5 py-4 mb-6">
                <div>
                  <p className="text-sm font-medium text-foreground">Manage Subscription</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your plan renews on {formatDate(periodEnd)}</p>
                </div>
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
                  Cancel Plan
                </button>
              </div>
            )}

            {/* Transactions */}
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transactions</p>
              </div>
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No transactions yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {payments.map((p: any) => (
                    <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                        {statusIcon(p.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{p.plan_name || p.plan || p.description || "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(p.date || p.created_at)} · {p.method || p.payment_method || "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {typeof p.amount === "number" ? `$${p.amount}` : p.amount}
                        </p>
                        <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyle(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                      <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;
