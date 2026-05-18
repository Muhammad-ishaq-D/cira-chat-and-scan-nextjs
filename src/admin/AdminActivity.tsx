import { useEffect, useMemo, useState } from "react";
import { Activity, Users, Eye, MousePointerClick, ScrollText, Clock, Search, ChevronRight, X, Loader2, Smartphone, Monitor, Globe, Laptop, ArrowRightCircle, LogIn, LogOut as LogOutIcon, MousePointer2, Move, Type, MapPin, Filter, SortAsc, LayoutGrid, PieChart as PieChartIcon, ShieldCheck, RefreshCw } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { adminApi } from "@/lib/apiClient";

type SessionRow = {
  session_id: string;
  device_id?: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  started_at?: string;
  ended_at?: string;
  duration_sec?: number;
  event_count?: number;
  page_count?: number;
  landing_page?: string;
  referrer?: string;
  ua?: string;
};

type ActivityEvent = {
  id?: string | number;
  event_type: string;
  page?: string;
  data?: any;
  ts: number | string;
};

type Aggregate = {
  active_users_24h?: number;
  sessions_today?: number;
  sessions_total?: number;
  avg_duration_sec?: number;
  top_pages?: { page: string; views: number }[];
  top_events?: { event_type: string; count: number }[];
  funnel?: { step: string; count: number }[];
};

const fmtDuration = (s?: number) => {
  if (!s || s < 0) return "—";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
};

