import { useNavigate, useLocation } from "react-router-dom";
import { Home, ScanFace, FileText, UserRound } from "lucide-react";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import ProfilePopover from "@/components/ProfilePopover";
import { isAuthenticated } from "@/lib/auth";

const navItems = [
  { icon: Home, label: "Home", id: "home", path: "/dashboard" },
  { icon: null, label: "Ask Cira", id: "chat", path: "/chat" },
  { icon: ScanFace, label: "Scan", id: "scan", path: "/vitals-scan" },
  { icon: FileText, label: "Reports", id: "reports", path: "/reports" },
  { icon: UserRound, label: "Doctor", id: "doctor", path: "/doctor" },
];

const routeToId: Record<string, string> = {
  "/dashboard": "home",
  "/chat": "chat",
  "/vitals-scan": "scan",
  "/reports": "reports",
  "/doctor": "doctor",
  "/profile": "profile",
};

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loggedIn = isAuthenticated();
  const activeId = routeToId[location.pathname] || "";

  // Replace last item with Profile when logged in
  const items = loggedIn
    ? navItems.slice(0, 4).concat({ icon: UserRound, label: "Profile", id: "profile", path: "/profile" })
    : navItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 px-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', backgroundColor: 'rgba(255,255,255,0.95)', WebkitBackdropFilter: 'blur(20px)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive = activeId === item.id;
          const Icon = item.icon;

          // Profile item with popover
          if (item.id === "profile") {
            return (
              <ProfilePopover key={item.id}>
                <button
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px] ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95"
                  }`}
                >
                  <UserRound size={20} strokeWidth={isActive ? 2.2 : 1.5} />
                  <span className={`text-[9px] font-medium leading-none ${isActive ? "font-semibold" : ""}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="w-4 h-0.5 rounded-full bg-primary mt-0.5" />
                  )}
                </button>
              </ProfilePopover>
            );
          }

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
