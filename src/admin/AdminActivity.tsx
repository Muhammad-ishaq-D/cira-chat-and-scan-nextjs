import { useEffect, useMemo, useState } from "react";
import i18n from "@/i18n";
import { Activity, Users, Eye, MousePointerClick, Clock, Search, ChevronRight, X, Loader2, Smartphone, Monitor, Globe, Laptop, ArrowRightCircle, LogIn, LogOut as LogOutIcon, MousePointer2, Move, Type, MapPin, SortAsc, LayoutGrid, PieChart as PieChartIcon, ShieldCheck, RefreshCw, ScanFace, MessageCircle, FileText } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
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
  const t = i18n.getFixedT("en");
  const [tab, setTab] = useState<"sessions" | "user-events" | "aggregate" | "audit">("sessions");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"recent" | "duration">("recent");

  const [agg, setAgg] = useState<Aggregate | null>(null);

  // User events (scan / chat / report)
  const [userEvents, setUserEvents] = useState<any[]>([]);
  const [userEventsLoading, setUserEventsLoading] = useState(false);
  const [userEventsSearch, setUserEventsSearch] = useState("");
  const [userEventsFilter, setUserEventsFilter] = useState("all");
  const [openUserDrawer, setOpenUserDrawer] = useState<{ name: string; email: string; events: any[] } | null>(null);

  // HIPAA audit states
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearch, setAuditSearch] = useState("");
  const [selectedUserLogs, setSelectedUserLogs] = useState<any[] | null>(null);
  const [selectedUserMeta, setSelectedUserMeta] = useState<{ name: string; email: string } | null>(null);

  const groupedAuditLogs = useMemo(() => {
    const groups: { [key: string]: { user_name: string; user_email: string; logs: any[]; latest_timestamp: string; latest_action: string } } = {};
    
    auditLogs.forEach((log) => {
      const key = log.user_id || log.user_email || 'guest';
      if (!groups[key]) {
        groups[key] = {
          user_name: log.user_name || "Guest User",
          user_email: log.user_email || log.user_id || "guest.cira.app",
          logs: [],
          latest_timestamp: log.timestamp,
          latest_action: log.action
        };
      }
      groups[key].logs.push(log);
      if (new Date(log.timestamp) > new Date(groups[key].latest_timestamp)) {
        groups[key].latest_timestamp = log.timestamp;
        groups[key].latest_action = log.action;
      }
    });

    return Object.values(groups).sort((a, b) => new Date(b.latest_timestamp).getTime() - new Date(a.latest_timestamp).getTime());
  }, [auditLogs]);

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

  const loadUserEvents = async () => {
    setUserEventsLoading(true);
    try {
      const res: any = await adminApi.getUserActivity({
        search: userEventsSearch || undefined,
        event_type: userEventsFilter !== "all" ? userEventsFilter : undefined,
      });
      const list = Array.isArray(res) ? res : res?.events || [];
      setUserEvents(list);
    } catch (e) {
      console.error("User events load error", e);
      setUserEvents([]);
    } finally {
      setUserEventsLoading(false);
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
    if (tab === "sessions") loadSessions();
    else if (tab === "user-events") loadUserEvents();
    else if (tab === "aggregate") loadAggregate();
    else if (tab === "audit") loadAuditLogs();
  }, [tab]);

  const groupedUsers = useMemo(() => {
    const map: Record<string, { user_id: string; user_name: string; user_email: string; scans: number; chats: number; reports: number; events: any[]; last_active: string }> = {};
    userEvents.forEach(ev => {
      const key = ev.user_id || ev.user_email || "unknown";
      if (!map[key]) map[key] = { user_id: ev.user_id, user_name: ev.user_name, user_email: ev.user_email, scans: 0, chats: 0, reports: 0, events: [], last_active: ev.ts };
      map[key].events.push(ev);
      if (ev.event_type === "vitals_scan") map[key].scans++;
      else if (ev.event_type === "chat_message") map[key].chats++;
      else if (ev.event_type === "report_view") map[key].reports++;
      if (new Date(ev.ts) > new Date(map[key].last_active)) map[key].last_active = ev.ts;
    });
    return Object.values(map).sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime());
  }, [userEvents]);

  const aggCards = useMemo(() => ([
    { label: t("admin.activity.activeUsers24h"), value: agg?.active_users_24h ?? "—", icon: Users, color: "text-blue-600 bg-blue-50/50" },
    { label: t("admin.activity.sessionsToday"), value: agg?.sessions_today ?? "—", icon: Activity, color: "text-emerald-600 bg-emerald-50/50" },
    { label: t("admin.activity.totalSessions"), value: agg?.sessions_total ?? "—", icon: Eye, color: "text-purple-600 bg-purple-50/50" },
    { label: t("admin.activity.avgSession"), value: fmtDuration(agg?.avg_duration_sec), icon: Clock, color: "text-orange-600 bg-orange-50/50" },
  ]), [agg, t]);

  const timeData = useMemo(() => {
    if (agg?.sessions_total) {
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

  const browserData = [
    { name: 'Chrome', value: 45, color: 'hsl(var(--primary))' },
    { name: 'Safari', value: 30, color: '#312e81' },
    { name: 'Firefox', value: 15, color: '#4f46e5' },
    { name: 'Other', value: 10, color: '#94a3b8' },
  ];

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
            <h1 className="text-2xl font-bold text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>{t("admin.activity.title")}</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-10">{t("admin.activity.subtitle")}</p>
        </div>

        <div className="flex items-center gap-2 bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-1 shadow-sm">
          {([
            { id: "sessions", label: t("admin.activity.liveSessions"), Icon: Users },
            { id: "user-events", label: "User Activity", Icon: Activity },
            { id: "aggregate", label: t("admin.activity.analytics"), Icon: LayoutGrid },
            { id: "audit", label: t("admin.activity.hipaa"), Icon: ShieldCheck },
          ] as const).map(({ id: tb, label, Icon }) => (
            <button
              key={tb}
              onClick={() => setTab(tb)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${tab === tb ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
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
                placeholder={t("admin.activity.searchSessions")}
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
                <option value="all">{t("admin.activity.allUsers")}</option>
                <option value="member">{t("admin.activity.members")}</option>
                <option value="guest">{t("admin.activity.guests")}</option>
              </select>

              <button
                onClick={() => setSortBy(s => s === "recent" ? "duration" : "recent")}
                className="flex items-center gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all font-medium"
              >
                <SortAsc size={12} /> {sortBy === "recent" ? t("admin.activity.recent") : t("admin.activity.longest")}
              </button>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm relative group/list">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover/list:opacity-100 transition-opacity pointer-events-none" />
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground animate-pulse">{t("admin.activity.syncing")}</p>
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Search size={20} className="text-muted-foreground/50" /></div>
                <p className="text-sm text-foreground font-semibold">{t("admin.activity.noSessions")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("admin.activity.noSessionsHint")}</p>
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
                            {s.user_name || s.user_email || t("admin.activity.guestSession")}
                          </p>
                          {s.user_id ? (
                            <div className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <ShieldCheck size={8} /> {t("admin.activity.pro")}
                            </div>
                          ) : (
                            <div className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-wider">{t("admin.activity.free")}</div>
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
                            <span className="text-foreground/70">{s.event_count ?? 0}</span> {t("admin.activity.interactions")}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 hidden sm:block">
                        <div className="flex items-center justify-end gap-1.5 text-foreground font-semibold text-xs mb-0.5">
                          <Clock size={10} className="text-primary/70" />
                          {fmtDuration(s.duration_sec)}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{t("admin.activity.startedAt", { time: s.started_at ? new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—" })}</p>
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

      {tab === "user-events" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full">
            <div className="relative flex-1 w-full max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={userEventsSearch}
                onChange={(e) => setUserEventsSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUserEvents()}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-3 py-2 text-sm bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "All", Icon: Activity },
                { id: "vitals_scan", label: "Scan", Icon: ScanFace },
                { id: "chat_message", label: "Chat", Icon: MessageCircle },
                { id: "report_view", label: "Report", Icon: FileText },
              ].map(({ id, label, Icon }) => (
                <button key={id} onClick={() => setUserEventsFilter(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${userEventsFilter === id ? "bg-primary text-primary-foreground shadow-sm" : "bg-card/50 border border-border/50 text-muted-foreground hover:text-foreground"}`}>
                  <Icon size={12} /> {label}
                </button>
              ))}
              <button onClick={loadUserEvents}
                className="flex items-center gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl px-3 py-1.5 text-xs font-bold transition-all">
                <RefreshCw size={12} className={userEventsLoading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
            {userEventsLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground animate-pulse">Loading activity…</p>
              </div>
            ) : groupedUsers.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><Activity size={20} className="text-muted-foreground/50" /></div>
                <p className="text-sm text-foreground font-semibold">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">Events appear here once logged-in users scan, chat, or download reports.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {groupedUsers.map((u) => (
                  <button key={u.user_id} onClick={() => setOpenUserDrawer({ name: u.user_name, email: u.user_email, events: u.events })}
                    className="w-full text-left p-4 hover:bg-primary/[0.03] transition-all flex items-center gap-4 group/item">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-background to-muted border border-border/50 flex items-center justify-center text-primary text-sm font-bold shrink-0 group-hover/item:scale-105 group-hover/item:border-primary/30 transition-all shadow-sm">
                      {(u.user_name || u.user_email || "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-foreground truncate group-hover/item:text-primary transition-colors">{u.user_name || u.user_email}</p>
                        <div className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[8px] font-bold uppercase tracking-wider flex items-center gap-0.5">
                          <ShieldCheck size={8} /> Member
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{u.user_email}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {u.scans > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600"><ScanFace size={10} /> {u.scans} scan{u.scans > 1 ? "s" : ""}</span>}
                        {u.chats > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600"><MessageCircle size={10} /> {u.chats} chat{u.chats > 1 ? "s" : ""}</span>}
                        {u.reports > 0 && <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-600"><FileText size={10} /> {u.reports} report{u.reports > 1 ? "s" : ""}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs font-semibold text-foreground">{u.events.length} event{u.events.length > 1 ? "s" : ""}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(u.last_active).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover/item:bg-primary/10 transition-colors">
                      <ChevronRight size={16} className="text-muted-foreground/30 group-hover/item:text-primary transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
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
            <div className="xl:col-span-2 bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold flex items-center gap-2"><Activity size={18} className="text-primary" /> {t("admin.activity.trafficOverview")}</h3>
                <div className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 bg-primary/10 text-primary rounded-md">{t("admin.activity.livePulse")}</div>
              </div>
              <div className="h-[240px] w-full">
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
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><PieChartIcon size={18} className="text-primary" /> {t("admin.activity.browserMix")}</h3>
              <div className="flex-1 min-h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={browserData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                      {browserData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-[10px] text-muted-foreground leading-none font-medium mb-1 uppercase tracking-widest">{t("admin.activity.growth")}</p>
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
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><Eye size={16} className="text-primary" /> {t("admin.activity.mostVisited")}</h3>
              {agg?.top_pages?.length ? (
                <div className="space-y-3">
                  {agg.top_pages.slice(0, 6).map((p, i) => (
                    <div key={p.page} className="flex items-center gap-3 group">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="truncate text-xs font-medium text-foreground">{p.page}</span>
                          <span className="text-[11px] font-semibold text-primary">{p.views}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.round((p.views / (agg.top_pages![0]?.views || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">{t("admin.activity.noPages")}</p>}
            </div>

            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MousePointerClick size={16} className="text-primary" /> {t("admin.activity.topEvents")}</h3>
              {agg?.top_events?.length ? (
                <div className="space-y-3">
                  {agg.top_events.slice(0, 6).map((e) => {
                    const Icon = getEventIcon(e.event_type);
                    return (
                      <div key={e.event_type} className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors"><Icon size={14} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="truncate text-xs font-medium text-foreground uppercase tracking-tighter">{e.event_type.replace(/_/g, ' ')}</span>
                            <span className="text-[11px] font-bold text-foreground">{e.count}</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary/60 rounded-full" style={{ width: `${Math.round((e.count / (agg.top_events![0]?.count || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-xs text-muted-foreground">{t("admin.activity.noEvents")}</p>}
            </div>
          </div>
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
                placeholder={t("admin.activity.searchAudit")}
                className="w-full pl-9 pr-3 py-2 text-sm bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              onClick={loadAuditLogs}
              className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded-xl px-4 py-2 text-xs font-bold transition-all"
            >
              <RefreshCw size={14} className={auditLoading ? "animate-spin" : ""} />
              {t("admin.activity.refreshLogs")}
            </button>
          </div>

          <div className="bg-card/85 backdrop-blur-md border border-border/50 rounded-2xl overflow-hidden shadow-sm relative">
            <div className="p-4 border-b border-border/40 bg-card/55 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-foreground">{t("admin.activity.auditTitle")}</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest border border-emerald-100">{t("admin.activity.activeBadge")}</span>
            </div>

            {auditLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground animate-pulse">Syncing secure logs...</p>
              </div>
            ) : groupedAuditLogs.length === 0 ? (
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
                      <th className="p-4">{t("admin.activity.colUser")}</th>
                      <th className="p-4">{t("admin.activity.colLatest")}</th>
                      <th className="p-4 text-center">{t("admin.activity.colOps")}</th>
                      <th className="p-4">{t("admin.activity.colLastActive")}</th>
                      <th className="p-4 text-right">{t("admin.activity.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-xs">
                    {groupedAuditLogs.map((group) => {
                      const isDelete = group.latest_action.includes("DELETE");
                      const isCreate = group.latest_action.includes("CREATE") || group.latest_action.includes("SEND");
                      const badgeColor = isDelete ? "text-rose-600 bg-rose-50 border-rose-100" :
                                         isCreate ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                                         "text-blue-600 bg-blue-50 border-blue-100";
                      
                      return (
                        <tr key={group.user_email} className="hover:bg-primary/[0.02] transition-colors border-b border-border/10">
                          <td className="p-4">
                            <div>
                              <p className="font-bold text-foreground">{group.user_name}</p>
                              <p className="text-[10px] text-muted-foreground">{group.user_email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase tracking-wider ${badgeColor}`}>
                              {group.latest_action.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-[10px]">
                              {t("admin.activity.ops", { n: group.logs.length })}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(group.latest_timestamp).toLocaleString("en", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedUserLogs(group.logs);
                                setSelectedUserMeta({ name: group.user_name, email: group.user_email });
                              }}
                              className="px-3 py-1.5 bg-primary text-primary-foreground font-bold rounded-lg text-[10px] hover:bg-primary/95 hover:shadow-sm active:scale-95 transition-all"
                            >
                              {t("admin.activity.viewTrail")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}


      {openUserDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenUserDrawer(null)} />
          <div className="relative ml-auto w-full sm:max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-card">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {(openUserDrawer.name || openUserDrawer.email || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{openUserDrawer.name || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{openUserDrawer.email}</p>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{openUserDrawer.events.length} events</p>
              </div>
              <button onClick={() => setOpenUserDrawer(null)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="relative border-l border-border/60 ml-3 space-y-6 pb-10">
                {[...openUserDrawer.events].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()).map((ev, i) => {
                  const isScan = ev.event_type === "vitals_scan";
                  const isChat = ev.event_type === "chat_message";
                  const dotColor = isScan ? "text-amber-500 bg-amber-500/10" : isChat ? "text-blue-500 bg-blue-500/10" : "text-purple-500 bg-purple-500/10";
                  const Icon = isScan ? ScanFace : isChat ? MessageCircle : FileText;
                  const label = isScan ? "Vitals Scan" : isChat ? "Chat Message" : "Report View";
                  const data = typeof ev.data === "string" ? JSON.parse(ev.data || "{}") : ev.data || {};
                  return (
                    <div key={i} className="relative pl-8">
                      <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background ${dotColor}`}>
                        <Icon size={12} />
                      </div>
                      <div className="p-3.5 bg-card border border-border shadow-sm rounded-2xl">
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">{label}</span>
                          <span className="text-[10px] tabular-nums font-bold text-muted-foreground/60">
                            {new Date(ev.ts).toLocaleString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {isScan && data.heart_rate && (
                          <p className="text-xs text-muted-foreground">HR: <b className="text-foreground">{data.heart_rate} bpm</b>{data.wellness_score ? ` · Wellness: ${data.wellness_score}` : ""}</p>
                        )}
                        {isChat && <p className="text-xs text-muted-foreground">Message sent</p>}
                        {!isScan && !isChat && data.action && <p className="text-xs text-muted-foreground">{data.action.replace(/_/g, " ")}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {openSession && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpenSession(null)} />
          <div className="relative ml-auto w-full sm:max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{openSession.user_name || openSession.user_email || t("admin.activity.guestSession")}</p>
                <p className="text-[11px] text-muted-foreground truncate">{t("admin.activity.sessionId", { id: openSession.session_id })}</p>
                <p className="text-[11px] text-muted-foreground">{t("admin.activity.eventsSummary", { dur: fmtDuration(openSession.duration_sec), n: openSession.event_count ?? events.length })}</p>
              </div>
              <button onClick={() => setOpenSession(null)} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              {loadingEvents ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-20">{t("admin.activity.noSessionEvents")}</p>
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
                              {t("admin.activity.dropOff")}
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

      {selectedUserLogs && selectedUserMeta && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedUserLogs(null); setSelectedUserMeta(null); }} />
          <div className="relative ml-auto w-full sm:max-w-lg h-full bg-background border-l border-border shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-start justify-between gap-3 bg-card">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={18} className="text-primary" />
                  <span className="text-sm font-bold text-foreground truncate">{selectedUserMeta.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{selectedUserMeta.email}</p>
                <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-wider">{t("admin.activity.auditRecords", { n: selectedUserLogs.length })}</p>
              </div>
              <button onClick={() => { setSelectedUserLogs(null); setSelectedUserMeta(null); }} className="p-1 rounded hover:bg-accent"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="relative border-l border-border/60 ml-3 space-y-8 pb-10">
                {selectedUserLogs.map((log, i) => {
                  const isDelete = log.action.includes("DELETE");
                  const isCreate = log.action.includes("CREATE") || log.action.includes("SEND");
                  const badgeColor = isDelete ? "text-rose-600 bg-rose-50 border-rose-100" :
                                     isCreate ? "text-emerald-600 bg-emerald-50 border-emerald-100" :
                                     "text-blue-600 bg-blue-50 border-blue-100";
                  
                  return (
                    <div key={log.id} className="relative pl-8">
                      {/* Timeline dot */}
                      <div className={`absolute -left-4 top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-background bg-card shadow-sm ${
                        isDelete ? "text-rose-500" : isCreate ? "text-emerald-500" : "text-blue-500"
                      }`}>
                        <ShieldCheck size={12} />
                      </div>
                      
                      <div className="p-3.5 bg-card border border-border shadow-sm rounded-2xl relative overflow-hidden group/ev">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover/ev:opacity-100 transition-opacity" />
                        <div className="flex flex-col gap-2 relative z-10">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider border ${badgeColor}`}>
                              {log.action.replace(/_/g, " ")}
                            </span>
                            <span className="text-[9px] tabular-nums font-bold text-muted-foreground/60">
                              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="text-[11px] text-muted-foreground space-y-1.5 mt-1">
                            {log.record_id && (
                              <div className="flex items-start gap-1">
                                <span className="font-semibold text-foreground shrink-0">{t("admin.activity.recordId")}</span>
                                <span className="font-mono text-[10px] break-all">{log.record_id}</span>
                              </div>
                            )}
                            {log.ip_address && (
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-foreground">{t("admin.activity.ipAddress")}</span>
                                <span className="font-mono text-[10px]">{log.ip_address}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-foreground">{t("admin.activity.date")}</span>
                              <span>{new Date(log.timestamp).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
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

export default AdminActivity;
