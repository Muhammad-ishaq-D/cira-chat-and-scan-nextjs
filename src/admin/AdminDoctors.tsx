import { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { Loader2, RefreshCw, Plus, Search, ShieldOff, ShieldCheck, KeyRound, Trash2, X, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type AdminDoctor } from "@/lib/apiClient";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
};

const empty = { name: "", email: "", password: "", specialty: "", license_number: "", phone: "", bio: "" };

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);
  const [resetFor, setResetFor] = useState<AdminDoctor | null>(null);
  const [newPw, setNewPw] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdd && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showAdd]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getDoctors({ search });
      setDoctors(Array.isArray(res) ? res : (res?.doctors || []));
    } catch (e: any) {
      toast.error(e.message || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Name, email and password are required");
      return;
    }
    setSaving(true);
    try {
      const res: any = await adminApi.createDoctor(form);
      const created: AdminDoctor | undefined = res?.doctor || res?.data || (res?.id ? res : undefined);
      toast.success("Doctor created");
      setShowAdd(false);
      setForm({ ...empty });
      // Optimistic insert so admin sees it without a refresh
      if (created && created.id) {
        setDoctors((prev) => {
          if (prev.some((d) => String(d.id) === String(created.id))) return prev;
          return [created, ...prev];
        });
      }
      // Re-sync with backend in the background (no full loader flash)
      try {
        const fresh: any = await adminApi.getDoctors({ search });
        const list: AdminDoctor[] = Array.isArray(fresh) ? fresh : (fresh?.doctors || []);
        if (list.length) setDoctors(list);
      } catch { /* ignore */ }
    } catch (e: any) {
      toast.error(e.message || "Failed to create doctor");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (d: AdminDoctor) => {
    try {
      if (d.status === "suspended") await adminApi.activateDoctor(d.id);
      else await adminApi.suspendDoctor(d.id);
      setDoctors((prev) => prev.map((x) => x.id === d.id ? { ...x, status: d.status === "suspended" ? "active" : "suspended" } : x));
      toast.success("Status updated");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const resetPw = async () => {
    if (!resetFor || newPw.length < 8) { toast.error("Password must be at least 8 chars"); return; }
    try {
      await adminApi.resetDoctorPassword(resetFor.id, newPw);
      toast.success("Password reset");
      setResetFor(null); setNewPw("");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  const remove = async (d: AdminDoctor) => {
    if (!confirm(`Delete doctor ${d.name}? This cannot be undone.`)) return;
    try {
      await adminApi.deleteDoctor(d.id);
      setDoctors((prev) => prev.filter((x) => x.id !== d.id));
      toast.success("Doctor deleted");
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 md:pb-8 space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-semibold">Doctors</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage doctor accounts. Doctors review prescription refills.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name/email…"
              className="w-full sm:w-64 pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex-1 sm:flex-none text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent flex items-center justify-center gap-2">
              <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => setShowAdd(true)} className="flex-1 sm:flex-none text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center gap-2 whitespace-nowrap">
              <Plus size={14} /> Add doctor
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            <Stethoscope className="mx-auto mb-2 opacity-50" />
            No doctors yet. Add the first one.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Specialty</th>
                    <th className="text-left p-3">License</th>
                    <th className="text-left p-3">Phone</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Created</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((d) => (
                    <tr key={d.id} className="border-t border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{d.name}</td>
                      <td className="p-3 break-all">{d.email}</td>
                      <td className="p-3">{d.specialty || "—"}</td>
                      <td className="p-3 font-mono text-xs">{d.license_number || "—"}</td>
                      <td className="p-3 text-xs">{d.phone || "—"}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-md border ${STATUS_COLORS[d.status || "active"]}`}>
                          {d.status || "active"}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                      <td className="p-3 text-right">
                        <DoctorActions d={d} onToggle={toggleStatus} onReset={(x) => { setResetFor(x); setNewPw(""); }} onRemove={remove} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / tablet card list */}
            <div className="lg:hidden divide-y divide-border">
              {doctors.map((d) => (
                <div key={d.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground break-all">{d.email}</div>
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-md border ${STATUS_COLORS[d.status || "active"]}`}>
                      {d.status || "active"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Specialty: </span>{d.specialty || "—"}</div>
                    <div className="font-mono"><span className="text-muted-foreground font-sans">License: </span>{d.license_number || "—"}</div>
                    <div><span className="text-muted-foreground">Phone: </span>{d.phone || "—"}</div>
                    <div><span className="text-muted-foreground">Created: </span>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</div>
                  </div>
                  <div className="pt-1">
                    <DoctorActions d={d} onToggle={toggleStatus} onReset={(x) => { setResetFor(x); setNewPw(""); }} onRemove={remove} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-5 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Add doctor</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input ref={nameInputRef} label="Full name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="Password *" type="text" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Input label="Specialty" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
              <Input label="License number" value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div className="sm:col-span-2">
                <label className="text-xs font-medium block mb-1">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">Cancel</button>
              <button onClick={create} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 inline-flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? "Creating…" : "Create doctor"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">Share these credentials with the doctor — they'll log in at <span className="font-mono">/doctor/login</span>.</p>
          </div>
        </div>
      )}

      {resetFor && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setResetFor(null)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-sm p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-heading text-lg font-semibold mb-1">Reset password</h2>
            <p className="text-xs text-muted-foreground mb-4 break-all">For {resetFor.email}</p>
            <Input label="New password" value={newPw} onChange={setNewPw} />
            <div className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
              <button onClick={() => setResetFor(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">Cancel</button>
              <button onClick={resetPw} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DoctorActions = ({ d, onToggle, onReset, onRemove }: {
  d: AdminDoctor;
  onToggle: (d: AdminDoctor) => void;
  onReset: (d: AdminDoctor) => void;
  onRemove: (d: AdminDoctor) => void;
}) => (
  <div className="inline-flex gap-1">
    <button onClick={() => onToggle(d)} className="p-1.5 rounded-md hover:bg-accent" title={d.status === "suspended" ? "Activate" : "Suspend"}>
      {d.status === "suspended" ? <ShieldCheck size={14} className="text-emerald-600" /> : <ShieldOff size={14} className="text-amber-600" />}
    </button>
    <button onClick={() => onReset(d)} className="p-1.5 rounded-md hover:bg-accent" title="Reset password">
      <KeyRound size={14} className="text-muted-foreground" />
    </button>
    <button onClick={() => onRemove(d)} className="p-1.5 rounded-md hover:bg-accent" title="Delete">
      <Trash2 size={14} className="text-red-600" />
    </button>
  </div>
);

const Input = React.forwardRef<HTMLInputElement, { label: string; value: string; onChange: (v: string) => void; type?: string }>(
  ({ label, value, onChange, type = "text" }, ref) => (
    <div>
      <label className="text-xs font-medium block mb-1">{label}</label>
      <input ref={ref} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
    </div>
  )
);

export default AdminDoctors;
