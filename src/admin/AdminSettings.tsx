import { useState, useEffect } from "react";
import { Shield, Database, Save, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface PlatformSetting {
  setting_key: string;
  setting_value: string;
}

const toggleKeys = [
  { key: "enable_vitals_scan", label: "Vitals Scan", description: "Enable face scan feature for all users" },
  { key: "enable_doctor_booking", label: "Doctor Booking", description: "Enable doctor booking feature" },
  { key: "maintenance_mode", label: "Maintenance Mode", description: "Show maintenance page to all users" },
];

const creditKeys = [
  { key: "free_consults_per_day", label: "Free Plan — Consults / Day" },
  { key: "pro_consults_per_day", label: "Pro Plan — Consults / Day" },
];

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getSettings()
      .then((data) => {
        const map: Record<string, string> = {};
        const list = Array.isArray(data) ? data : data.settings || [];
        list.forEach((s: PlatformSetting) => { map[s.setting_key] = s.setting_value; });
        setSettings(map);
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateSetting = async (key: string, value: string) => {
    const prev = settings[key];
    setSettings((s) => ({ ...s, [key]: value }));
    setSavingKey(key);
    try {
      await adminApi.updateSetting(key, value);
      toast.success(`${key} updated`);
    } catch {
      setSettings((s) => ({ ...s, [key]: prev }));
      toast.error("Failed to update setting");
    } finally {
      setSavingKey(null);
    }
  };

  const toggleSetting = (key: string) => {
    const current = settings[key];
    updateSetting(key, current === "true" ? "false" : "true");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Settings</h1>
        <p className="text-sm text-muted-foreground font-body">System configuration and feature management</p>
      </div>

      {/* Feature Toggles */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Feature Toggles</h2>
        </div>
        <div className="space-y-1">
          {toggleKeys.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <button onClick={() => toggleSetting(t.key)} disabled={savingKey === t.key} className="shrink-0">
                {settings[t.key] === "true"
                  ? <ToggleRight size={28} className="text-primary" />
                  : <ToggleLeft size={28} className="text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Credit / Consult Limits */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Database size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Consult Limits</h2>
        </div>
        <div className="space-y-4">
          {creditKeys.map((c) => (
            <div key={c.key} className="flex items-center gap-4">
              <label className="text-sm text-foreground flex-1">{c.label}</label>
              <input
                value={settings[c.key] || ""}
                onChange={(e) => setSettings((s) => ({ ...s, [c.key]: e.target.value }))}
                className="w-24 py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground text-center"
              />
              <button
                onClick={() => updateSetting(c.key, settings[c.key] || "")}
                disabled={savingKey === c.key}
                className="px-3 py-2 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingKey === c.key ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
