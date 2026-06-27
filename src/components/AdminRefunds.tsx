"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, FileText, ExternalLink, Loader2, AlertTriangle, Clock, Inbox } from "lucide-react";
import { adminApi, type RefundRequest } from "@/lib/apiClient";

const AdminRefunds = () => {
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<Record<number, "approve" | "reject" | null>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [expandedNote, setExpandedNote] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; msg: string; ok: boolean } | null>(null);

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

  const showToast = (id: number, msg: string, ok: boolean) => {
    setToast({ id, msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const handleDecide = async (refund: RefundRequest, decision: "approve" | "reject") => {
    setDeciding(prev => ({ ...prev, [refund.id]: decision }));
    try {
      await adminApi.decideRefund(refund.id, decision, notes[refund.id]?.trim() || undefined);
      showToast(refund.id, decision === "approve" ? "Refund approved and issued." : "Refund rejected.", decision === "approve");
      setRefunds(prev => prev.filter(r => r.id !== refund.id));
    } catch (e) {
      showToast(refund.id, e instanceof Error ? e.message : "Action failed", false);
    } finally {
      setDeciding(prev => ({ ...prev, [refund.id]: null }));
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-muted rounded" />
          <div className="h-4 w-64 bg-muted rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card/80 border border-border/50 rounded-xl p-5 h-44" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Refund Requests
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-0.5">
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
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border text-sm font-medium transition-all ${
            toast.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
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

      {/* Refund cards */}
      <div className="space-y-4">
        {refunds.map((refund) => {
          const isDeciding = !!deciding[refund.id];
          const noteOpen = expandedNote === refund.id;
          const amountDisplay = refund.amount_charged != null
            ? `€${Number(refund.amount_charged).toFixed(2)}`
            : "—";
          const medsDisplay = refund.medications.length > 0
            ? refund.medications.map(m => [m.drug_name_inn, m.drug_strength, m.drug_form].filter(Boolean).join(" ")).join(", ")
            : "—";
          const dateDisplay = refund.refund_requested_at
            ? new Date(refund.refund_requested_at).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" })
            : "—";

          return (
            <div
              key={refund.id}
              className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Card header */}
              <div className="px-5 py-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <RefreshCw size={16} className="text-amber-600" />
                  </div>
                  <div>
                    <span className="font-mono text-sm font-semibold text-foreground tracking-wide">
                      {refund.reference_code}
                    </span>
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

              {/* Details grid */}
              <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem label="Medications" value={medsDisplay} />
                <DetailItem label="Amount Charged" value={amountDisplay} bold />
                <DetailItem label="Patient Email" value={refund.delivery_email_masked || "—"} />
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Proof File</span>
                  {refund.refund_proof_file_path ? (
                    <a
                      href={refund.refund_proof_file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText size={14} />
                      View File
                      <ExternalLink size={11} />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">No file attached</p>
                  )}
                </div>
              </div>

              {/* Reason */}
              <div className="px-5 pb-4">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Refund Reason</span>
                <p className="mt-1 text-sm text-foreground/80 leading-relaxed bg-muted/40 rounded-lg px-3 py-2.5 whitespace-pre-wrap">
                  {refund.refund_reason || "—"}
                </p>
              </div>

              {/* Admin note toggle */}
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
                    onChange={(e) => setNotes(prev => ({ ...prev, [refund.id]: e.target.value.slice(0, 500) }))}
                    placeholder="Internal note for this decision…"
                    rows={3}
                    disabled={isDeciding}
                    className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 resize-none"
                  />
                )}
              </div>

              {/* Action buttons */}
              <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleDecide(refund, "approve")}
                  disabled={isDeciding}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-60"
                  style={{ minHeight: 44 }}
                >
                  {deciding[refund.id] === "approve" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={15} />
                  )}
                  Approve & Issue Refund
                </button>
                <button
                  onClick={() => handleDecide(refund, "reject")}
                  disabled={isDeciding}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 text-destructive font-semibold text-sm hover:bg-destructive/10 transition-colors disabled:opacity-60"
                  style={{ minHeight: 44 }}
                >
                  {deciding[refund.id] === "reject" ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <XCircle size={15} />
                  )}
                  Reject Request
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <div>
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
    <p className={`mt-1 text-sm ${bold ? "font-semibold text-foreground" : "text-foreground/80"}`}>{value}</p>
  </div>
);

export default AdminRefunds;
