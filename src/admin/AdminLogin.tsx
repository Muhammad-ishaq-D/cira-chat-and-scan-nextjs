import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "cira@2024";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem("cira_admin", "true");
      navigate("/admin/dashboard");
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={ciraLogo} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>
        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
          <h1 className="font-heading text-xl font-semibold text-foreground text-center mb-1">Admin Login</h1>
          <p className="text-xs text-muted-foreground text-center mb-6">Super Admin Access</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Username</label>
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                className="w-full py-2.5 px-3 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Password</label>
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
