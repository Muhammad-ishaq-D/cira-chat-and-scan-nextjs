import { useState, useEffect } from "react";
import { Shield, Database, Save, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface SettingToggle {
  label: string;
  description: string;
  enabled: boolean;
  key: string;
}

const defaultToggles: SettingToggle[] = [
  { label: "User Registration", description: "Allow new users to sign up", enabled: true, key: "registration" },
  { label: "Email Verification", description: "Require email verification on signup", enabled: true, key: "emailVerify" },
  { label: "Free Tier", description: "Enable free plan for new users", enabled: true, key: "freeTier" },
  { label: "Face Scan", description: "Enable face scan feature for all users", enabled: true, key: "faceScan" },
  { label: "AI Chat", description: "Enable AI chat functionality", enabled: true, key: "aiChat" },
  { label: "Doctor Booking", description: "Enable doctor booking feature", enabled: true, key: "doctorBooking" },
  { label: "Maintenance Mode", description: "Show maintenance page to all users", enabled: false, key: "maintenance" },
];

const defaultCredits: Record<string, string> = {
  freeScans: "2", freeChatCredits: "100000",
  proScans: "50", proChatCredits: "500000",
  enterpriseScans: "Unlimited", enterpriseChatCredits: "Unlimited",
};

const AdminSettings = () => {
  const [toggles, setToggles] = useState<SettingToggle[]>(defaultToggles);
  const [credits, setCredits] = useState(defaultCredits);
  const [saving, setSaving] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getCreditLimits();
        const limits = data?.limits || data;
        if (limits && typeof limits === "object") {
          setCredits((prev) => ({ ...prev, ...limits }));
        }
      } catch {
        // fallback to defaults
      } finally {
        setLoadingCredits(false);
      }
    };
    load();
  }, []);

  const toggle = async (key: string) => {
    const updated = toggles.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t));
    setToggles(updated);
    try {
      await adminApi.updateSettings({ toggles: updated });
    } catch {
      // Settings endpoint may not exist yet — keep local state
    }
  };

  const saveCredits = async () => {
    setSaving(true);
    try {
      await adminApi.updateCreditLimits(credits);
      toast.success("Credit limits saved");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save credit limits");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Settings</h1>
        <p className="text-sm text-muted-foreground font-body">System configuration and feature management</p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5"><Shield size={16} className="text-primary" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Feature Toggles</h2></div>
        <div className="space-y-1">
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div><p className="text-sm font-medium text-foreground">{t.label}</p><p className="text-xs text-muted-foreground">{t.description}</p></div>
              <button onClick={() => toggle(t.key)} className="shrink-0">
                {t.enabled ? <ToggleRight size={28} className="text-primary" /> : <ToggleLeft size={28} className="text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5"><Database size={16} className="text-primary" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Credit Limits</h2></div>
        <div className="space-y-4">
          {[
            { plan: "Free", scansKey: "freeScans", chatsKey: "freeChatCredits" },
            { plan: "Pro", scansKey: "proScans", chatsKey: "proChatCredits" },
            { plan: "Enterprise", scansKey: "enterpriseScans", chatsKey: "enterpriseChatCredits" },
          ].map((p) => (
            <div key={p.plan} className="bg-accent/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3">{p.plan} Plan</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Face Scans</label>
                  <input value={credits[p.scansKey] || ""} onChange={(e) => setCredits({ ...credits, [p.scansKey]: e.target.value })} className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Chat Credits</label>
                  <input value={credits[p.chatsKey] || ""} onChange={(e) => setCredits({ ...credits, [p.chatsKey]: e.target.value })} className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={saveCredits} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save size={14} />{saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
