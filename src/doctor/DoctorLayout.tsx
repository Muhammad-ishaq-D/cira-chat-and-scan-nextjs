import { useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, ClipboardList, History, User, LogOut, Stethoscope } from "lucide-react";
import { doctorAuth } from "@/lib/doctorApi";
import ciraLogo from "@/assets/cira-logo.svg";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", id: "overview", path: "/doctor/dashboard" },
  { icon: ClipboardList, label: "Pending", id: "pending", path: "/doctor/pending" },
  { icon: History, label: "History", id: "history", path: "/doctor/history" },
  { icon: User, label: "Profile", id: "profile", path: "/doctor/profile" },
];

const DoctorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = doctorAuth.current();

  useEffect(() => {
    if (!doctorAuth.isAuthenticated()) navigate("/doctor/login");
  }, [navigate]);

  const handleLogout = () => {
    doctorAuth.logout();
    navigate("/doctor/login");
  };

  const activeId = navItems.find((n) => location.pathname.startsWith(n.path))?.id || "overview";
  const initials = (doctor?.name || "Dr").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex bg-background" style={{ height: "100dvh" }}>
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-2">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="flex items-center gap-1 mb-4">
          <Stethoscope size={10} className="text-primary" />
          <span className="text-[8px] font-semibold text-primary uppercase tracking-wider">Doctor</span>
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
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
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
            <span className="text-[9px] font-medium leading-none">Logout</span>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium ring-2 ring-primary/20">
            {initials}
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 px-4 py-3 flex items-center justify-between" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-base font-semibold text-foreground">Doctor</span>
          <Stethoscope size={12} className="text-primary" />
        </div>
        <button onClick={handleLogout} className="text-xs text-muted-foreground hover:text-foreground">Logout</button>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="relative z-10 pt-16 md:pt-0 pb-20 md:pb-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-white/95 backdrop-blur-md" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="flex items-center justify-around py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.5} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DoctorLayout;
