import { useState, useEffect } from "react";
import { Search, Ban, CreditCard, Edit3, Mail, Calendar, Loader2, CheckCircle, Wallet, Crown, Zap, Star, Check, X, Coins, AlertTriangle } from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface PlanOption {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  credits: number;
  popular?: boolean;
  features: string[];
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: "Pro",
    name: "Pro",
    price: "$29.99",
    period: "/mo",
    desc: "Advanced monitoring for health-conscious individuals",
    credits: 500000,
    popular: true,
    features: [
      "20 Face Scans / month",
      "500,000 Chat Credits",
      "All Vital Signs + Trends",
      "Detailed Health Indices",
      "3 Doctor Consults",
      "Export Reports (PDF)",
      "Priority Support",
    ],
  },
  {
    id: "Enterprise",
    name: "Enterprise",
    price: "$99.99",
    period: "/mo",
    desc: "Complete health intelligence for professionals",
    credits: 2000000,
    features: [
      "Unlimited Face Scans",
      "Unlimited Chat Credits",
      "10 Doctor Consults",
      "Advanced AI Diagnostics",
      "Priority Support",
      "All Reports",
      "HIPAA Compliance",
    ],
  },
];

interface RawUser {
  id: string | number;
  name?: string;
  full_name?: string;
  email?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  is_suspended?: number | boolean | null;
  suspended?: number | boolean | null;
  status?: string | null;
  plan?: string | null;
  plan_tier?: string | null;
  plan_name?: string | null;
  tier?: string | null;
  credits?: number | { balance?: number; remaining?: number; total?: number } | null;
  credits_balance?: number | null;
  credits_remaining?: number | null;
  balance?: number | null;
  created_at?: string;
  createdAt?: string;
  joined_at?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  is_suspended: number;
  plan: string;
  credits: number;
  created_at: string;
}

