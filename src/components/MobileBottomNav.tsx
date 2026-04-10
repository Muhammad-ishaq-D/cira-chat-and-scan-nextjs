import { useNavigate, useLocation } from "react-router-dom";
import { Home, ScanFace, FileText, UserRound } from "lucide-react";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import { getUser } from "@/lib/auth";

const navItems = [
  { icon: Home, label: "Home", id: "home", path: "/dashboard" },
  { icon: null, label: "Ask Cira", id: "chat", path: "/chat" },
  { icon: ScanFace, label: "Scan", id: "scan", path: "/vitals-scan" },
  { icon: FileText, label: "Reports", id: "reports", path: "/reports" },
  { icon: UserRound, label: "Profile", id: "profile", path: "/profile" },
];

const routeToId: Record<string, string> = {
  "/dashboard": "home",
  "/chat": "chat",
  "/vitals-scan": "scan",
  "/reports": "reports",
  "/profile": "profile",
};

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeId = routeToId[location.pathname] || "";
  const user = getUser();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', backgroundColor: 'rgba(255,255,255,0.95)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:scale-95"
              }`}
            >
              {item.id === "chat" ? (
                <AiSparkleIcon size={20} active={isActive} />
              ) : item.id === "profile" && user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile"
                  className={`w-5 h-5 rounded-full object-cover ring-1 ${isActive ? "ring-primary" : "ring-border"}`}
                />
              ) : Icon ? (
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.5} />
              ) : null}
              <span className={`text-[9px] font-medium leading-none ${isActive ? "font-semibold" : ""}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 rounded-full bg-primary mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
