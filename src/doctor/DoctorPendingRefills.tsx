import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Inbox, CheckCircle2, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { doctorApi, type DoctorRefill } from "@/lib/doctorApi";

const DoctorPendingRefills = () => {
  const [items, setItems] = useState<DoctorRefill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DoctorRefill | null>(null);
  const [action, setAction] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getPendingRefills();
      setItems(res.refills || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const close = () => { setSelected(null); setAction(null); setNote(""); };

  const submit = async () => {
    if (!selected || !action) return;
    if (action === "reject" && note.trim().length < 10) {
      toast.error("Please provide a rejection reason (min 10 chars).");
      return;
    }
    setSubmitting(true);
    try {
      if (action === "approve") {
        await doctorApi.approveRefill(selected.id, note.trim() || undefined);
        toast.success("Approved. PDF email sent to patient.");
      } else {
        await doctorApi.rejectRefill(selected.id, note.trim());
        toast.success("Rejected. Refund issued and email sent.");
      }
      close();
      load();
    } catch (e: any) {
      toast.error(e.message || "Action failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pending Prescription Refills</h1>
          <p className="text-sm text-muted-foreground">Review and approve or reject paid refill requests.</p>
        </div>
        <button onClick={load} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent flex items-center gap-2">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center text-muted-foreground"><Loader2 className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Inbox className="mx-auto mb-2" />
            <p className="text-sm">No pending refills to review.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ref</th>
                <th className="text-left p-3">Patient email</th>
                <th className="text-left p-3">Medications</th>
                <th className="text-left p-3">Submitted</th>
                <th className="text-right p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{r.reference_code}</td>
                  <td className="p-3">{r.delivery_email}</td>
                  <td className="p-3">
                    {(r.medications || []).map((m, i) => (
                      <span key={i} className="inline-block mr-1 mb-1 px-2 py-0.5 rounded-md bg-muted text-xs">
                        {m.drug_name_inn} {m.drug_strength}
                      </span>
                    ))}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => setSelected(r)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center gap-1">
                      <FileText size={12} /> Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-lg font-semibold mb-1">Review Refill</h2>
            <p className="text-xs font-mono text-muted-foreground mb-4">{selected.reference_code}</p>

            <div className="space-y-2 text-sm mb-4">
              <div><span className="text-muted-foreground">Patient email: </span>{selected.delivery_email}</div>
              {selected.patient_name && <div><span className="text-muted-foreground">Patient: </span>{selected.patient_name}</div>}
              <div><span className="text-muted-foreground">Amount: </span>${(Number(selected.amount_charged) || 0).toFixed(2)}</div>
              <div>
                <span className="text-muted-foreground block mb-1">Medications:</span>
                <ul className="list-disc list-inside text-foreground/90">
                  {(selected.medications || []).map((m, i) => (
                    <li key={i}>{m.drug_name_inn} {m.drug_strength} {m.drug_form}</li>
                  ))}
                </ul>
              </div>
            </div>

            {!action && (
              <div className="flex gap-2">
                <button onClick={() => setAction("approve")} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2">
                  <CheckCircle2 size={16} /> Approve & Send PDF
                </button>
                <button onClick={() => setAction("reject")} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:opacity-90 inline-flex items-center justify-center gap-2">
                  <XCircle size={16} /> Reject & Refund
                </button>
              </div>
            )}

            {action && (
              <div>
                <label className="text-xs font-medium block mb-1">
                  {action === "approve" ? "Note (optional)" : "Rejection reason (required, min 10 chars)"}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={action === "approve" ? "Any note for the patient..." : "Explain why this prescription is not approved..."}
                />
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setAction(null); setNote(""); }} className="flex-1 py-2.5 rounded-xl border border-border text-sm">Back</button>
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50 ${action === "approve" ? "bg-emerald-600" : "bg-red-600"}`}
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : action === "approve" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    Confirm {action === "approve" ? "Approval" : "Rejection"}
                  </button>
                </div>
              </div>
            )}

            {!action && (
              <button onClick={close} className="mt-4 w-full text-xs text-muted-foreground hover:text-foreground">Cancel</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPendingRefills;
