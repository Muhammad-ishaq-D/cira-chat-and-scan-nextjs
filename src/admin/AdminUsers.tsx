import { useState, useEffect } from "react";
import i18n from "@/i18n";
import { Search, Ban, Edit3, Mail, Calendar, Loader2, CheckCircle, Crown, Zap, Shield, Star, Check, X, Coins, AlertTriangle, Trash2 } from "lucide-react";
import { adminApi, billingApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface PlanOption {
  id: string;
  name: string;
  price: string;
  period: string;
  desc: string;
  faceScans: number | string;
  chatCredits: number | string;
  popular?: boolean;
  features: string[];
}

const FALLBACK_PLANS: PlanOption[] = [
  {
    id: "basic", name: "Basic", price: "Free", period: "", desc: "Essential health insights",
    faceScans: 1, chatCredits: 100000, features: ["1 Face Scan", "100,000 Chat Credits"],
  },
  {
    id: "pro", name: "Pro", price: "$5.00", period: "/mo", desc: "Advanced monitoring",
    faceScans: 20, chatCredits: 500000, popular: true,
    features: ["20 Face Scans / month", "500,000 Chat Credits", "Priority Support"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "$10.00", period: "/mo", desc: "Complete health intelligence",
    faceScans: 99999, chatCredits: 999999999,
    features: ["Unlimited Face Scans", "Unlimited Chat Credits", "HIPAA Private"],
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
  pending_deletion?: number | boolean | null;
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
  pending_deletion: number;
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
  const pending_deletion = raw.pending_deletion === 1 || raw.pending_deletion === true || (raw.pending_deletion as any) === "1" ? 1 : 0;

  return { id, name, email, avatar, is_suspended: suspended, plan: String(plan), credits, created_at, pending_deletion };
};

const AdminUsers = () => {
  const t = i18n.getFixedT("en");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [planOptions, setPlanOptions] = useState<PlanOption[]>(FALLBACK_PLANS);
  const [planModalUser, setPlanModalUser] = useState<User | null>(null);
  const [applyingPlan, setApplyingPlan] = useState<string | null>(null);
  const [suspendConfirmUser, setSuspendConfirmUser] = useState<User | null>(null);
  const [suspending, setSuspending] = useState(false);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [confirming, setConfirming] = useState(false);

  const formatCredits = (n: number) =>
    `${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  const loadUsers = async () => {
    try {
      const data: any = await adminApi.getUsers();
      const list: RawUser[] = Array.isArray(data) ? data : (data?.users || data?.data || []);
      setUsers(list.map(normalizeUser));
    } catch (e: any) {
      toast.error(t("admin.users.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    billingApi.getPlans().then((raw: any) => {
      const data: any[] = Array.isArray(raw) ? raw : raw?.plans ?? [];
      if (!data.length) return;
      const mapped: PlanOption[] = data.map((p: any) => {
        const scans = p.face_scans ?? p.scan_limit ?? 0;
        const credits = p.chat_credits ?? p.chat_credit_limit ?? 0;
        const isUnlimitedScans = scans === -1 || String(scans).toLowerCase() === "unlimited";
        const isUnlimitedCredits = credits === -1 || String(credits).toLowerCase() === "unlimited";
        const price = p.price != null ? (Number(p.price) === 0 ? "Free" : `$${p.price}`) : "Free";
        return {
          id: p.name,
          name: p.name,
          price,
          period: Number(p.price) > 0 ? "/mo" : "",
          desc: p.description || p.name,
          faceScans: isUnlimitedScans ? "Unlimited" : Number(scans),
          chatCredits: isUnlimitedCredits ? "Unlimited" : Number(credits),
          popular: p.name?.toLowerCase() === "pro",
          features: [
            isUnlimitedScans ? "Unlimited Face Scans" : `${scans} Face Scan${scans !== 1 ? "s" : ""} / month`,
            isUnlimitedCredits ? "Unlimited Chat Credits" : `${Number(credits).toLocaleString()} Chat Credits`,
          ],
        };
      });
      setPlanOptions(mapped);
    }).catch(() => {});
  }, []);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_suspended === 0 && u.pending_deletion !== 1) ||
      (statusFilter === "suspended" && u.is_suspended === 1) ||
      (statusFilter === "pending_deletion" && u.pending_deletion === 1);
    return matchesSearch && matchesStatus;
  });

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
      toast.success(t("admin.users.statusUpdated"));
    } catch (e: any) {
      toast.error(e.message || t("admin.users.statusFailed"));
    }
  };

  const requestToggleStatus = (user: User) => {
    if (user.is_suspended === 0) {
      setSuspendConfirmUser(user);
    } else {
      toggleStatus(user.id, user.is_suspended);
    }
  };

  const confirmSuspend = async () => {
    if (!suspendConfirmUser) return;
    setSuspending(true);
    try {
      await toggleStatus(suspendConfirmUser.id, suspendConfirmUser.is_suspended);
      setSuspendConfirmUser(null);
    } finally {
      setSuspending(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmUser) return;
    setConfirming(true);
    try {
      await adminApi.confirmDeleteUser(deleteConfirmUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
      if (selectedUser?.id === deleteConfirmUser.id) setSelectedUser(null);
      toast.success(`${deleteConfirmUser.name}'s account has been permanently deleted.`);
      setDeleteConfirmUser(null);
    } catch {
      toast.error("Account could not be deleted. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const addCredits = async (id: string) => {
    const type = prompt("Adjust which credits?\n1 = Chat Credits\n2 = Face Scans\nEnter 1 or 2:");
    if (!type || (type !== "1" && type !== "2")) return;
    const amount = prompt(`Enter amount to add (negative to subtract):`);
    if (!amount || isNaN(Number(amount))) return;
    try {
      const payload: any = { reason: "Admin manual adjustment" };
      if (type === "1") payload.amount = Number(amount);
      else payload.face_scans = Number(amount);
      await adminApi.adjustCredits(id, payload.amount ?? 0, payload.reason);
      toast.success(t("admin.users.creditsAdjusted"));
      loadUsers();
    } catch (e: any) {
      toast.error(e.message || t("admin.users.creditsFailed"));
    }
  };

  const openPlanModal = (user: User) => {
    setPlanModalUser(user);
  };

  const applyPlan = async (plan: PlanOption) => {
    if (!planModalUser) return;
    setApplyingPlan(plan.id);
    try {
      const res: any = await adminApi.changeUserPlan(planModalUser.id, plan.name);
      const newCredits = res.credits ?? planModalUser.credits;
      setUsers((prev) =>
        prev.map((u) =>
          u.id === planModalUser.id ? { ...u, plan: plan.name, credits: newCredits } : u,
        ),
      );
      if (selectedUser?.id === planModalUser.id) {
        setSelectedUser((prev) => (prev ? { ...prev, plan: plan.name, credits: newCredits } : null));
      }
      toast.success(t("admin.users.planChanged", { name: plan.name }));
      setPlanModalUser(null);
    } catch (e: any) {
      toast.error(e.message || t("admin.users.planFailed"));
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
      return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
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
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.users.title")}</h1>
        <p className="text-sm text-muted-foreground font-body">{t("admin.users.counts", { total: users.length, active: activeCount, suspended: suspendedCount })}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("admin.users.totalUsers"), value: users.length, icon: "👥" },
          { label: t("admin.users.active"), value: activeCount, icon: "🟢" },
          { label: t("admin.users.suspended"), value: suspendedCount, icon: "🔴" },
        ].map((s) => (
          <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span className="text-sm">{s.icon}</span><span className="text-[11px] text-muted-foreground">{s.label}</span></div>
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2.5 px-3 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/30 text-muted-foreground shrink-0"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending_deletion">Deletion Pending</option>
        </select>
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.users.searchPlaceholder")} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm text-sm outline-none focus:ring-2 focus:ring-primary/30" />
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
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.user")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.plan")}</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.credits")}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.joined")}</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.status")}</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs">{t("admin.users.actions")}</th>
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
                      <td className="px-4 py-3 text-right text-xs font-medium text-foreground">
                        <span className="inline-flex items-center gap-1 justify-end"><Coins size={12} className="text-amber-500" />{formatCredits(u.credits)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        {u.pending_deletion === 1 ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-orange-50 text-orange-600 flex items-center justify-center gap-1">
                            <Trash2 size={9} /> Deletion Pending
                          </span>
                        ) : (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${u.is_suspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                            {u.is_suspended ? t("admin.users.suspendedBadge") : t("admin.users.activeBadge")}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={(e) => { e.stopPropagation(); openPlanModal(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Change plan"><Edit3 size={14} className="text-muted-foreground" /></button>
                          <button onClick={(e) => { e.stopPropagation(); requestToggleStatus(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors" title="Toggle status">
                            {u.is_suspended ? <CheckCircle size={14} className="text-emerald-600" /> : <Ban size={14} className="text-muted-foreground" />}
                          </button>
                          {u.pending_deletion === 1 && (
                            <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmUser(u); }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Confirm account deletion">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">{t("admin.users.noUsers")}</td></tr>
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
                  <div className="flex flex-col items-end gap-1">
                    {u.pending_deletion === 1 ? (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 flex items-center gap-1">
                        <Trash2 size={9} /> Deletion Pending
                      </span>
                    ) : (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${u.is_suspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                        {u.is_suspended ? t("admin.users.suspendedBadge") : t("admin.users.activeBadge")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${planBadgeClass(u.plan)}`}>{u.plan}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-foreground font-medium inline-flex items-center gap-1"><Coins size={12} className="text-amber-500" />{formatCredits(u.credits)}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border/30">
                  <span className="text-xs text-muted-foreground">{t("admin.users.joinedShort", { date: formatDate(u.created_at) })}</span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); openPlanModal(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit3 size={14} className="text-muted-foreground" /></button>
                    <button onClick={(e) => { e.stopPropagation(); requestToggleStatus(u); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                      {u.is_suspended ? <CheckCircle size={14} className="text-emerald-600" /> : <Ban size={14} className="text-muted-foreground" />}
                    </button>
                    {u.pending_deletion === 1 && (
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmUser(u); }} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="bg-card/80 border border-border/50 rounded-xl p-8 text-center text-sm text-muted-foreground">{t("admin.users.noUsers")}</div>
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
                  {selectedUser.is_suspended ? t("admin.users.suspendedBadge") : t("admin.users.activeBadge")}
                </span>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${planBadgeClass(selectedUser.plan)}`}>{selectedUser.plan}</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm"><Mail size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.email}</span></div>
                <div className="flex items-center gap-3 text-sm"><Coins size={14} className="text-amber-500" /><span className="text-foreground">{formatCredits(selectedUser.credits)}</span></div>
                <div className="flex items-center gap-3 text-sm"><Crown size={14} className="text-muted-foreground" /><span className="text-foreground">{selectedUser.plan} {t("admin.users.planSuffix")}</span></div>
                <div className="flex items-center gap-3 text-sm"><Calendar size={14} className="text-muted-foreground" /><span className="text-foreground">{t("admin.users.joinedShort", { date: formatDate(selectedUser.created_at) })}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openPlanModal(selectedUser)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2"><Edit3 size={14} />{t("admin.users.changePlan")}</button>
                <button onClick={() => requestToggleStatus(selectedUser)} className="flex-1 py-2.5 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-2">
                  {selectedUser.is_suspended ? <><CheckCircle size={14} />{t("admin.users.activate")}</> : <><Ban size={14} />{t("admin.users.suspend")}</>}
                </button>
              </div>
              {selectedUser.pending_deletion === 1 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-xs text-orange-700 font-medium mb-2 flex items-center gap-1.5"><Trash2 size={13} /> This user has requested account deletion.</p>
                  <button
                    onClick={() => setDeleteConfirmUser(selectedUser)}
                    className="w-full py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Confirm & Delete Account
                  </button>
                </div>
              )}
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
                  <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.users.changePlanTitle")}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("admin.users.changePlanFor", { name: planModalUser.name })} <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${planBadgeClass(planModalUser.plan)}`}>{planModalUser.plan}</span> · {t("admin.users.creditsLabel")} <span className="font-medium text-foreground inline-flex items-center gap-1"><Coins size={12} className="text-amber-500" />{formatCredits(planModalUser.credits)}</span>
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

              <p className="text-xs text-muted-foreground mb-5">{t("admin.users.replaceCredits")}</p>

              <div className="grid md:grid-cols-3 gap-4">
                {planOptions.map((plan) => {
                  const pLower = plan.name.toLowerCase();
                  const Icon = pLower.includes("enterprise") ? Crown : pLower.includes("pro") ? Zap : Shield;
                  const iconClass = pLower.includes("enterprise") ? "bg-amber-100 text-amber-600" : pLower.includes("pro") ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-600";
                  const isCurrent = planModalUser.plan.toLowerCase() === plan.name.toLowerCase();
                  const isApplying = applyingPlan === plan.id;
                  return (
                    <div key={plan.id} className={`relative bg-background/60 border rounded-2xl p-5 transition-all ${plan.popular ? "border-primary/40 ring-2 ring-primary/10" : "border-border/60"}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Star size={10} /> {t("admin.users.mostPopular")}
                          </span>
                        </div>
                      )}
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${iconClass}`}>
                        <Icon size={20} />
                      </div>
                      <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">{plan.desc}</p>
                      <div className="mb-3">
                        <span className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.price}</span>
                        <span className="text-xs text-muted-foreground">{plan.period}</span>
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
                        className={`w-full h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${isCurrent
                          ? "bg-secondary text-muted-foreground cursor-default"
                          : plan.popular
                            ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                            : "border border-border/60 text-foreground hover:bg-accent"
                          } disabled:opacity-60`}
                      >
                        {isApplying ? <><Loader2 size={14} className="animate-spin" />{t("admin.users.applying")}</> : isCurrent ? t("admin.users.currentPlan") : t("admin.users.setPlan", { name: plan.name })}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => !confirming && setDeleteConfirmUser(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Permanently Delete Account</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This will permanently delete <span className="font-medium text-foreground">{deleteConfirmUser.name}</span>'s account and all their data — vitals, chats, reports, and prescriptions. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmUser(null)}
                  disabled={confirming}
                  className="px-4 py-2 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={confirming}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {confirming ? <><Loader2 size={14} className="animate-spin" />Deleting…</> : <><Trash2 size={14} />Delete Permanently</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendConfirmUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={() => !suspending && setSuspendConfirmUser(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t("admin.users.suspendConfirmTitle")}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("admin.users.suspendConfirmDesc", { name: suspendConfirmUser.name })}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setSuspendConfirmUser(null)}
                  disabled={suspending}
                  className="px-4 py-2 rounded-xl border border-border/60 text-sm font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
                >
                  {t("admin.users.cancel")}
                </button>
                <button
                  onClick={confirmSuspend}
                  disabled={suspending}
                  className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {suspending ? <><Loader2 size={14} className="animate-spin" />{t("admin.users.suspending")}</> : <><Ban size={14} />{t("admin.users.suspendUser")}</>}
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
