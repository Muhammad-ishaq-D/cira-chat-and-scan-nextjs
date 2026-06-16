import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw, Search, AlertTriangle, Inbox, FileText, Clock, Stethoscope, Copy, CheckCheck,
  RotateCcw, CheckCircle2, XCircle, Loader2, ExternalLink,
} from "lucide-react";
import { adminApi, type ReferralLetter, type ReferralRefundRequest } from "@/lib/apiClient";

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

const DetailItem = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    <p className={`mt-1 text-sm ${bold ? "font-semibold text-foreground" : "text-foreground/80"}`}>{value}</p>
  </div>
);

const AdminReferralLetters = () => {
  // Main list state
  const [letters, setLetters] = useState<ReferralLetter[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PayStatus>("all");

  // Refunds panel state
  const [showRefunds, setShowRefunds] = useState(false);
  const [refundRequests, setRefundRequests] = useState<ReferralRefundRequest[]>([]);
  const [loadingRefunds, setLoadingRefunds] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<Record<number, "approve" | "reject" | null>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expandedNote, setExpandedNote] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getReferralLetters({ status: status === "all" ? undefined : status });
      setLetters(res.letters ?? []);
      setTotalCount(res.total_count ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const loadRefunds = useCallback(async () => {
    setLoadingRefunds(true);
    setRefundError(null);
    try {
      const data = await adminApi.getReferralRefunds();
      setRefundRequests(data);
    } catch (e) {
      setRefundError(e instanceof Error ? e.message : "Failed to load refund requests");
    } finally {
      setLoadingRefunds(false);
    }
  }, []);

  const toggleRefunds = () => {
    const next = !showRefunds;
    setShowRefunds(next);
    if (next) loadRefunds();
  };

  const showToast = (id: number, msg: string, ok: boolean) => {
    setToast({ id, msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecide = async (refund: ReferralRefundRequest, decision: "approve" | "reject") => {
    setDeciding(prev => ({ ...prev, [refund.id]: decision }));
    try {
      await adminApi.decideReferralRefund(refund.id, decision, notes[refund.id]?.trim() || undefined);
      showToast(refund.id, decision === "approve" ? "Refund approved and issued." : "Refund rejected.", decision === "approve");
      setRefundRequests(prev => prev.filter(r => r.id !== refund.id));
      if (decision === "approve") load();
    } catch (e) {
      showToast(refund.id, e instanceof Error ? e.message : "Action failed", false);
    } finally {
      setDeciding(prev => ({ ...prev, [refund.id]: null }));
    }
  };

  const filtered = letters.filter(l => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      l.reference_code.toLowerCase().includes(s) ||
      (l.patient_name || "").toLowerCase().includes(s) ||
      (l.specialist_specialty || "").toLowerCase().includes(s) ||
      (l.delivery_email || "").toLowerCase().includes(s) ||
      (l.stripe_payment_intent_id || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Referral Letters
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalCount} total records — use the Stripe Payment Intent ID to locate and refund in Stripe
          </p>
        </div>
        <button
          onClick={toggleRefunds}
          className={`flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg ${
            showRefunds
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <RotateCcw size={14} />
          Refunds
          {refundRequests.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
              {refundRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm font-medium transition-all ${
          toast.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Refunds Panel */}
      {showRefunds && (
        <div className="space-y-4 rounded-xl border border-amber-200/60 bg-amber-50/30 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Pending Refund Requests</h2>
            <button
              onClick={loadRefunds}
              disabled={loadingRefunds}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loadingRefunds ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {refundError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
              <p className="text-destructive text-sm">{refundError}</p>
            </div>
          )}

          {loadingRefunds && (
            <div className="animate-pulse space-y-3">
              {[...Array(2)].map((_, i) => <div key={i} className="bg-card/80 border border-border/50 rounded-xl h-44" />)}
            </div>
          )}

          {!loadingRefunds && !refundError && refundRequests.length === 0 && (
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-8 flex flex-col items-center gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                <Inbox className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm">No pending referral refund requests</p>
              <p className="text-xs text-muted-foreground">All referral refund requests have been reviewed.</p>
            </div>
          )}

          {!loadingRefunds && refundRequests.map(refund => {
            const isDeciding = !!deciding[refund.id];
            const noteOpen = expandedNote === refund.id;
            const amountDisplay = refund.amount_charged != null
              ? `$${Number(refund.amount_charged).toFixed(2)}`
              : "$5.00";
            const dateDisplay = refund.refund_requested_at
              ? new Date(refund.refund_requested_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })
              : "—";

            return (
              <div key={refund.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="px-5 py-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                      <FileText size={16} className="text-violet-600" />
                    </div>
                    <div>
                      <span className="font-mono text-sm font-semibold text-foreground tracking-wide">{refund.reference_code}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Clock size={11} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{dateDisplay}</span>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium self-start sm:self-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending Review
                  </span>
                </div>

                <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <DetailItem label="Patient" value={refund.patient_name} />
                  <DetailItem label="Amount Charged" value={amountDisplay} bold />
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Specialist</span>
                    <p className="mt-1 text-sm text-foreground/80 flex items-center gap-1.5">
                      <Stethoscope size={13} className="text-primary shrink-0" />
                      {refund.specialist_specialty}
                    </p>
                  </div>
                  <DetailItem label="Patient Email" value={refund.delivery_email || "—"} />
                </div>

                <div className="px-5 pb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Refund Reason</span>
                  <p className="mt-1 text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                    {refund.refund_reason || "No reason provided"}
                  </p>
                </div>

                <div className="px-5 pb-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proof File</span>
                  {refund.refund_proof_file_path ? (
                    <a href={refund.refund_proof_file_path} target="_blank" rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <ExternalLink size={13} />
                      View uploaded proof
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground italic">No file uploaded</p>
                  )}
                </div>

                <div className="px-5 pb-4">
                  <button
                    onClick={() => setExpandedNote(noteOpen ? null : refund.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
                  >
                    {noteOpen ? "Hide admin note" : "Add admin note (optional)"}
                  </button>
                  {noteOpen && (
                    <textarea
                      value={notes[refund.id] || ""}
                      onChange={e => setNotes(prev => ({ ...prev, [refund.id]: e.target.value.slice(0, 500) }))}
                      placeholder="Internal note for this decision…"
                      rows={3}
                      disabled={isDeciding}
                      className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 resize-none"
                    />
                  )}
                </div>

                <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleDecide(refund, "approve")}
                    disabled={isDeciding}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                    style={{ minHeight: 44 }}
                  >
                    {deciding[refund.id] === "approve" ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                    Approve & Issue Refund
                  </button>
                  <button
                    onClick={() => handleDecide(refund, "reject")}
                    disabled={isDeciding}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors disabled:opacity-60"
                    style={{ minHeight: 44 }}
                  >
                    {deciding[refund.id] === "reject" ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                    Reject Request
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search ref, patient, specialist, intent ID…"
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
          <p className="font-medium text-foreground">No referral letters found</p>
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Patient</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Specialist</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Stripe Intent ID</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Payment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.map(l => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-foreground">{l.reference_code}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock size={11} />
                        {l.created_at ? new Date(l.created_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground/80">{l.patient_name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-foreground/80">
                      <div className="flex items-center gap-1">
                        <Stethoscope size={11} className="text-primary shrink-0" />
                        {l.specialist_specialty || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.delivery_email || "—"}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">${Number(l.amount_charged).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {l.stripe_payment_intent_id ? (
                        <div className="flex items-center">
                          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[130px]" title={l.stripe_payment_intent_id}>
                            {l.stripe_payment_intent_id}
                          </span>
                          <CopyButton value={l.stripe_payment_intent_id} />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[l.payment_status] ?? "bg-muted text-muted-foreground"}`}>
                        {l.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${REFUND_COLORS[l.refund_status] ?? "bg-muted text-muted-foreground"}`}>
                        {l.refund_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferralLetters;
