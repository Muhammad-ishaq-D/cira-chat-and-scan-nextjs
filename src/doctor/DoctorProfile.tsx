import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { doctorApi, doctorAuth, type Doctor } from "@/lib/doctorApi";

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(doctorAuth.current());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await doctorApi.getProfile();
        setDoctor(d);
        localStorage.setItem("cira_doctor", JSON.stringify(d));
      } catch {/* ignore */}
      finally { setLoading(false); }
    })();
  }, []);

  const update = (key: keyof Doctor, value: string) => setDoctor((d) => d ? { ...d, [key]: value } : d);

  const save = async () => {
    if (!doctor) return;
    setSaving(true);
    try {
      const updated = await doctorApi.updateProfile({
        name: doctor.name, phone: doctor.phone, bio: doctor.bio,
      });
      setDoctor(updated);
      localStorage.setItem("cira_doctor", JSON.stringify(updated));
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const changePw = async () => {
    if (pw.next.length < 8) { toast.error("New password must be at least 8 characters"); return; }
    setPwSaving(true);
    try {
      await doctorApi.changePassword(pw.current, pw.next);
      setPw({ current: "", next: "" });
      toast.success("Password updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading || !doctor) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold mb-1">Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your account information.</p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold">Account</h2>
        <Field label="Name" value={doctor.name || ""} onChange={(v) => update("name", v)} />
        <Field label="Email" value={doctor.email || ""} disabled />
        <Field label="Specialty" value={doctor.specialty || ""} disabled />
        <Field label="License #" value={doctor.license_number || ""} disabled />
        <Field label="Phone" value={doctor.phone || ""} onChange={(v) => update("phone", v)} />
        <div>
          <label className="text-xs font-medium block mb-1">Bio</label>
          <textarea
            value={doctor.bio || ""}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <form className="bg-card rounded-2xl border border-border p-6 space-y-4" autoComplete="off" onSubmit={(e) => { e.preventDefault(); changePw(); }}>
        <h2 className="font-heading text-base font-semibold">Change password</h2>
        {/* Hidden dummy fields to defeat browser autofill */}
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
        <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />
        <Field label="Current password" type="password" value={pw.current} onChange={(v) => setPw((p) => ({ ...p, current: v }))} autoComplete="new-password" />
        <Field label="New password" type="password" value={pw.next} onChange={(v) => setPw((p) => ({ ...p, next: v }))} autoComplete="new-password" />
        <button type="submit" disabled={pwSaving || !pw.current || !pw.next || pw.current === pw.next} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
          {pwSaving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", disabled, autoComplete }: { label: string; value: string; onChange?: (v: string) => void; type?: string; disabled?: boolean; autoComplete?: string }) => (
  <div>
    <label className="text-xs font-medium block mb-1">{label}</label>
    <input
      type={type}
      value={value}
      disabled={disabled}
      autoComplete={autoComplete}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
    />
  </div>
);

export default DoctorProfile;
