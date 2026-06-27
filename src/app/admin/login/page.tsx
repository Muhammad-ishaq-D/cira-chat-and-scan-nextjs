"use client";

import { useState } from "react";
import { useNavigate } from '@/lib/react-router-compat';
import i18n from "@/i18n";
import ciraLogo from "@/assets/cira-logo.svg";
import { toast } from "sonner";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://askainurse.com";

const AdminLogin = () => {
  const navigate = useNavigate();
  const t = i18n.getFixedT("en");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("admin.login.invalid"));
      }
      const data = await res.json();
      localStorage.setItem("cira_admin_token", data.token);
      localStorage.setItem("cira_admin", "true");
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || t("admin.login.failed"));
      toast.error(err.message || t("admin.login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={ciraLogo.src} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="font-heading text-xl font-semibold text-foreground text-center mb-1">{t("admin.login.title")}</h1>
          <p className="text-xs text-muted-foreground text-center mb-6">{t("admin.login.subtitle")}</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">{t("admin.login.username")}</label>
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">{t("admin.login.password")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? t("admin.login.signingIn") : t("admin.login.signIn")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
