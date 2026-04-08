import { useState } from "react";
import { Search, Ban, CreditCard, ChevronDown, Eye, Edit3, Trash2, Plus, Filter, Download, Mail, ScanFace, MessageSquare, Calendar, MapPin, Smartphone } from "lucide-react";

interface User {
  id: number;
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

const mockUsers: User[] = [
  { id: 1, name: "Priya Sharma", email: "priya@example.com", phone: "+91 98765 43210", plan: "Pro", credits: 8500, scans: 12, chats: 340, status: "active", joined: "2024-12-01", lastActive: "2 min ago", location: "Mumbai, IN", device: "iPhone 15 Pro" },
  { id: 2, name: "Rahul Verma", email: "rahul@example.com", phone: "+91 87654 32109", plan: "Free", credits: 100000, scans: 2, chats: 28, status: "active", joined: "2025-01-15", lastActive: "1 hr ago", location: "Delhi, IN", device: "Samsung S24" },
  { id: 3, name: "Anita Das", email: "anita@example.com", phone: "+91 76543 21098", plan: "Enterprise", credits: 50000, scans: 45, chats: 1280, status: "active", joined: "2024-10-20", lastActive: "5 min ago", location: "Bangalore, IN", device: "Pixel 8" },
  { id: 4, name: "Vikram Singh", email: "vikram@example.com", phone: "+91 65432 10987", plan: "Pro", credits: 0, scans: 8, chats: 156, status: "suspended", joined: "2024-11-05", lastActive: "3 days ago", location: "Pune, IN", device: "iPhone 14" },
  { id: 5, name: "Meera Patel", email: "meera@example.com", phone: "+91 54321 09876", plan: "Free", credits: 95000, scans: 1, chats: 12, status: "active", joined: "2025-03-10", lastActive: "12 min ago", location: "Ahmedabad, IN", device: "OnePlus 12" },
  { id: 6, name: "Arjun Reddy", email: "arjun@example.com", phone: "+91 43210 98765", plan: "Pro", credits: 22000, scans: 19, chats: 520, status: "active", joined: "2024-09-18", lastActive: "30 min ago", location: "Hyderabad, IN", device: "iPhone 15" },
  { id: 7, name: "Kavya Nair", email: "kavya@example.com", phone: "+91 32109 87654", plan: "Free", credits: 88000, scans: 0, chats: 5, status: "inactive", joined: "2025-02-20", lastActive: "14 days ago", location: "Chennai, IN", device: "Realme GT" },
  { id: 8, name: "Sanjay Gupta", email: "sanjay@example.com", phone: "+91 21098 76543", plan: "Pro", credits: 45000, scans: 31, chats: 890, status: "active", joined: "2024-08-12", lastActive: "8 min ago", location: "Kolkata, IN", device: "Samsung S23" },
];

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
  const [users, setUsers] = useState(mockUsers);
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = users.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = filterPlan === "all" || u.plan === filterPlan;
    const matchStatus = filterStatus === "all" || u.status === filterStatus;
    return matchSearch && matchPlan && matchStatus;
  });

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

  const changePlan = (id: number) => {
    const plan = prompt("Enter new plan (Free / Pro / Enterprise):");
    if (plan && ["Free", "Pro", "Enterprise"].includes(plan)) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, plan } : u)));
    }
  };

  const activeCount = users.filter((u) => u.status === "active").length;
  const proCount = users.filter((u) => u.plan === "Pro" || u.plan === "Enterprise").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Management</h1>
        <p className="text-sm text-muted-foreground font-body">{users.length} total users • {activeCount} active • {proCount} paid</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: "👥" },
          { label: "Active Now", value: activeCount, icon: "🟢" },
          { label: "Paid Users", value: proCount, icon: "💎" },
          { label: "Avg Credits", value: Math.round(users.reduce((a, u) => a + u.credits, 0) / users.length).toLocaleString(), icon: "🪙" },
        ].map((s) => (
          <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm">{s.icon}</span>
              <span className="text-[11px] text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none text-foreground"
          >
            <option value="all">All Plans</option>
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none text-foreground"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="px-3 py-2 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* User Cards (mobile) / Table (desktop) */}
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((u) => (
          <div key={u.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4" onClick={() => setSelectedUser(u)}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${statusBadge[u.status]}`}>
                {u.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${planBadge[u.plan]}`}>{u.plan}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-accent/30 rounded-lg py-1.5">
                <p className="text-xs font-semibold text-foreground">{u.credits.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Credits</p>
              </div>
              <div className="bg-accent/30 rounded-lg py-1.5">
                <p className="text-xs font-semibold text-foreground">{u.scans}</p>
                <p className="text-[9px] text-muted-foreground">Scans</p>
              </div>
              <div className="bg-accent/30 rounded-lg py-1.5">
                <p className="text-xs font-semibold text-foreground">{u.chats}</p>
                <p className="text-[9px] text-muted-foreground">Chats</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge[u.status]}`}>{u.status}</span>
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); addCredits(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><CreditCard size={14} className="text-muted-foreground" /></button>
                <button onClick={(e) => { e.stopPropagation(); changePlan(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit3 size={14} className="text-muted-foreground" /></button>
                <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Ban size={14} className="text-muted-foreground" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${statusBadge[u.status]}`}>
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-full ${planBadge[u.plan]}`}>{u.plan}</span></td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">{u.credits.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-foreground">{u.scans}</td>
                  <td className="px-4 py-3 text-right text-foreground">{u.chats}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{u.lastActive}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge[u.status]}`}>{u.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); addCredits(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Add credits"><CreditCard size={14} className="text-muted-foreground" /></button>
                      <button onClick={(e) => { e.stopPropagation(); changePlan(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Change plan"><Edit3 size={14} className="text-muted-foreground" /></button>
                      <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle status"><Ban size={14} className="text-muted-foreground" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Slide-over */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border-l border-border overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold ${statusBadge[selectedUser.status]}`}>
                    {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>

              {/* Status + Plan */}
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${planBadge[selectedUser.plan]}`}>{selectedUser.plan} Plan</span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusBadge[selectedUser.status]}`}>{selectedUser.status}</span>
              </div>

              {/* Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{selectedUser.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Smartphone size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{selectedUser.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{selectedUser.location}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-foreground">Joined {selectedUser.joined}</span>
                </div>
              </div>

              {/* Usage Stats */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usage</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <CreditCard size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.credits.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">Credits</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <ScanFace size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.scans}</p>
                    <p className="text-[10px] text-muted-foreground">Scans</p>
                  </div>
                  <div className="bg-accent/30 rounded-xl p-3 text-center">
                    <MessageSquare size={16} className="mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.chats}</p>
                    <p className="text-[10px] text-muted-foreground">Chats</p>
                  </div>
                </div>
              </div>

              {/* Device */}
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Device</h3>
                <p className="text-sm text-foreground">{selectedUser.device}</p>
                <p className="text-xs text-muted-foreground">Last active: {selectedUser.lastActive}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <button onClick={() => addCredits(selectedUser.id)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm text-foreground">
                  <CreditCard size={16} className="text-muted-foreground" /> Add Credits
                </button>
                <button onClick={() => changePlan(selectedUser.id)} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm text-foreground">
                  <Edit3 size={16} className="text-muted-foreground" /> Change Plan
                </button>
                <button onClick={() => { toggleStatus(selectedUser.id); setSelectedUser(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-accent transition-colors text-sm text-red-500">
                  <Ban size={16} /> {selectedUser.status === "active" ? "Suspend User" : "Activate User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