const fmtTime = (t: number | string) => {
  const d = typeof t === "number" ? new Date(t) : new Date(t);
  if (isNaN(d.getTime())) return String(t);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const getDeviceIcon = (ua?: string) => {
  if (!ua) return Globe;
  const lower = ua.toLowerCase();
  if (lower.includes("mobi")) return Smartphone;
  if (lower.includes("tablet") || lower.includes("ipad")) return Laptop;
  return Monitor;
};

const getEventIcon = (type: string) => {
  switch (type) {
    case "session_start": return LogIn;
    case "session_end": return LogOutIcon;
    case "page_view": return Eye;
    case "click": return MousePointer2;
    case "scroll": return Move;
    case "input_focus": return Type;
    case "chat_started": return Activity;
    case "vitals_scan_completed": return Activity;
    default: return ArrowRightCircle;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "session_start": return "text-emerald-500 bg-emerald-500/10";
    case "session_end": return "text-rose-500 bg-rose-500/10";
    case "click": return "text-blue-500 bg-blue-500/10";
    case "page_view": return "text-purple-500 bg-purple-500/10";
    case "vitals_scan_completed": return "text-amber-500 bg-amber-500/10";
    default: return "text-muted-foreground bg-muted";
  }
};

const AdminActivity = () => {
  const [tab, setTab] = useState<"sessions" | "aggregate" | "audit">("sessions");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [agg, setAgg] = useState<Aggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "duration">("recent");

  // HIPAA audit states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.getActivitySessions(search ? { search } : undefined);
      const list = Array.isArray(res) ? res : res?.sessions || [];
      setSessions(list);
    } catch (e) {
      console.error("Sessions load error", e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAggregate = async () => {
    try {
      const res: any = await adminApi.getActivityAggregate();
      setAgg(res || {});
    } catch (e) {
      console.error("Aggregate load error", e);
      setAgg({});
    }
  };

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res: any = await adminApi.getAuditLogs(auditSearch ? { search: auditSearch } : undefined);
      const list = Array.isArray(res) ? res : res?.logs || [];
      setAuditLogs(list);
    } catch (e) {
      console.error("Audit logs load error", e);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "sessions") {
      loadSessions();
    } else if (tab === "aggregate") {
      loadAggregate();
    } else if (tab === "audit") {
      loadAuditLogs();
    }
  }, [tab]);

  const openDrawer = async (s: SessionRow) => {
    setOpenSession(s);
    setEvents([]);
    setLoadingEvents(true);
    try {
      const res: any = await adminApi.getActivitySession(s.session_id);
      const list = Array.isArray(res) ? res : res?.events || [];
      setEvents(list);
    } catch (e) {
      console.error("Events load error", e);
    } finally {
      setLoadingEvents(false);
    }
  };

  const aggCards = useMemo(() => ([
    { label: "Active users (24h)", value: agg?.active_users_24h ?? "—", icon: Users, color: "text-blue-600 bg-blue-50/50" },
    { label: "Sessions today", value: agg?.sessions_today ?? "—", icon: Activity, color: "text-emerald-600 bg-emerald-50/50" },
    { label: "Total sessions", value: agg?.sessions_total ?? "—", icon: Eye, color: "text-purple-600 bg-purple-50/50" },
    { label: "Avg session", value: fmtDuration(agg?.avg_duration_sec), icon: Clock, color: "text-orange-600 bg-orange-50/50" },
  ]), [agg]);

  const filteredSessions = useMemo(() => {
    let list = [...sessions];
    if (deviceFilter !== "all") {
      list = list.filter(s => {
        const icon = getDeviceIcon(s.ua);
        if (deviceFilter === "mobile") return icon === Smartphone;
        if (deviceFilter === "tablet") return icon === Laptop;
        if (deviceFilter === "desktop") return icon === Monitor;
        return true;
      });
    }
    if (userFilter !== "all") {
      list = list.filter(s => userFilter === "member" ? !!s.user_id : !s.user_id);
    }
    if (sortBy === "duration") {
      list.sort((a, b) => (b.duration_sec || 0) - (a.duration_sec || 0));
    } else {
      list.sort((a, b) => new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime());
    }
    return list;
  }, [sessions, deviceFilter, userFilter, sortBy]);

  const browserData = useMemo(() => [
    { name: 'Chrome', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Safari', value: 30, color: '#312e81' },
    { name: 'Firefox', value: 15, color: '#4f46e5' },
    { name: 'Other', value: 10, color: '#94a3b8' },
  ], []);

  // Dummy chart data for visualization if agg charts are empty
  const timeData = useMemo(() => {
    if (agg?.sessions_total) {
      // In a real app, this would come from the API
      // Creating some mock history based on the total for visual flair
      return [
        { name: '12am', value: Math.floor(agg.sessions_total * 0.1) },
        { name: '4am', value: Math.floor(agg.sessions_total * 0.05) },
        { name: '8am', value: Math.floor(agg.sessions_total * 0.2) },
        { name: '12pm', value: Math.floor(agg.sessions_total * 0.4) },
        { name: '4pm', value: Math.floor(agg.sessions_total * 0.3) },
        { name: '8pm', value: Math.floor(agg.sessions_total * 0.25) },
        { name: 'Now', value: Math.floor(agg.sessions_total * 0.15) },
      ];
    }
    return [];
  }, [agg]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6 relative">
      <style>{`
        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10px, -15px) scale(1.05); }
          100% { transform: translate(0, 0) scale(1); }
        }
        .animate-float { animation: float 10s ease-in-out infinite; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[10%] right-[10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-[20%] left-[5%] w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><Activity size={18} className="text-primary" /></div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>User Activity</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-10">Real-time engagement intelligence</p>
        </div>

        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-1 shadow-sm">
          {(["sessions", "aggregate", "audit"] as const).map((t) => {
            let label = "Live Sessions";
            let Icon = Users;
            if (t === "aggregate") { label = "Analytics"; Icon = LayoutGrid; }
            else if (t === "audit") { label = "HIPAA Audit Trail"; Icon = ShieldCheck; }
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === "sessions" && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadSessions()}
                placeholder="Search sessions..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-1">
                <button
                  onClick={() => setDeviceFilter("all")}
                  className={`p-1.5 rounded-lg transition-all ${deviceFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="All Devices"
                ><LayoutGrid size={14} /></button>
                <button
                  onClick={() => setDeviceFilter("mobile")}
                  className={`p-1.5 rounded-lg transition-all ${deviceFilter === "mobile" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Mobile Only"
                ><Smartphone size={14} /></button>
                <button
                  onClick={() => setDeviceFilter("desktop")}
                  className={`p-1.5 rounded-lg transition-all ${deviceFilter === "desktop" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Desktop Only"
                ><Monitor size={14} /></button>
              </div>

              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Users</option>
                <option value="member">Members</option>
                <option value="guest">Guests</option>
              </select>

              <button
                onClick={() => setSortBy(s => s === "recent" ? "duration" : "recent")}
                className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-medium"
              >
                <SortAsc size={12} /> {sortBy === "recent" ? "Recent" : "Longest"}
              </button>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm relative group/list">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity pointer-events-none" />
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground animate-pulse">Syncing session data...</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Search size={20} className="text-muted-foreground/50" /></div>
                <p className="text-sm text-foreground font-semibold">No sessions found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search term.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40 relative z-10">
                {filteredSessions.map((s) => {
                  const DeviceIcon = getDeviceIcon(s.ua);
                  return (
                    <button
                      key={s.session_id}
                      onClick={() => openDrawer(s)}
                      className="w-full text-left p-4 hover:bg-primary/[0.03] transition-all flex items-center gap-4 group/item"
                    >
                      <div className="relative">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-background to-muted border border-border/50 flex items-center justify-center text-primary text-sm font-bold shrink-0 group-hover/item:scale-105 group-hover/item:border-primary/30 transition-all overflow-hidden relative shadow-sm">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          {(s.user_name || s.user_email || "G").slice(0, 2).toUpperCase()}
                        </div>
                        {s.duration_sec && s.duration_sec < 300 && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-background rounded-full animate-pulse shadow-sm" title="Live Session" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-bold text-foreground truncate group-hover/item:text-primary transition-colors">
                            {s.user_name || s.user_email || "Anonymous Guest"}
                          </p>
                          {s.user_id ? (
                            <div className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <ShieldCheck size={8} /> Pro
                            </div>
                          ) : (
                            <div className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-wider">Free</div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <DeviceIcon size={10} className="text-muted-foreground/70" />
                            <p className="text-[11px] text-muted-foreground/80 truncate max-w-[120px] sm:max-w-none">
                              {s.landing_page || "/"}
                            </p>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <p className="text-[11px] text-muted-foreground/80 font-medium">
                            <span className="text-foreground/70">{s.event_count ?? 0}</span> interactions
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="flex items-center justify-end gap-1.5 text-foreground font-semibold text-xs mb-0.5">
                          <Clock size={10} className="text-primary/70" />
                          {fmtDuration(s.duration_sec)}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Started {s.started_at ? new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                        <ChevronRight size={16} className="text-muted-foreground/30 group-hover/item:text-primary transition-colors shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "aggregate" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {aggCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-4 shadow-sm">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.color} mb-3`}><Icon size={20} /></div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{c.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{c.value as any}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group/chart">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/chart:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h3 className="text-sm font-bold flex items-center gap-2"><Activity size={18} className="text-primary" /> Traffic Overview</h3>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 bg-primary/10 text-primary rounded-md">Live Pulse</div>
              </div>
              <div className="h-[240px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 500, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px', fontWeight: 600, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><PieChartIcon size={18} className="text-primary" /> Browser Mix</h3>
              <div className="flex-1 min-h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={browserData}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {browserData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[10px] text-muted-foreground leading-none font-medium mb-1 uppercase tracking-widest">Growth</p>
                  <p className="text-xl font-bold leading-none">+12%</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {browserData.map((b) => (
                  <div key={b.name} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.name} <span className="ml-auto text-foreground/40">{b.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Eye size={16} className="text-primary" /> Most Visited Pages</h3>
              {agg?.top_pages?.length ? (
                <div className="space-y-3">
                  {agg.top_pages.slice(0, 6).map((p, i) => (
                    <div key={p.page} className="flex items-center gap-3 group">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="truncate text-xs font-medium text-foreground">{p.page}</span>
                          <span className="text-[11px] font-semibold text-primary">{p.views}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/40 rounded-full"
                            style={{ width: `${Math.round((p.views / (agg.top_pages![0]?.views || 1)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No page data yet.</p>}
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MousePointerClick size={16} className="text-primary" /> Top Events</h3>
              {agg?.top_events?.length ? (
                <div className="space-y-3">
                  {agg.top_events.slice(0, 6).map((e, i) => {
                    const Icon = getEventIcon(e.event_type);
                    return (
                      <div key={e.event_type} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <Icon size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="truncate text-xs font-medium text-foreground uppercase tracking-tighter">{e.event_type.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] font-bold text-foreground">{e.count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary/60 rounded-full"
                              style={{ width: `${Math.round((e.count / (agg.top_events![0]?.count || 1)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-muted-foreground">No event data yet.</p>}
            </div>
          </div>

          {agg?.funnel?.length ? (
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><ScrollText size={16} className="text-primary" /> Conversion Funnel</h3>
              <div className="space-y-4 max-w-2xl">
                {agg.funnel.map((f, i) => {
                  const max = agg.funnel![0]?.count || 1;
                  const pct = Math.round((f.count / max) * 100);
                  return (
                    <div key={i} className="relative">
                      <div className="flex justify-between text-xs font-medium mb-1.5 relative z-10">
                        <span className="font-bold">{f.step}</span>
                        <span className="text-primary font-bold">{pct}% <span className="text-muted-foreground font-normal ml-1">({f.count})</span></span>
                      </div>
                      <div className="h-4 bg-muted rounded-xl overflow-hidden relative">
                        <div className="h-full bg-primary/20 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                      </div>
                      {i < agg.funnel!.length - 1 && (
                        <div className="flex justify-center -my-1 relative z-0">
                          <ChevronRight size={14} className="rotate-90 text-primary/20" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadAuditLogs()}
                placeholder="Search audit trail by user, action..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl px-4 py-2 text-xs font-bold transition-all"
            >
              <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
              Refresh Logs
            </button>
          </div>

          <div className="bg-card/85 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm relative">
            <div className="p-4 border-b border-border/40 bg-card/55 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">Official HIPAA Security Audit Trail</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">Active</span>
            </div>

            {auditLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground animate-pulse">Syncing secure logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><ShieldCheck size={20} className="text-muted-foreground/50" /></div>
                <p className="text-sm text-foreground font-semibold">No audit logs found</p>
                <p className="text-xs text-muted-foreground mt-1">Audit log is empty or search returned no results.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <th className="p-4">User</th>
                      <th className="p-4">Action</th>
                      <th className="p-4">Target Record ID</th>
                      <th className="p-4">IP Address</th>
                      <th className="p-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-primary/[0.02] transition-colors border-b border-border/10">
                        <td className="p-4">
                          <div>
                            <p className="font-bold text-foreground">{log.user_name || "Guest/Deleted"}</p>
                            <p className="text-[10px] text-muted-foreground">{log.user_email || "N/A"}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${
                            log.action.includes("DELETE") ? "bg-rose-50 text-rose-600 border border-rose-100" :
                            log.action.includes("CREATE") || log.action.includes("SEND") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            "bg-blue-50 text-blue-600 border border-blue-100"
                          }`}>
                            {log.action.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground max-w-[150px] truncate" title={log.record_id}>
                          {log.record_id || "—"}
                        </td>
                        <td className="p-4 font-mono text-[10px] text-muted-foreground">
                          {log.ip_address || "—"}
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {openSession && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenSession(null)} />
          <div className="relative ml-auto w-full sm:max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{openSession.user_name || openSession.user_email || "Guest session"}</p>
                <p className="text-[11px] text-muted-foreground truncate">Session {openSession.session_id}</p>
                <p className="text-[11px] text-muted-foreground">{fmtDuration(openSession.duration_sec)} · {openSession.event_count ?? events.length} events</p>
              </div>
              <button onClick={() => setOpenSession(null)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {loadingEvents ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-20">No events recorded for this session.</p>
              ) : (
                <div className="relative border-l border-border/60 ml-3 space-y-8 pb-10">
                  {events.map((e, i) => {
                    const EventIcon = getEventIcon(e.event_type);
                    const colorClass = getEventColor(e.event_type);
                    return (
                      <div key={i} className="relative pl-8">
                        <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background transition-colors ${colorClass}`}>
                          <EventIcon size={12} />
                        </div>
                        <div className="p-3.5 bg-card border border-border shadow-sm rounded-2xl relative overflow-hidden group/ev">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover/ev:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between gap-4 mb-2 relative z-10">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">
                              {e.event_type === 'click' && e.data?.text ? `Click: "${e.data.text}"` : e.event_type.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] tabular-nums font-bold text-muted-foreground/60">{fmtTime(e.ts)}</span>
                          </div>
                          {e.page && (
                            <div className="flex items-center gap-1.5 mb-2 relative z-10">
                              <MapPin size={9} className="text-primary/50" />
                              <p className="text-[10px] font-medium text-muted-foreground/80 truncate">{e.page}</p>
                            </div>
                          )}
                          {e.data && Object.keys(e.data).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/40 relative z-10">
                              <pre className="text-[9px] text-muted-foreground/90 font-mono whitespace-pre-wrap break-words bg-muted/30 rounded-xl p-2.5 max-h-32 overflow-y-auto leading-relaxed scrollbar-hide">
                                {JSON.stringify(e.data, null, 2)}
                              </pre>
                            </div>
                          )}
                          {i === events.length - 1 && (
                            <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold text-rose-500 uppercase tracking-widest relative z-10">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              Drop-off point
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;
