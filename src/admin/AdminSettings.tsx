import { useState, useEffect } from "react";
import { Shield, Database, Key, Save, Server, Lock, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface SettingToggle {
  label: string;
  description: string;
  enabled: boolean;
  key: string;
}

const AdminSettings = () => {
  const [toggles, setToggles] = useState<SettingToggle[]>([]);
  const [credits, setCredits] = useState<any>({});
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [systemInfo, setSystemInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings()
      .then((data) => {
        if (data.toggles) setToggles(data.toggles);
        else setToggles([
          { label: "User Registration", description: "Allow new users to sign up", enabled: true, key: "registration" },
          { label: "Email Verification", description: "Require email verification on signup", enabled: true, key: "emailVerify" },
          { label: "Free Tier", description: "Enable free plan for new users", enabled: true, key: "freeTier" },
          { label: "Face Scan", description: "Enable face scan feature for all users", enabled: true, key: "faceScan" },
          { label: "AI Chat", description: "Enable AI chat functionality", enabled: true, key: "aiChat" },
          { label: "Doctor Booking", description: "Enable doctor booking feature", enabled: true, key: "doctorBooking" },
          { label: "Maintenance Mode", description: "Show maintenance page to all users", enabled: false, key: "maintenance" },
          { label: "Debug Logging", description: "Enable verbose logging for debugging", enabled: false, key: "debugLog" },
        ]);
        if (data.credits) setCredits(data.credits);
        else setCredits({ freeScans: "2", freeChatCredits: "100000", proScans: "50", proChatCredits: "500000", enterpriseScans: "Unlimited", enterpriseChatCredits: "Unlimited" });
        if (data.apiKeys) setApiKeys(data.apiKeys);
        if (data.systemInfo) setSystemInfo(data.systemInfo);
      })
      .catch(() => {
        setToggles([
          { label: "User Registration", description: "Allow new users to sign up", enabled: true, key: "registration" },
          { label: "Email Verification", description: "Require email verification", enabled: true, key: "emailVerify" },
          { label: "Free Tier", description: "Enable free plan", enabled: true, key: "freeTier" },
          { label: "Face Scan", description: "Enable face scan", enabled: true, key: "faceScan" },
          { label: "AI Chat", description: "Enable AI chat", enabled: true, key: "aiChat" },
          { label: "Maintenance Mode", description: "Show maintenance page", enabled: false, key: "maintenance" },
        ]);
        setCredits({ freeScans: "2", freeChatCredits: "100000", proScans: "50", proChatCredits: "500000", enterpriseScans: "Unlimited", enterpriseChatCredits: "Unlimited" });
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: string) => {
    const updated = toggles.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t));
    setToggles(updated);
    try {
      await adminApi.updateSettings({ toggles: updated });
    } catch {
      toast.error("Failed to save setting");
      setToggles(toggles);
    }
  };

  const saveCredits = async () => {
    setSaving(true);
    try {
      await adminApi.updateCreditLimits(credits);
      toast.success("Credit limits saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Settings</h1>
        <p className="text-sm text-muted-foreground font-body">System configuration and feature management</p>
      </div>

      {/* Feature Toggles */}
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

      {/* Credit Configuration */}
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

      {/* API Keys */}
      {apiKeys.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5"><Key size={16} className="text-primary" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>API Keys</h2></div>
          <div className="space-y-2">
            {apiKeys.map((k: any) => (
              <div key={k.name} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <Lock size={14} className="text-muted-foreground" />
                  <div><p className="text-sm font-medium text-foreground">{k.name}</p><p className="text-xs text-muted-foreground font-mono">{k.masked}</p></div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${k.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>{k.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Info */}
      {systemInfo.length > 0 && (
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><Server size={16} className="text-muted-foreground" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>System Info</h2></div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {systemInfo.map((i: any) => (
              <div key={i.label} className="flex justify-between py-2 border-b border-border/30">
                <span className="text-muted-foreground">{i.label}</span>
                <span className="font-medium text-foreground">{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
