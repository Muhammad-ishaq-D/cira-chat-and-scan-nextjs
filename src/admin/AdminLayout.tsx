import { useEffect } from "react";
import { useNavigate, Outlet, NavLink } from "react-router-dom";
import { Users, CreditCard, BarChart3, LogOut } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";

const links = [
  { to: "/admin/dashboard", icon: BarChart3, label: "Overview" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "/admin/billing", icon: CreditCard, label: "Billing" },
];

const AdminLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("cira_admin") !== "true") {
      navigate("/admin");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("cira_admin");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-card flex flex-col">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-lg font-semibold text-foreground">Admin</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent"
                }`
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-6 py-4 text-sm text-muted-foreground hover:text-destructive transition-colors border-t border-border"
        >
          <LogOut size={16} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
