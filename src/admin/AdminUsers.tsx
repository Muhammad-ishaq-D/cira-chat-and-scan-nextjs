import { useState, useEffect } from "react";
import { Search, Ban, CreditCard, Eye, Edit3, Download, Mail, ScanFace, MessageSquare, Calendar, MapPin, Smartphone, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  credits: number;
  scans: number;
  chats: number;
  status: string;
  joined: string;
  lastActive: string;
  location: string;
  device: string;
}

const planBadge: Record<string, string> = {
  Free: "bg-muted text-muted-foreground",
  Pro: "bg-primary/10 text-primary",
  Enterprise: "bg-amber-50 text-amber-600",
};

const statusBadge: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-600",
  suspended: "bg-red-50 text-red-500",
  inactive: "bg-muted text-muted-foreground",
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await adminApi.getUsers({ search, plan: filterPlan, status: filterStatus });
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (e: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [filterPlan, filterStatus]);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === "active") {
        await adminApi.suspendUser(id);
      } else {
        await adminApi.activateUser(id);
      }
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: currentStatus === "active" ? "suspended" : "active" } : u)));
      toast.success("User status updated");
    } catch (e: any) {
      toast.error(e.message || "Failed to update status");
    }
  };

  const addCredits = async (id: string) => {
    const amount = prompt("Enter credits to add:");
    if (amount && !isNaN(Number(amount))) {
      try {
        await adminApi.adjustCredits(id, Number(amount), "Admin adjustment");
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, credits: u.credits + Number(amount) } : u)));
        toast.success("Credits added");
      } catch (e: any) {
        toast.error(e.message || "Failed to add credits");
      }
    }
  };

  const changePlan = async (id: string) => {
    const plan = prompt("Enter new plan (Free / Pro / Enterprise):");
    if (plan && ["Free", "Pro", "Enterprise"].includes(plan)) {
      try {
        await adminApi.changeUserPlan(id, plan);
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
        toast.success("Plan updated");
      } catch (e: any) {
        toast.error(e.message || "Failed to change plan");
      }
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const proCount = users.filter((u) => u.plan === "Pro" || u.plan === "Enterprise").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Management</h1>
        <p className="text-sm text-muted-foreground font-body">{users.length} total users • {activeCount} active • {proCount} paid</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: "👥" },
          { label: "Active Now", value: activeCount, icon: "🟢" },
          { label: "Paid Users", value: proCount, icon: "💎" },
          { label: "Avg Credits", value: users.length ? Math.round(users.reduce((a, u) => a + (u.credits || 0), 0) / users.length).toLocaleString() : "0", icon: "🪙" },
        ].map((s) => (
          <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span className="text-sm">{s.icon}</span><span className="text-[11px] text-muted-foreground">{s.label}</span></div>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2">
          <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-3 py-2 rounded-xl border border-border/50 bg-card/80 text-sm outline-none text-foreground">
            <option value="all">All Plans</option><option value="Free">Free</option><option value="Pro">Pro</option><option value="Enterprise">Enterprise</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-border/50 bg-card/80 text-sm outline-none text-foreground">
            <option value="all">All Status</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">User</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Plan</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Credits</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Scans</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Chats</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Last Active</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${statusBadge[u.status] || "bg-muted text-muted-foreground"}`}>
                            {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div><p className="font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planBadge[u.plan] || "bg-muted text-muted-foreground"}`}>{u.plan}</span></td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">{(u.credits || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-foreground">{u.scans || 0}</td>
                      <td className="px-4 py-3 text-right text-foreground">{u.chats || 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastActive || u.last_active || "—"}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge[u.status] || "bg-muted text-muted-foreground"}`}>{u.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); addCredits(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Add credits"><CreditCard size={14} className="text-muted-foreground" /></button>
                          <button onClick={(e) => { e.stopPropagation(); changePlan(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Change plan"><Edit3 size={14} className="text-muted-foreground" /></button>
                          <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id, u.status); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle status"><Ban size={14} className="text-muted-foreground" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4" onClick={() => setSelectedUser(u)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${statusBadge[u.status] || "bg-muted text-muted-foreground"}`}>
                    {u.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${planBadge[u.plan] || "bg-muted text-muted-foreground"}`}>{u.plan}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-accent/30 rounded-lg py-1.5"><p className="text-xs font-semibold text-foreground">{(u.credits || 0).toLocaleString()}</p><p className="text-[9px] text-muted-foreground">Credits</p></div>
                  <div className="bg-accent/30 rounded-lg py-1.5"><p className="text-xs font-semibold text-foreground">{u.scans || 0}</p><p className="text-[9px] text-muted-foreground">Scans</p></div>
                  <div className="bg-accent/30 rounded-lg py-1.5"><p className="text-xs font-semibold text-foreground">{u.chats || 0}</p><p className="text-[9px] text-muted-foreground">Chats</p></div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge[u.status] || "bg-muted text-muted-foreground"}`}>{u.status}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); addCredits(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><CreditCard size={14} className="text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); changePlan(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit3 size={14} className="text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id, u.status); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Ban size={14} className="text-muted-foreground" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User Detail Slide-over */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${statusBadge[selectedUser.status] || "bg-muted text-muted-foreground"}`}>
                    {selectedUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${planBadge[selectedUser.plan] || "bg-muted text-muted-foreground"}`}>{selectedUser.plan} Plan</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadge[selectedUser.status] || "bg-muted text-muted-foreground"}`}>{selectedUser.status}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm"><Mail size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.email}</span></div>
                {selectedUser.phone && <div className="flex items-center gap-3 text-sm"><Smartphone size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.phone}</span></div>}
                {selectedUser.location && <div className="flex items-center gap-3 text-sm"><MapPin size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.location}</span></div>}
                <div className="flex items-center gap-3 text-sm"><Calendar size={14} className="text-muted-foreground" /><span className="text-foreground">Joined {selectedUser.joined}</span></div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usage</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <CreditCard size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{(selectedUser.credits || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Credits</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <ScanFace size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.scans || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Scans</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <MessageSquare size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.chats || 0}</p>
                    <p className="text-[10px] text-muted-foreground">Chats</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => addCredits(selectedUser.id)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2"><CreditCard size={14} />Add Credits</button>
                <button onClick={() => toggleStatus(selectedUser.id, selectedUser.status)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2"><Ban size={14} />{selectedUser.status === "active" ? "Suspend" : "Activate"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
