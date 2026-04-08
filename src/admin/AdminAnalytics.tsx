import { TrendingUp, Users, ScanFace, MessageSquare, Clock, Globe, Smartphone, Monitor, ArrowUpRight } from "lucide-react";

const dailyStats = [
  { day: "Mon", users: 280, scans: 45, chats: 1200 },
  { day: "Tue", users: 310, scans: 52, chats: 1450 },
  { day: "Wed", users: 295, scans: 48, chats: 1320 },
  { day: "Thu", users: 342, scans: 61, chats: 1680 },
  { day: "Fri", users: 320, scans: 55, chats: 1520 },
  { day: "Sat", users: 190, scans: 32, chats: 890 },
  { day: "Sun", users: 165, scans: 28, chats: 760 },
];

const maxUsers = Math.max(...dailyStats.map((d) => d.users));

const featureUsage = [
  { feature: "AI Chat", sessions: "12,430", avgDuration: "4.2 min", satisfaction: "94%", icon: MessageSquare, color: "bg-primary/10 text-primary" },
  { feature: "Face Scan", sessions: "3,890", avgDuration: "1.8 min", satisfaction: "91%", icon: ScanFace, color: "bg-purple-50 text-purple-600" },
  { feature: "Health Reports", sessions: "2,210", avgDuration: "3.1 min", satisfaction: "88%", icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
  { feature: "Doctor Booking", sessions: "940", avgDuration: "2.5 min", satisfaction: "96%", icon: Users, color: "bg-emerald-50 text-emerald-600" },
];

const deviceBreakdown = [
  { device: "Mobile (iOS)", pct: 42, color: "bg-blue-500" },
  { device: "Mobile (Android)", pct: 35, color: "bg-emerald-500" },
  { device: "Desktop", pct: 18, color: "bg-purple-500" },
  { device: "Tablet", pct: 5, color: "bg-amber-500" },
];

const topLocations = [
  { city: "Mumbai", users: 312, pct: 25 },
  { city: "Delhi NCR", users: 248, pct: 20 },
  { city: "Bangalore", users: 186, pct: 15 },
  { city: "Hyderabad", users: 124, pct: 10 },
  { city: "Chennai", users: 99, pct: 8 },
  { city: "Pune", users: 87, pct: 7 },
  { city: "Others", users: 192, pct: 15 },
];

const retentionData = [
  { period: "Day 1", rate: "82%" },
  { period: "Day 7", rate: "54%" },
  { period: "Day 14", rate: "41%" },
  { period: "Day 30", rate: "32%" },
  { period: "Day 60", rate: "24%" },
  { period: "Day 90", rate: "19%" },
];

const AdminAnalytics = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
    <div>
      <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Analytics</h1>
      <p className="text-sm text-muted-foreground font-body">Usage patterns, retention, and engagement insights</p>
    </div>

    {/* Weekly Activity Chart */}
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Weekly Active Users</h2>
      <div className="flex items-end gap-2 h-32">
        {dailyStats.map((d) => (
          <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] font-medium text-foreground">{d.users}</span>
            <div
              className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-lg transition-all"
              style={{ height: `${(d.users / maxUsers) * 100}%` }}
            />
            <span className="text-[10px] text-muted-foreground">{d.day}</span>
          </div>
        ))}
      </div>
    </div>

    {/* Feature Usage */}
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Feature Usage</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {featureUsage.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.feature} className="bg-accent/20 rounded-xl p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{f.feature}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{f.sessions} sessions</span>
                  <span>•</span>
                  <span>Avg {f.avgDuration}</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-emerald-600">{f.satisfaction}</span>
                  <span className="text-[10px] text-muted-foreground">satisfaction</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>

    {/* Two columns: Devices + Locations */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Device Breakdown */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Devices</h2>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
          {deviceBreakdown.map((d) => (
            <div key={d.device} className={`${d.color} rounded-full`} style={{ width: `${d.pct}%` }} />
          ))}
        </div>
        <div className="space-y-2">
          {deviceBreakdown.map((d) => (
            <div key={d.device} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${d.color}`} />
                <span className="text-xs text-muted-foreground">{d.device}</span>
              </div>
              <span className="text-xs font-medium text-foreground">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Locations */}
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={16} className="text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Top Locations</h2>
        </div>
        <div className="space-y-2.5">
          {topLocations.map((l) => (
            <div key={l.city} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">{l.city}</span>
              <div className="flex-1 h-2 bg-accent/30 rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full" style={{ width: `${l.pct}%` }} />
              </div>
              <span className="text-xs font-medium text-foreground w-10 text-right">{l.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Retention */}
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>User Retention</h2>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {retentionData.map((r) => (
          <div key={r.period} className="bg-accent/20 rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{r.rate}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{r.period}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminAnalytics;
