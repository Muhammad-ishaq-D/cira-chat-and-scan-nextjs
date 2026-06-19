import { useState, useEffect, useMemo } from "react";
import {
  Users, ScanFace, DollarSign, Globe, RefreshCw, MapPin,
  CreditCard, TrendingUp, TrendingDown, Minus, ArrowUpRight,
  Activity, BarChart2, PieChart as PieChartIcon,
} from "lucide-react";
import { adminApi } from "@/lib/apiClient";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from "recharts";

type Period = "daily" | "weekly" | "monthly" | "lifetime";

const PERIODS: { id: Period; label: string }[] = [
  { id: "daily",    label: "Today"   },
  { id: "weekly",   label: "7 Days"  },
  { id: "monthly",  label: "30 Days" },
  { id: "lifetime", label: "All Time"},
];

const PALETTE = {
  visitors: { stroke: "#8b5cf6", fill: "#8b5cf6" },
  signups:  { stroke: "#06b6d4", fill: "#06b6d4" },
  scans:    { stroke: "#f59e0b", fill: "#f59e0b" },
  revenue:  { stroke: "#10b981", fill: "#10b981" },
};

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e", "#94a3b8"];

const fmt    = (n: number) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(1)}k` : String(Math.round(n));
const fmtEur = (n: number) => `€${Number(n).toFixed(2)}`;
const pctStr = (a: number, b: number) => b > 0 ? `${((a / b) * 100).toFixed(1)}%` : "0.0%";

const sum = (arr: any[], key = "count") =>
  (arr || []).reduce((s, d) => s + Number(d[key] || 0), 0);

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-8 pb-24 md:pb-8 space-y-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2"><div className="h-7 w-36 bg-muted rounded-xl"/><div className="h-4 w-56 bg-muted rounded-xl"/></div>
      <div className="h-9 w-72 bg-muted rounded-2xl"/>
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {[...Array(5)].map((_,i) => <div key={i} className="h-32 bg-card border border-border/40 rounded-2xl"/>)}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="h-72 bg-card border border-border/40 rounded-2xl"/>
      <div className="h-72 bg-card border border-border/40 rounded-2xl"/>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 h-72 bg-card border border-border/40 rounded-2xl"/>
      <div className="h-72 bg-card border border-border/40 rounded-2xl"/>
    </div>
  </div>
);

// ─── Trend badge ──────────────────────────────────────────────────────────────
const TrendBadge = ({ value }: { value: number }) => {
  if (value === 0) return <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted-foreground"><Minus size={9}/> —</span>;
  const up = value > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}
      {Math.abs(value)}%
    </span>
  );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border shadow-xl rounded-xl px-3 py-2.5 text-xs min-w-[120px]">
      <p className="text-muted-foreground font-medium mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-foreground font-medium capitalize">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }}/>
            {p.dataKey}
          </span>
          <span className="font-bold text-foreground">{p.dataKey === "revenue" ? fmtEur(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color }: { icon: any; title: string; color: string }) => (
  <div className="flex items-center gap-2 mb-5">
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}><Icon size={14}/></div>
    <h3 className="text-sm font-bold text-foreground">{title}</h3>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AdminAnalytics = () => {
  const [period, setPeriod]   = useState<Period>("monthly");
  const [data,   setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async (p: Period) => {
    setLoading(true);
    try { setData(await adminApi.getAnalytics(p)); }
    catch (e) { console.error("Analytics error:", e); }
    finally   { setLoading(false); }
  };

  useEffect(() => { load(period); }, [period]);

  // ── Computed values ────────────────────────────────────────────────────────
  const pVisitors = useMemo(() => sum(data?.visitors_trend), [data]);
  const pSignups  = useMemo(() => sum(data?.signups_trend),  [data]);
  const pScans    = useMemo(() => sum(data?.scans_trend),    [data]);
  const pRevenue  = useMemo(() => sum(data?.revenue_trend, "amount"), [data]);

  const isLifetime = period === "lifetime";

  const kpis = [
    { key: "visitors", label: "Total Visitors",  icon: Globe,       color: "bg-violet-100 text-violet-600",  value: isLifetime ? (data?.total_visitors||0) : pVisitors, lifetime: data?.total_visitors||0, isMoney: false },
    { key: "signups",  label: "New Signups",      icon: Users,       color: "bg-cyan-100 text-cyan-600",      value: isLifetime ? (data?.total_users||0)    : pSignups,  lifetime: data?.total_users||0,    isMoney: false },
    { key: "scans",    label: "Scans Completed",  icon: ScanFace,    color: "bg-amber-100 text-amber-600",    value: isLifetime ? (data?.total_scans||0)    : pScans,    lifetime: data?.total_scans||0,    isMoney: false },
    { key: "revenue",  label: "Revenue",          icon: DollarSign,  color: "bg-emerald-100 text-emerald-600",value: isLifetime ? (data?.total_revenue||0)  : pRevenue,  lifetime: data?.total_revenue||0,  isMoney: true  },
    { key: "paid",     label: "Paid Conversions", icon: CreditCard,  color: "bg-fuchsia-100 text-fuchsia-600",value: data?.paid_users||0,                                 lifetime: data?.total_users||0,    isMoney: false },
  ];

  // Merge visitors + signups into single date axis
  const engagementData = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.visitors_trend||[]).forEach((d: any) => { map[d.date] = { ...map[d.date], date: d.date, visitors: Number(d.count) }; });
    (data?.signups_trend ||[]).forEach((d: any) => { map[d.date] = { ...map[d.date], date: d.date, signups:  Number(d.count) }; });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data]);

  const conversionData = useMemo(() => {
    const map: Record<string, any> = {};
    (data?.scans_trend  ||[]).forEach((d: any) => { map[d.date] = { ...map[d.date], date: d.date, scans:   Number(d.count)      }; });
    (data?.revenue_trend||[]).forEach((d: any) => { map[d.date] = { ...map[d.date], date: d.date, revenue: Number(d.amount||0)  }; });
    return Object.values(map).sort((a: any, b: any) => a.date.localeCompare(b.date));
  }, [data]);

  const maxPageViews = Math.max(...(data?.top_pages||[]).map((p: any) => Number(p.views)), 1);
  const convRate = pctStr(data?.paid_users||0, data?.total_users||1);

  if (loading && !data) return <Skeleton />;

  // ── Shared chart axis style ────────────────────────────────────────────────
  const axisTick = { fontSize: 10, fontWeight: 500, fill: "hsl(var(--muted-foreground))" };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart2 size={17} className="text-primary"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          </div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-10">Platform usage & engagement intelligence</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period pill */}
          <div className="flex items-center bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-1 gap-0.5 shadow-sm">
            {PERIODS.map(({ id, label }) => (
              <button key={id} onClick={() => setPeriod(id)}
                className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  period === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >{label}</button>
            ))}
          </div>
          <button onClick={() => load(period)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""}/>
          </button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          const displayVal = k.isMoney ? fmtEur(k.value) : fmt(k.value);
          const lifetimeVal = k.isMoney ? fmtEur(k.lifetime) : fmt(k.lifetime);
          return (
            <div key={k.key}
              className="group relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/25 transition-all overflow-hidden">
              {/* subtle bg glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.color} mb-4 relative z-10`}>
                <Icon size={16}/>
              </div>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mb-1 relative z-10">{k.label}</p>
              <p className="text-[1.6rem] font-extrabold text-foreground leading-none tracking-tight relative z-10">{displayVal}</p>
              <div className="flex items-center justify-between mt-2.5 relative z-10">
                <p className="text-[10px] text-muted-foreground">
                  {isLifetime ? "Total since launch" : `Lifetime: ${lifetimeVal}`}
                </p>
                {k.key === "paid" && (
                  <span className="text-[10px] font-bold text-fuchsia-600 bg-fuchsia-50 px-1.5 py-0.5 rounded-md">{convRate}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Visitors & Signups */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={Globe} title="Visitors & Signups" color="bg-violet-100 text-violet-600"/>
          <div className="flex items-center gap-4 mb-4">
            {[
              { key: "visitors", color: PALETTE.visitors.stroke, label: "Visitors", val: fmt(pVisitors) },
              { key: "signups",  color: PALETTE.signups.stroke,  label: "Signups",  val: fmt(pSignups)  },
            ].map(m => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}/>
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
                <span className="text-[11px] font-bold text-foreground">{m.val}</span>
              </div>
            ))}
          </div>
          {engagementData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <Activity size={28} className="text-muted-foreground/30"/>
              <p className="text-xs text-muted-foreground">No data for this period</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={engagementData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    {(["visitors","signups"] as const).map(k => (
                      <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={PALETTE[k].fill} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={PALETTE[k].fill} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5}/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisTick} interval="preserveStartEnd" tickFormatter={v => v?.slice(5) || v}/>
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="visitors" stroke={PALETTE.visitors.stroke} strokeWidth={2.5} fill="url(#g_visitors)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }}/>
                  <Area type="monotone" dataKey="signups"  stroke={PALETTE.signups.stroke}  strokeWidth={2.5} fill="url(#g_signups)"  dot={false} activeDot={{ r: 4, strokeWidth: 0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Scans & Revenue */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={TrendingUp} title="Scans & Revenue" color="bg-amber-100 text-amber-600"/>
          <div className="flex items-center gap-4 mb-4">
            {[
              { key: "scans",   color: PALETTE.scans.stroke,   label: "Scans",   val: fmt(pScans)       },
              { key: "revenue", color: PALETTE.revenue.stroke,  label: "Revenue", val: fmtEur(pRevenue)  },
            ].map(m => (
              <div key={m.key} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }}/>
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
                <span className="text-[11px] font-bold text-foreground">{m.val}</span>
              </div>
            ))}
          </div>
          {conversionData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center gap-2">
              <Activity size={28} className="text-muted-foreground/30"/>
              <p className="text-xs text-muted-foreground">No data for this period</p>
            </div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversionData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    {(["scans","revenue"] as const).map(k => (
                      <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={PALETTE[k].fill} stopOpacity={0.2}/>
                        <stop offset="100%" stopColor={PALETTE[k].fill} stopOpacity={0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" vertical={false} stroke="hsl(var(--border))" opacity={0.5}/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={axisTick} interval="preserveStartEnd" tickFormatter={v => v?.slice(5) || v}/>
                  <YAxis axisLine={false} tickLine={false} tick={axisTick} allowDecimals={false}/>
                  <Tooltip content={<ChartTooltip/>}/>
                  <Area type="monotone" dataKey="scans"   stroke={PALETTE.scans.stroke}   strokeWidth={2.5} fill="url(#g_scans)"   dot={false} activeDot={{ r: 4, strokeWidth: 0 }}/>
                  <Area type="monotone" dataKey="revenue" stroke={PALETTE.revenue.stroke}  strokeWidth={2.5} fill="url(#g_revenue)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Pages */}
        <div className="lg:col-span-2 bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-sm">
          <SectionHeader icon={MapPin} title="User Journey — Top Pages" color="bg-primary/10 text-primary"/>
          {(data?.top_pages||[]).length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <MapPin size={28} className="text-muted-foreground/25"/>
              <p className="text-xs text-muted-foreground">No page data yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(data?.top_pages||[]).map((p: any, i: number) => {
                const pct = Math.round((Number(p.views) / maxPageViews) * 100);
                return (
                  <div key={p.page} className="flex items-center gap-3 group">
                    <span className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="truncate text-[11px] font-medium text-foreground">{p.page || "/"}</span>
                        <span className="text-[11px] font-bold text-primary ml-2 shrink-0 tabular-nums">{Number(p.views).toLocaleString()}</span>
                      </div>
                      <div className="h-1 w-full bg-muted/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(var(--primary)/0.7), hsl(var(--primary)))` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Plan distribution */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 shadow-sm">
            <SectionHeader icon={PieChartIcon} title="Plan Distribution" color="bg-fuchsia-100 text-fuchsia-600"/>
            {(data?.plan_distribution||[]).length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No subscription data</p>
            ) : (
              <>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.plan_distribution} dataKey="count" nameKey="plan" cx="50%" cy="50%" innerRadius={32} outerRadius={52} paddingAngle={3} strokeWidth={0}>
                        {data.plan_distribution.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>)}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, fontWeight: 600, borderRadius: 10, border: "1px solid hsl(var(--border))" }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-1">
                  {data.plan_distribution.map((p: any, i: number) => (
                    <div key={p.plan} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}/>
                        {p.plan}
                      </span>
                      <span className="text-[11px] font-bold text-foreground">{p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Conversion funnel */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 shadow-sm">
            <SectionHeader icon={ArrowUpRight} title="Conversion Funnel" color="bg-emerald-100 text-emerald-600"/>
            <div className="space-y-3">
              {[
                { label: "Total Visitors",  value: data?.total_visitors||0, color: "bg-violet-500",  pct: 100 },
                { label: "Registered",      value: data?.total_users||0,    color: "bg-cyan-500",    pct: Math.min(100, Math.round(((data?.total_users||0)/(data?.total_visitors||1))*100)) },
                { label: "Paid",            value: data?.paid_users||0,     color: "bg-emerald-500", pct: Math.min(100, Math.round(((data?.paid_users||0)/(data?.total_visitors||1))*100)) },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-muted-foreground">{row.label}</span>
                    <span className="text-[11px] font-bold text-foreground tabular-nums">{fmt(row.value)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                    <div className={`h-full ${row.color} rounded-full transition-all duration-700`} style={{ width: `${row.pct}%` }}/>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">Paid Conversion Rate</span>
                <span className="text-[11px] font-extrabold text-emerald-600">{convRate}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
