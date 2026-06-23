import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Plus, Search, ShieldOff, ShieldCheck, KeyRound, Trash2, X } from "lucide-react";
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
      await adminApi.createDoctor(form);
      toast.success("Doctor created");
      setShowAdd(false);
      setForm({ ...empty });
      load();
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
      toast.success("Status updated");
      load();
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
      toast.success("Doctor deleted");
      load();
    } catch (e: any) { toast.error(e.message || "Failed"); }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Doctors</h1>
          <p className="text-sm text-muted-foreground">Manage doctor accounts. Doctors review prescription refills.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name/email…"
              className="pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm w-64"
            />
          </div>
          <button onClick={load} className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-accent flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowAdd(true)} className="text-sm px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-2">
            <Plus size={14} /> Add doctor
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : doctors.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No doctors yet. Add the first one.</div>
        ) : (
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
                  <td className="p-3">{d.email}</td>
                  <td className="p-3">{d.specialty || "—"}</td>
                  <td className="p-3 font-mono text-xs">{d.license_number || "—"}</td>
                  <td className="p-3 text-xs">{d.phone || "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-md border ${STATUS_COLORS[d.status || "active"]}`}>
                      {d.status || "active"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => toggleStatus(d)} className="p-1.5 rounded-md hover:bg-accent" title={d.status === "suspended" ? "Activate" : "Suspend"}>
                        {d.status === "suspended" ? <ShieldCheck size={14} className="text-emerald-600" /> : <ShieldOff size={14} className="text-amber-600" />}
                      </button>
                      <button onClick={() => { setResetFor(d); setNewPw(""); }} className="p-1.5 rounded-md hover:bg-accent" title="Reset password">
                        <KeyRound size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => remove(d)} className="p-1.5 rounded-md hover:bg-accent" title="Delete">
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-lg p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-semibold">Add doctor</h2>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input label="Full name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="Password *" type="text" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
              <Input label="Specialty" value={form.specialty} onChange={(v) => setForm({ ...form, specialty: v })} />
              <Input label="License number" value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <div className="md:col-span-2">
                <label className="text-xs font-medium block mb-1">Bio</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">Cancel</button>
              <button onClick={create} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
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
            <p className="text-xs text-muted-foreground mb-4">For {resetFor.email}</p>
            <Input label="New password" value={newPw} onChange={setNewPw} />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setResetFor(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">Cancel</button>
              <button onClick={resetPw} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="text-xs font-medium block mb-1">{label}</label>
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30" />
  </div>
);

export default AdminDoctors;
