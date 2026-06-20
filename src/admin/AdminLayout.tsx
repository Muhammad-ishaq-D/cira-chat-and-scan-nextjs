import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import i18n from "@/i18n";
import { Users, CreditCard, BarChart3, LogOut, Settings, Shield, Bell, FileText, Activity, Pill, BookOpen } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";

const navItems = [
  { icon: BarChart3,  key: "overview",             id: "overview",             path: "/admin/dashboard" },
  { icon: Users,      key: "users",                 id: "users",                path: "/admin/users" },
  { icon: Activity,   key: "activity",              id: "activity",             path: "/admin/activity" },
  { icon: CreditCard, key: "billing",               id: "billing",              path: "/admin/billing" },
  { icon: Pill,       key: "prescriptionRefills",   id: "prescriptionRefills",  path: "/admin/prescription-refills" },
  { icon: BookOpen,   key: "referralLetters",       id: "referralLetters",      path: "/admin/referral-letters" },
  { icon: FileText,   key: "blogs",                 id: "blogs",                path: "/admin/blogs" },
  { icon: Settings,   key: "settings",              id: "settings",             path: "/admin/settings" },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const t = i18n.getFixedT("en");

  useEffect(() => {
    if (localStorage.getItem("cira_admin") !== "true" || !localStorage.getItem("cira_admin_token")) {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("cira_admin");
    localStorage.removeItem("cira_admin_token");
    navigate("/admin");
  };

  const activeId = navItems.find((n) => location.pathname.startsWith(n.path))?.id || "overview";

  return (
    <div className="flex bg-background" style={{ height: "100dvh" }}>
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-2">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="flex items-center gap-1 mb-4">
          <Shield size={10} className="text-primary" />
          <span className="text-[8px] font-semibold text-primary uppercase tracking-wider">{t("admin.nav.admin")}</span>
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
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
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-body font-medium leading-none">{t(`admin.nav.${item.key}`)}</span>
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
            <span className="text-[9px] font-body font-medium leading-none">{t("admin.nav.logout")}</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body ring-2 ring-primary/20">
            SA
          </div>
        </div>
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-base font-semibold text-foreground">{t("admin.nav.admin")}</span>
          <Shield size={12} className="text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-lg bg-accent/50 flex items-center justify-center">
            <Bell size={16} className="text-muted-foreground" />
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-[10px] font-medium">
            SA
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="fixed inset-0 pointer-events-none md:left-[72px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 pt-16 md:pt-0">
          <Outlet />
        </div>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 px-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)", backgroundColor: "rgba(255,255,255,0.95)", WebkitBackdropFilter: "blur(20px)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                  isActive ? "text-primary" : "text-muted-foreground active:scale-95"
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className={`text-[9px] font-medium leading-none ${isActive ? "font-semibold" : ""}`}>{t(`admin.nav.${item.key}`)}</span>
                {isActive && <div className="w-4 h-0.5 rounded-full bg-primary mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminLayout;
