import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Receipt, CheckCircle2, Clock, XCircle } from "lucide-react";

const payments = [
  { id: "INV-001", date: "Mar 29, 2026", plan: "Pro Plan", amount: "$9.99", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-002", date: "Feb 28, 2026", plan: "Pro Plan", amount: "$9.99", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-003", date: "Jan 29, 2026", plan: "Pro Plan", amount: "$9.99", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-004", date: "Dec 29, 2025", plan: "Basic → Pro Upgrade", amount: "$9.99", status: "Paid", method: "Visa •••• 4242" },
  { id: "INV-005", date: "Nov 15, 2025", plan: "Basic Plan", amount: "Free", status: "Free", method: "—" },
];

const statusIcon = (status: string) => {
  if (status === "Paid") return <CheckCircle2 size={14} className="text-emerald-500" />;
  if (status === "Pending") return <Clock size={14} className="text-amber-500" />;
  if (status === "Free") return <CheckCircle2 size={14} className="text-blue-500" />;
  return <XCircle size={14} className="text-red-500" />;
};

const statusStyle = (status: string) => {
  if (status === "Paid") return "text-emerald-600 bg-emerald-50";
  if (status === "Pending") return "text-amber-600 bg-amber-50";
  if (status === "Free") return "text-blue-600 bg-blue-50";
  return "text-red-600 bg-red-50";
};

const PaymentHistory = () => {
  const navigate = useNavigate();

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

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Plan</p>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Basic</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Spent</p>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>$39.96</p>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next Billing</p>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>—</p>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-border/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transactions</p>
          </div>
          <div className="divide-y divide-border/30">
            {payments.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-accent/30 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-secondary/60 flex items-center justify-center shrink-0">
                  {statusIcon(p.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.plan}</p>
                  <p className="text-[11px] text-muted-foreground">{p.date} · {p.method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{p.amount}</p>
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
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
