import { useState } from "react";
import { Search, MoreHorizontal, Ban, CreditCard } from "lucide-react";

const mockUsers = [
  { id: 1, name: "Priya Sharma", email: "priya@example.com", plan: "Pro", credits: 8500, scans: 12, status: "active", joined: "2024-12-01" },
  { id: 2, name: "Rahul Verma", email: "rahul@example.com", plan: "Free", credits: 100000, scans: 2, status: "active", joined: "2025-01-15" },
  { id: 3, name: "Anita Das", email: "anita@example.com", plan: "Enterprise", credits: 50000, scans: 45, status: "active", joined: "2024-10-20" },
  { id: 4, name: "Vikram Singh", email: "vikram@example.com", plan: "Pro", credits: 0, scans: 8, status: "suspended", joined: "2024-11-05" },
  { id: 5, name: "Meera Patel", email: "meera@example.com", plan: "Free", credits: 95000, scans: 1, status: "active", joined: "2025-03-10" },
  { id: 6, name: "Arjun Reddy", email: "arjun@example.com", plan: "Pro", credits: 22000, scans: 19, status: "active", joined: "2024-09-18" },
];

const planBadge: Record<string, string> = {
  Free: "bg-muted text-muted-foreground",
  Pro: "bg-primary/10 text-primary",
  Enterprise: "bg-amber-50 text-amber-600",
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(mockUsers);

  const filtered = users.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = (id: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
  };

  const addCredits = (id: number) => {
    const amount = prompt("Enter credits to add:");
    if (amount && !isNaN(Number(amount))) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, credits: u.credits + Number(amount) } : u)));
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-foreground">Users</h1>
        <span className="text-sm text-muted-foreground">{users.length} total</span>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credits</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Scans</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planBadge[u.plan] || ""}`}>{u.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{u.credits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-foreground">{u.scans}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => addCredits(u.id)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Add credits">
                        <CreditCard size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => toggleStatus(u.id)} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle status">
                        <Ban size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
