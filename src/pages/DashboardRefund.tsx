import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, LogOut, Pill, ScanFace, Sparkles, FileText, RefreshCw, ArrowLeft } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import RefundRequestForm, { type RefillRecord } from "@/components/RefundRequestForm";
import { getUser, logout } from "@/lib/auth";

function loadHistory(): RefillRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("cira_refill_history");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const DashboardRefund = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const localUser = getUser();
  const initials =
    localUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const [history, setHistory] = useState<RefillRecord[]>([]);
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const refParam = (params.get("ref") || "").trim();
  const [selectedRef, setSelectedRef] = useState<string>(refParam);

  const refill = useMemo<RefillRecord | null>(() => {
    if (!history.length) return null;
    if (selectedRef) {
      return history.find((r) => r.ref === selectedRef) || null;
    }
    return history[0] ?? null;
  }, [history, selectedRef]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { icon: Home, id: "home", tKey: "dashboard.nav.home", path: "/dashboard" },
    { icon: Sparkles, id: "chat", tKey: "dashboard.nav.askCira", path: "/chat" },
    { icon: Pill, id: "rx", tKey: "dashboard.nav.prescriptionRefill", path: "/prescription-refill" },
    { icon: ScanFace, id: "scan", tKey: "dashboard.nav.scan", path: "/vitals-scan" },
    { icon: FileText, id: "reports", tKey: "dashboard.nav.reports", path: "/reports" },
  ];
  const activeNav = "rx";

  return (
    <div className="flex bg-background" style={{ height: "100dvh" }}>
      {/* Sidebar */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-6">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} active={isActive} />
                ) : (
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-body font-medium leading-none text-center">
                  {t(item.tKey)}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={handleLogout}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">
              {t("dashboard.nav.logout")}
            </span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20 overflow-hidden">
              {localUser?.avatar ? (
                <img src={localUser.avatar} alt={localUser?.name || "User"} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </ProfilePopover>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 md:pb-8">
          <button
            onClick={() => navigate("/prescription-refill")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> {t("pages.refund.backToRefills")}
          </button>

          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl leading-tight text-foreground">
              {t("pages.refund.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("pages.refund.subtitle")}
            </p>
          </header>

          {/* If multiple refills, allow picking */}
          {history.length > 1 && (
            <div className="mb-4">
              <label htmlFor="refund-ref" className="block text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                {t("pages.refund.selectRefillLabel")}
              </label>
              <select
                id="refund-ref"
                value={refill?.ref || ""}
                onChange={(e) => setSelectedRef(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: 16, minHeight: 48 }}
              >
                {history.map((h) => (
                  <option key={h.ref} value={h.ref}>
                    {h.ref} — {[h.drug, h.strength].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
            </div>
          )}

          <RefundRequestForm
            refill={refill}
            invalid={history.length === 0}
            backHref="/dashboard/prescription-refill"
          />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default DashboardRefund;
