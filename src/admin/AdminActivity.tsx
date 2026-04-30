import { useEffect, useMemo, useState } from "react";
import { Activity, Users, Eye, MousePointerClick, ScrollText, Clock, Search, ChevronRight, X, Loader2 } from "lucide-react";
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
  return d.toLocaleString();
};

const AdminActivity = () => {
  const [tab, setTab] = useState<"sessions" | "aggregate">("sessions");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [agg, setAgg] = useState<Aggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openSession, setOpenSession] = useState<SessionRow | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

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

  useEffect(() => {
    loadSessions();
    loadAggregate();
  }, []);

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
    { label: "Active users (24h)", value: agg?.active_users_24h ?? "—", icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Sessions today", value: agg?.sessions_today ?? "—", icon: Activity, color: "bg-emerald-50 text-emerald-600" },
    { label: "Total sessions", value: agg?.sessions_total ?? "—", icon: Eye, color: "bg-purple-50 text-purple-600" },
    { label: "Avg session", value: fmtDuration(agg?.avg_duration_sec), icon: Clock, color: "bg-orange-50 text-orange-600" },
  ]), [agg]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Activity</h1>
        <p className="text-sm text-muted-foreground font-body">Full session tracking — landing, clicks, navigation, scrolls</p>
      </div>

      {/* Tabs */}
      <div className="inline-flex bg-card/80 border border-border/50 rounded-xl p-1">
        {(["sessions", "aggregate"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm rounded-lg transition ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "sessions" ? "Sessions" : "Aggregate"}
          </button>
        ))}
      </div>

      {tab === "sessions" && (
        <>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadSessions()}
                placeholder="Search by user / email / device / session..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button onClick={loadSessions} className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90">Search</button>
          </div>

          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 flex items-center justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground">No sessions tracked yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {sessions.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => openDrawer(s)}
                    className="w-full text-left p-4 hover:bg-accent/40 transition flex items-center gap-4"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center text-primary text-xs font-medium shrink-0">
                      {(s.user_name || s.user_email || "G").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-foreground truncate">
                          {s.user_name || s.user_email || "Guest"}
                        </p>
                        {!s.user_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">guest</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {s.landing_page || "—"} · {s.event_count ?? 0} events · {s.page_count ?? 0} pages
                      </p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-foreground">{fmtDuration(s.duration_sec)}</p>
                      <p className="text-[11px] text-muted-foreground">{s.started_at ? new Date(s.started_at).toLocaleString() : "—"}</p>
                    </div>
                    <ChevronRight size={16} className="text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {tab === "aggregate" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {aggCards.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className="bg-card/80 border border-border/50 rounded-xl p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.color} mb-3`}><Icon size={18} /></div>
                  <p className="text-[11px] text-muted-foreground">{c.label}</p>
                  <p className="text-xl font-semibold text-foreground">{c.value as any}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-card/80 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Eye size={14} /> Top pages</h3>
              {agg?.top_pages?.length ? (
                <div className="space-y-2">
                  {agg.top_pages.slice(0, 8).map((p) => (
                    <div key={p.page} className="flex items-center justify-between text-xs">
                      <span className="truncate text-foreground">{p.page}</span>
                      <span className="text-muted-foreground ml-2">{p.views}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No data yet.</p>}
            </div>

            <div className="bg-card/80 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><MousePointerClick size={14} /> Top events</h3>
              {agg?.top_events?.length ? (
                <div className="space-y-2">
                  {agg.top_events.slice(0, 8).map((e) => (
                    <div key={e.event_type} className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{e.event_type}</span>
                      <span className="text-muted-foreground ml-2">{e.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">No data yet.</p>}
            </div>
          </div>

          {agg?.funnel?.length ? (
            <div className="bg-card/80 border border-border/50 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><ScrollText size={14} /> Funnel</h3>
              <div className="space-y-2">
                {agg.funnel.map((f, i) => {
                  const max = agg.funnel![0]?.count || 1;
                  const pct = Math.round((f.count / max) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1"><span>{f.step}</span><span className="text-muted-foreground">{f.count}</span></div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* Drawer */}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loadingEvents ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" /></div>
              ) : events.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-12">No events.</p>
              ) : (
                events.map((e, i) => (
                  <div key={i} className="border border-border/60 rounded-lg p-2.5 bg-card/50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-medium text-foreground">{e.event_type}</span>
                      <span className="text-[10px] text-muted-foreground">{fmtTime(e.ts)}</span>
                    </div>
                    {e.page && <p className="text-[11px] text-muted-foreground truncate">{e.page}</p>}
                    {e.data && Object.keys(e.data).length > 0 && (
                      <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-words bg-muted/40 rounded p-1.5 max-h-32 overflow-y-auto">
{JSON.stringify(e.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminActivity;
