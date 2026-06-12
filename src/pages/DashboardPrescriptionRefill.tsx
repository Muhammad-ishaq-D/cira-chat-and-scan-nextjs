import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, LogOut, Pill, ScanFace, Sparkles, FileText } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getUser, logout } from "@/lib/auth";
import { toast } from "@/hooks/use-toast";

const DashboardPrescriptionRefill = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localUser = getUser();
  const initials =
    localUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const [medication, setMedication] = useState("");
  const [dosage, setDosage] = useState("");
  const [pharmacy, setPharmacy] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: t("pages.prescriptionRefill.requestSubmittedTitle"),
        description: t("pages.prescriptionRefill.requestSubmittedDesc"),
      });
      setMedication("");
      setDosage("");
      setPharmacy("");
      setNotes("");
    }, 800);
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
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1
                className="text-2xl font-semibold text-foreground"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {t("pages.prescriptionRefill.dashTitle")}
              </h1>
              <p className="text-sm text-muted-foreground font-body">
                {t("pages.prescriptionRefill.dashSubtitle")}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("pages.prescriptionRefill.fieldMedication")}
              </label>
              <input
                type="text"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                required
                placeholder={t("pages.prescriptionRefill.placeholderMedication")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("pages.prescriptionRefill.fieldDosage")}
              </label>
              <input
                type="text"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder={t("pages.prescriptionRefill.placeholderDosage")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("pages.prescriptionRefill.fieldPharmacy")}
              </label>
              <input
                type="text"
                value={pharmacy}
                onChange={(e) => setPharmacy(e.target.value)}
                placeholder={t("pages.prescriptionRefill.placeholderPharmacy")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t("pages.prescriptionRefill.fieldNotes")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder={t("pages.prescriptionRefill.placeholderNotes")}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-base focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || !medication.trim()}
                className="flex-1 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {submitting
                  ? t("common.saving")
                  : t("pages.prescriptionRefill.submitRequest")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/chat")}
                className="px-6 py-3 rounded-full border border-border text-foreground font-medium hover:bg-accent/60 transition-colors"
              >
                {t("pages.prescriptionRefill.askCiraFirst")}
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              {t("pages.prescriptionRefill.disclaimer")}
            </p>
          </form>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default DashboardPrescriptionRefill;
