import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Search, AlertTriangle, Inbox, Pill, Clock, Copy, CheckCheck } from "lucide-react";
import { adminApi, type PrescriptionRefill } from "@/lib/apiClient";

type PayStatus = "all" | "paid" | "refunded" | "failed" | "pending";

const STATUS_COLORS: Record<string, string> = {
  paid:     "bg-emerald-50 text-emerald-700 border-emerald-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  failed:   "bg-red-50 text-red-700 border-red-200",
  pending:  "bg-amber-50 text-amber-700 border-amber-200",
};
const REFUND_COLORS: Record<string, string> = {
  none:      "bg-muted text-muted-foreground",
  requested: "bg-amber-50 text-amber-700",
  approved:  "bg-emerald-50 text-emerald-700",
  rejected:  "bg-red-50 text-red-700",
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className="ml-1 text-muted-foreground hover:text-foreground transition-colors" title="Copy">
      {copied ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} />}
    </button>
  );
};

const AdminPrescriptionRefills = () => {
  const [refills, setRefills] = useState<PrescriptionRefill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PayStatus>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPrescriptionRefills({ status: status === "all" ? undefined : status });
      setRefills(res.refills ?? []);
      setTotalCount(res.total_count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const filtered = refills.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.reference_code.toLowerCase().includes(s) ||
      (r.delivery_email_masked || "").toLowerCase().includes(s) ||
      (r.stripe_payment_intent_id || "").toLowerCase().includes(s) ||
      r.medications.some(m => m.drug_name_inn?.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Prescription Refills
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} total records — use the Stripe Payment Intent ID to locate and refund in Stripe
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ref ID, email, drug, intent ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value as PayStatus)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl h-14" />)}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No prescription refills found</p>
          <p className="text-sm text-muted-foreground">Try changing the status filter.</p>
        </div>
      )}

      {/* Table */}
      {!loading && filtered.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Reference ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Medications</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Stripe Intent ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(r => {
                  const medsLabel = r.medications.length > 0
                    ? r.medications.map(m => [m.drug_name_inn, m.drug_strength].filter(Boolean).join(" ")).join(", ")
                    : "—";
                  return (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                            <Pill size={13} className="text-emerald-600" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-foreground">{r.reference_code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          {r.created_at ? new Date(r.created_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.delivery_email_masked || "—"}</td>
                      <td className="px-4 py-3 text-xs text-foreground/80 max-w-[180px] truncate" title={medsLabel}>{medsLabel}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-foreground">${Number(r.amount_charged).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        {r.stripe_payment_intent_id ? (
                          <div className="flex items-center">
                            <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[130px]" title={r.stripe_payment_intent_id}>
                              {r.stripe_payment_intent_id}
                            </span>
                            <CopyButton value={r.stripe_payment_intent_id} />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[r.payment_status] ?? "bg-muted text-muted-foreground"}`}>
                          {r.payment_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${REFUND_COLORS[r.refund_status] ?? "bg-muted text-muted-foreground"}`}>
                          {r.refund_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPrescriptionRefills;
