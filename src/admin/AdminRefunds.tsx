import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, FileText, ExternalLink, Loader2, AlertTriangle, Inbox, ChevronDown, ChevronUp } from "lucide-react";
import { adminApi, type RefundRequest } from "@/lib/apiClient";

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<Record<number, "approve" | "reject" | null>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expandedReason, setExpandedReason] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getRefunds();
      setRefunds(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load refund requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecide = async (refund: RefundRequest, decision: "approve" | "reject") => {
    setDeciding(prev => ({ ...prev, [refund.id]: decision }));
    try {
      await adminApi.decideRefund(refund.id, decision, notes[refund.id]?.trim() || undefined);
      showToast(decision === "approve" ? "Refund approved and issued." : "Refund rejected.", decision === "approve");
      setRefunds(prev => prev.filter(r => r.id !== refund.id));
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Action failed", false);
    } finally {
      setDeciding(prev => ({ ...prev, [refund.id]: null }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          <div className="bg-card/80 border border-border/50 rounded-xl p-5 h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Refund Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {refunds.length} pending {refunds.length === 1 ? "request" : "requests"} awaiting review
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-accent"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm font-medium ${
          toast.ok ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {toast.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Empty state */}
      {!error && refunds.length === 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-12 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center">
            <Inbox className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No pending refund requests</p>
          <p className="text-sm text-muted-foreground">All refund requests have been reviewed.</p>
        </div>
      )}

      {/* Table */}
      {refunds.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Reference</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Medication</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Reason</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Proof</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Admin Note</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => {
                  const isDeciding = !!deciding[refund.id];
                  const medsDisplay = refund.medications.length > 0
                    ? refund.medications.map(m => [m.drug_name_inn, m.drug_strength].filter(Boolean).join(" ")).join(", ")
                    : "—";
                  const dateDisplay = refund.refund_requested_at
                    ? new Date(refund.refund_requested_at).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
                    : "—";
                  const amountDisplay = refund.amount_charged != null
                    ? `$${Number(refund.amount_charged).toFixed(2)}`
                    : "—";
                  const reasonExpanded = expandedReason === refund.id;
                  const reason = refund.refund_reason || "—";
                  const reasonShort = reason.length > 50 ? reason.slice(0, 50) + "…" : reason;

                  return (
                    <tr key={refund.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors align-top">
                      {/* Reference */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          </span>
                          <span className="font-mono font-semibold text-foreground tracking-wide whitespace-nowrap">
                            {refund.reference_code}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{dateDisplay}</td>

                      {/* Medication */}
                      <td className="px-4 py-3 max-w-[160px]">
                        <span className="text-foreground/80 line-clamp-2" title={medsDisplay}>{medsDisplay}</span>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground whitespace-nowrap">{amountDisplay}</span>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {refund.delivery_email_masked || "—"}
                      </td>

                      {/* Reason */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {reason.length > 50 ? (
                          <div>
                            <p className="text-foreground/80 leading-relaxed">
                              {reasonExpanded ? reason : reasonShort}
                            </p>
                            <button
                              onClick={() => setExpandedReason(reasonExpanded ? null : refund.id)}
                              className="mt-1 flex items-center gap-0.5 text-xs text-primary hover:underline"
                            >
                              {reasonExpanded ? <><ChevronUp size={11} />Less</> : <><ChevronDown size={11} />More</>}
                            </button>
                          </div>
                        ) : (
                          <p className="text-foreground/80">{reason}</p>
                        )}
                      </td>

                      {/* Proof */}
                      <td className="px-4 py-3">
                        {refund.refund_proof_file_path ? (
                          <a
                            href={refund.refund_proof_file_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline whitespace-nowrap"
                          >
                            <FileText size={13} />
                            View
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Admin Note */}
                      <td className="px-4 py-3 min-w-[160px]">
                        <input
                          type="text"
                          value={notes[refund.id] || ""}
                          onChange={(e) => setNotes(prev => ({ ...prev, [refund.id]: e.target.value.slice(0, 300) }))}
                          placeholder="Optional note…"
                          disabled={isDeciding}
                          className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleDecide(refund, "approve")}
                            disabled={isDeciding}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                          >
                            {deciding[refund.id] === "approve"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <CheckCircle2 size={12} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecide(refund, "reject")}
                            disabled={isDeciding}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive text-xs font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-60"
                          >
                            {deciding[refund.id] === "reject"
                              ? <Loader2 size={12} className="animate-spin" />
                              : <XCircle size={12} />}
                            Reject
                          </button>
                        </div>
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

export default AdminRefunds;
