import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Inbox } from "lucide-react";
import { toast } from "sonner";
import { doctorApi, type DoctorRefill } from "@/lib/doctorApi";

type Filter = "all" | "approved" | "rejected";

const DoctorReviewedRefills = () => {
  const [items, setItems] = useState<DoctorRefill[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.getReviewedRefills(filter);
      setItems(res.refills || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Review History</h1>
          <p className="text-sm text-muted-foreground">Your past prescription decisions.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="text-sm border border-border rounded-lg px-2 py-1 bg-background">
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button onClick={load} className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Inbox className="mx-auto mb-2" />
            <p className="text-sm">No reviewed refills yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Ref</th>
                <th className="text-left p-3">Patient email</th>
                <th className="text-left p-3">Decision</th>
                <th className="text-left p-3">Reviewed</th>
                <th className="text-left p-3">Note</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">{r.reference_code}</td>
                  <td className="p-3">{r.delivery_email}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md ${r.review_status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {r.review_status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{r.reviewed_at ? new Date(r.reviewed_at).toLocaleString() : "—"}</td>
                  <td className="p-3 text-xs max-w-[280px] truncate" title={r.doctor_note || ""}>{r.doctor_note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default DoctorReviewedRefills;
