import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, LogOut, Pill, ScanFace, Sparkles, FileText } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import PrescriptionRefillChat from "@/components/PrescriptionRefillChat";
import { getUser, logout } from "@/lib/auth";

const DashboardPrescriptionRefill = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localUser = getUser();
  const initials =
    localUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const [showForm, setShowForm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { icon: Home, id: "home", tKey: "dashboard.nav.home", path: "/dashboard" },
    { icon: Sparkles, id: "chat", tKey: "dashboard.nav.askCira", path: "/chat" },
    { icon: Pill, id: "rx", tKey: "dashboard.nav.prescriptionRefill", path: "/dashboard/prescription-refill" },
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

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 pb-24 md:pb-8">

          {/* Start page layout */}
          <div className="text-center mb-10">
            {/* Pill icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
              <Pill className="w-7 h-7 text-primary" />
            </div>

            {/* Title */}
            <h1
              className="font-heading text-3xl md:text-4xl leading-[1.1] text-foreground mb-3"
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              {t("pages.prescriptionRefill.startTitle")}
            </h1>

            {/* Subtitle / Powered by badge */}
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="inline-block text-[10px] uppercase tracking-[0.15em] text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
                {t("pages.prescriptionRefill.startSubtitle")}
              </span>
            </div>

            {/* Main CTA */}
            <button
              onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:opacity-90 transition-opacity shadow-sm"
            >
              {t("pages.prescriptionRefill.startCta")}
            </button>

            {/* Trust text */}
            <div className="mt-6 space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("pages.prescriptionRefill.price")}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {t("pages.prescriptionRefill.refund")}
              </p>
            </div>
          </div>

          {/* Refill History (dashboard only) */}
          <div className="border-t border-border pt-8">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 text-center">
              {t("pages.prescriptionRefill.historyTitle")}
            </h2>
            <div className="rounded-2xl border border-border/60 bg-card/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("pages.prescriptionRefill.historyEmpty")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default DashboardPrescriptionRefill;
