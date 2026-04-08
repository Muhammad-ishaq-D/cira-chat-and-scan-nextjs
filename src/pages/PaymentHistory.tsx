import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Receipt, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
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

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch (e: any) {
        toast.error("Failed to load payment history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSpent = payments
    .filter((p: any) => (p.status || "").toLowerCase() === "paid" || (p.status || "").toLowerCase() === "success")
    .reduce((sum: number, p: any) => sum + (parseFloat(String(p.amount).replace(/[^0-9.]/g, "")) || 0), 0);

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
            <div className="grid grid-cols-3 gap-4 mb-8">
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
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next Billing</p>
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {subscription?.next_billing_date || "—"}
                </p>
              </div>
            </div>

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
                        <p className="text-sm font-medium text-foreground">{p.plan || p.description}</p>
                        <p className="text-[11px] text-muted-foreground">{p.date || p.created_at} · {p.method || p.payment_method || "—"}</p>
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
