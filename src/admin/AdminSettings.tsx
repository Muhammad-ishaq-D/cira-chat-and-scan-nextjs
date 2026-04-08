import { useState } from "react";
import { Shield, Bell, Mail, Globe, Database, Key, Save, Server, Palette, Lock, ToggleLeft, ToggleRight } from "lucide-react";

interface SettingToggle {
  label: string;
  description: string;
  enabled: boolean;
  key: string;
}

const AdminSettings = () => {
  const [toggles, setToggles] = useState<SettingToggle[]>([
    { label: "User Registration", description: "Allow new users to sign up", enabled: true, key: "registration" },
    { label: "Email Verification", description: "Require email verification on signup", enabled: true, key: "emailVerify" },
    { label: "Free Tier", description: "Enable free plan for new users", enabled: true, key: "freeTier" },
    { label: "Face Scan", description: "Enable face scan feature for all users", enabled: true, key: "faceScan" },
    { label: "AI Chat", description: "Enable AI chat functionality", enabled: true, key: "aiChat" },
    { label: "Doctor Booking", description: "Enable doctor booking feature", enabled: true, key: "doctorBooking" },
    { label: "Maintenance Mode", description: "Show maintenance page to all users", enabled: false, key: "maintenance" },
    { label: "Debug Logging", description: "Enable verbose logging for debugging", enabled: false, key: "debugLog" },
  ]);

  const toggle = (key: string) => {
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t)));
  };

  const [credits, setCredits] = useState({
    freeScans: "2",
    freeChatCredits: "100000",
    proScans: "50",
    proChatCredits: "500000",
    enterpriseScans: "Unlimited",
    enterpriseChatCredits: "Unlimited",
  });

  const [apiKeys] = useState([
    { name: "OpenAI API Key", masked: "sk-...4x8B", status: "active" },
    { name: "Razorpay Key", masked: "rzp_...m9K2", status: "active" },
    { name: "Twilio SID", masked: "AC...f3E1", status: "active" },
    { name: "SendGrid API Key", masked: "SG...7pQ9", status: "expired" },
  ]);

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
          {toggles.map((t) => (
            <div key={t.key} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div>
                <p className="text-sm font-medium text-foreground">{t.label}</p>
                <p className="text-xs text-muted-foreground">{t.description}</p>
              </div>
              <button onClick={() => toggle(t.key)} className="shrink-0">
                {t.enabled ? (
                  <ToggleRight size={28} className="text-primary" />
                ) : (
                  <ToggleLeft size={28} className="text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Configuration */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Database size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Credit Limits</h2>
        </div>
        <div className="space-y-4">
          {[
            { plan: "Free", scansKey: "freeScans" as const, chatsKey: "freeChatCredits" as const },
            { plan: "Pro", scansKey: "proScans" as const, chatsKey: "proChatCredits" as const },
            { plan: "Enterprise", scansKey: "enterpriseScans" as const, chatsKey: "enterpriseChatCredits" as const },
          ].map((p) => (
            <div key={p.plan} className="bg-accent/20 rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3">{p.plan} Plan</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Face Scans</label>
                  <input
                    value={credits[p.scansKey]}
                    onChange={(e) => setCredits({ ...credits, [p.scansKey]: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Chat Credits</label>
                  <input
                    value={credits[p.chatsKey]}
                    onChange={(e) => setCredits({ ...credits, [p.chatsKey]: e.target.value })}
                    className="w-full py-2 px-3 rounded-lg border border-border/50 bg-card text-sm outline-none focus:ring-2 focus:ring-primary/30 text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Key size={16} className="text-primary" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>API Keys</h2>
        </div>
        <div className="space-y-2">
          {apiKeys.map((k) => (
            <div key={k.name} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <Lock size={14} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.masked}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${k.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                {k.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Info */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>System Info</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { label: "Version", value: "1.4.2" },
            { label: "Environment", value: "Production" },
            { label: "Region", value: "ap-south-1 (Mumbai)" },
            { label: "Last Deploy", value: "Apr 8, 2026 09:15 AM" },
            { label: "Database", value: "PostgreSQL 16" },
            { label: "AI Model", value: "GPT-4o (OpenAI)" },
          ].map((i) => (
            <div key={i.label} className="flex justify-between py-2 border-b border-border/30">
              <span className="text-muted-foreground">{i.label}</span>
              <span className="font-medium text-foreground">{i.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