const normalizeUser = (raw: RawUser): User => {
  const id = String(raw.id ?? "");
  const name = raw.name || raw.full_name || raw.email || "Unnamed";
  const email = raw.email || "";
  const avatar = (raw.avatar ?? raw.avatar_url) || null;

  // Suspension can come as 0/1, true/false, or status string
  let suspended = 0;
  if (raw.is_suspended === true || raw.is_suspended === 1 || (raw.is_suspended as any) === "1") suspended = 1;
  else if (raw.suspended === true || raw.suspended === 1 || (raw.suspended as any) === "1") suspended = 1;
  else if (typeof raw.status === "string" && /suspend|inactive|disabled|banned/i.test(raw.status)) suspended = 1;

  const plan =
    raw.plan_tier || raw.plan || raw.plan_name || raw.tier || "Free";

  // Credits can be number, object, or alt fields
  let credits = 0;
  if (typeof raw.credits === "number") credits = raw.credits;
  else if (raw.credits && typeof raw.credits === "object") {
    credits = raw.credits.balance ?? raw.credits.remaining ?? raw.credits.total ?? 0;
  } else if (typeof raw.credits_balance === "number") credits = raw.credits_balance;
  else if (typeof raw.credits_remaining === "number") credits = raw.credits_remaining;
  else if (typeof raw.balance === "number") credits = raw.balance;

  const created_at = raw.created_at || raw.createdAt || raw.joined_at || "";

  return { id, name, email, avatar, is_suspended: suspended, plan: String(plan), credits, created_at };
};

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planModalUser, setPlanModalUser] = useState<User | null>(null);
  const [applyingPlan, setApplyingPlan] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data: any = await adminApi.getUsers();
      const list: RawUser[] = Array.isArray(data) ? data : (data?.users || data?.data || []);
      setUsers(list.map(normalizeUser));
    } catch (e: any) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (id: string, isSuspended: number) => {
    try {
      if (isSuspended === 0) {
        await adminApi.suspendUser(id);
      } else {
        await adminApi.activateUser(id);
      }
      const next = isSuspended === 0 ? 1 : 0;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_suspended: next } : u)));
      if (selectedUser?.id === id) setSelectedUser(prev => prev ? { ...prev, is_suspended: next } : null);
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
        toast.success("Credits added");
        loadUsers();
      } catch (e: any) {
        toast.error(e.message || "Failed to add credits");
      }
    }
  };

  const openPlanModal = (user: User) => {
    setPlanModalUser(user);
  };

  const applyPlan = async (plan: PlanOption) => {
    if (!planModalUser) return;
    setApplyingPlan(plan.id);
    try {
      await adminApi.changeUserPlan(planModalUser.id, plan.id);
      try {
        await adminApi.adjustCredits(planModalUser.id, plan.credits, `Plan upgrade to ${plan.name}`);
      } catch (e: any) {
        // plan changed but credits failed — surface but continue
        toast.error(e.message || "Plan changed but credits not added");
      }
      const newCredits = planModalUser.credits + plan.credits;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === planModalUser.id ? { ...u, plan: plan.id, credits: newCredits } : u,
        ),
      );
      if (selectedUser?.id === planModalUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, plan: plan.id, credits: newCredits } : null));
      }
      toast.success(`Plan changed to ${plan.name}`);
      setPlanModalUser(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to change plan");
    } finally {
      setApplyingPlan(null);
    }
  };

  const activeCount = users.filter((u) => u.is_suspended === 0).length;
  const suspendedCount = users.filter((u) => u.is_suspended === 1).length;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return "—"; }
  };

  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const planBadgeClass = (plan: string) => {
    const p = plan.toLowerCase();
    if (p.includes("enterprise")) return "bg-purple-50 text-purple-600";
    if (p.includes("pro")) return "bg-blue-50 text-blue-600";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Management</h1>
        <p className="text-sm text-muted-foreground font-body">{users.length} total • {activeCount} active • {suspendedCount} suspended</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: users.length, icon: "👥" },
          { label: "Active", value: activeCount, icon: "🟢" },
          { label: "Suspended", value: suspendedCount, icon: "🔴" },
        ].map((s) => (
          <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span className="text-sm">{s.icon}</span><span className="text-[11px] text-muted-foreground">{s.label}</span></div>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/30" />
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">Joined</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-border/30 last:border-0 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                              {getInitials(u.name)}
                            </div>
                          )}
                          <div><p className="font-medium text-foreground">{u.name}</p><p className="text-xs text-muted-foreground">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${planBadgeClass(u.plan)}`}>{u.plan}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground">${u.credits.toFixed(2)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.is_suspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                          {u.is_suspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openPlanModal(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Change plan"><Edit3 size={14} className="text-muted-foreground" /></button>
                          <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id, u.is_suspended); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle status">
                            {u.is_suspended ? <CheckCircle size={14} className="text-emerald-600" /> : <Ban size={14} className="text-muted-foreground" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((u) => (
              <div key={u.id} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4" onClick={() => setSelectedUser(u)}>
                <div className="flex items-center gap-3 mb-3">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                      {getInitials(u.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground truncate">{u.name}</p><p className="text-xs text-muted-foreground truncate">{u.email}</p></div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.is_suspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                    {u.is_suspended ? "Suspended" : "Active"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${planBadgeClass(u.plan)}`}>{u.plan}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground font-medium">${u.credits.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">Joined {formatDate(u.created_at)}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openPlanModal(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit3 size={14} className="text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleStatus(u.id, u.is_suspended); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                      {u.is_suspended ? <CheckCircle size={14} className="text-emerald-600" /> : <Ban size={14} className="text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-card/80 border border-border/50 rounded-xl p-8 text-center text-sm text-muted-foreground">No users found</div>
            )}
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
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt={selectedUser.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                      {getInitials(selectedUser.name)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{selectedUser.name}</h2>
                    <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
              </div>
              <div className="flex gap-2">
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${selectedUser.is_suspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                  {selectedUser.is_suspended ? "Suspended" : "Active"}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${planBadgeClass(selectedUser.plan)}`}>{selectedUser.plan}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm"><Mail size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.email}</span></div>
                <div className="flex items-center gap-3 text-sm"><Wallet size={14} className="text-muted-foreground" /><span className="text-foreground">${selectedUser.credits.toFixed(2)} credits</span></div>
                <div className="flex items-center gap-3 text-sm"><Crown size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.plan} plan</span></div>
                <div className="flex items-center gap-3 text-sm"><Calendar size={14} className="text-muted-foreground" /><span className="text-foreground">Joined {formatDate(selectedUser.created_at)}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openPlanModal(selectedUser)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2"><Edit3 size={14} />Change Plan</button>
                <button onClick={() => toggleStatus(selectedUser.id, selectedUser.is_suspended)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2">
                  {selectedUser.is_suspended ? <><CheckCircle size={14} />Activate</> : <><Ban size={14} />Suspend</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {planModalUser && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => !applyingPlan && setPlanModalUser(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Change Plan</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    For <span className="font-medium text-foreground">{planModalUser.name}</span> · Current: <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${planBadgeClass(planModalUser.plan)}`}>{planModalUser.plan}</span> · Credits: <span className="font-medium text-foreground">${planModalUser.credits.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  onClick={() => !applyingPlan && setPlanModalUser(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-accent transition-colors"
                  disabled={!!applyingPlan}
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-muted-foreground mb-5">Selecting a plan will change the user's plan and add the plan's credits to their existing balance.</p>

              <div className="grid md:grid-cols-2 gap-4">
                {PLAN_OPTIONS.map((plan) => {
                  const Icon = plan.id === "Pro" ? Zap : Crown;
                  const isCurrent = planModalUser.plan.toLowerCase() === plan.id.toLowerCase();
                  const isApplying = applyingPlan === plan.id;
                  return (
                    <div key={plan.id} className={`relative bg-background/60 border rounded-2xl p-5 transition-all ${plan.popular ? "border-primary/40 ring-2 ring-primary/10" : "border-border/60"}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Star size={10} /> Most Popular
                          </span>
                        </div>
                      )}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${plan.id === "Pro" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-600"}`}>
                        <Icon size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.price}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mb-3">
                        Adds <span className="font-medium text-foreground">+${plan.credits.toLocaleString()}</span> credits
                      </div>
                      <ul className="space-y-2 mb-5">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                            <Check size={13} className="text-emerald-500 mt-0.5 shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                      <button
                        onClick={() => applyPlan(plan)}
                        disabled={!!applyingPlan || isCurrent}
                        className={`w-full h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                          isCurrent
                            ? "bg-secondary text-muted-foreground cursor-default"
                            : plan.popular
                              ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                              : "border border-border/60 text-foreground hover:bg-accent"
                        } disabled:opacity-60`}
                      >
                        {isApplying ? <><Loader2 size={14} className="animate-spin" />Applying...</> : isCurrent ? "Current Plan" : `Select ${plan.name}`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
