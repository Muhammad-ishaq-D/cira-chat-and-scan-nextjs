import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Database, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface SettingToggle {
  enabled: boolean;
  key: string;
}

const defaultToggles: SettingToggle[] = [
  { enabled: true, key: "registration" },
  { enabled: true, key: "emailVerify" },
  { enabled: true, key: "freeTier" },
  { enabled: true, key: "faceScan" },
  { enabled: true, key: "aiChat" },
  { enabled: true, key: "doctorBooking" },
  { enabled: false, key: "maintenance" },
];

const defaultCredits: Record<string, string> = {
  freeScans: "2", freeChatCredits: "100000",
  proScans: "50", proChatCredits: "500000",
  enterpriseScans: "Unlimited", enterpriseChatCredits: "Unlimited",
};

const AdminSettings = () => {
  const { t } = useTranslation();
  const [toggles, setToggles] = useState<SettingToggle[]>(defaultToggles);
  const [credits, setCredits] = useState(defaultCredits);
  const [saving, setSaving] = useState(false);

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
      }
    };
    load();
  }, []);

  const toggle = async (key: string) => {
    const updated = toggles.map((tg) => (tg.key === key ? { ...tg, enabled: !tg.enabled } : tg));
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
      toast.success(t("admin.settings.saved"));
    } catch (e: any) {
      toast.error(e?.message || t("admin.settings.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.settings.title")}</h1>
        <p className="text-sm text-muted-foreground font-body">{t("admin.settings.subtitle")}</p>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5"><Shield size={16} className="text-primary" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.settings.featureToggles")}</h2></div>
        <div className="space-y-1">
          {toggles.map((tg) => (
            <div key={tg.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div><p className="text-sm font-medium text-foreground">{t(`admin.settings.toggles.${tg.key}`)}</p><p className="text-xs text-muted-foreground">{t(`admin.settings.toggles.${tg.key}Desc`)}</p></div>
              <button onClick={() => toggle(tg.key)} className="shrink-0">
                {tg.enabled ? <ToggleRight size={28} className="text-primary" /> : <ToggleLeft size={28} className="text-muted-foreground" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5"><Database size={16} className="text-primary" /><h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.settings.creditLimits")}</h2></div>
        <div className="space-y-4">
          {[
            { plan: t("admin.settings.freePlan"), scansKey: "freeScans", chatsKey: "freeChatCredits" },
            { plan: t("admin.settings.proPlan"), scansKey: "proScans", chatsKey: "proChatCredits" },
            { plan: t("admin.settings.enterprisePlan"), scansKey: "enterpriseScans", chatsKey: "enterpriseChatCredits" },
          ].map((p) => (
            <div key={p.scansKey} className="bg-accent/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3">{p.plan}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("admin.settings.faceScans")}</label>
                  <input value={credits[p.scansKey] || ""} onChange={(e) => setCredits({ ...credits, [p.scansKey]: e.target.value })} className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("admin.settings.chatCredits")}</label>
                  <input value={credits[p.chatsKey] || ""} onChange={(e) => setCredits({ ...credits, [p.chatsKey]: e.target.value })} className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground" />
                </div>
              </div>
            </div>
          ))}
          <button onClick={saveCredits} disabled={saving} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Save size={14} />{saving ? t("admin.settings.saving") : t("admin.settings.saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
