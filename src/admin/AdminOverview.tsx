import { Users, MessageSquare, ScanFace, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Globe, Clock, Eye } from "lucide-react";

const stats = [
  { label: "Total Users", value: "1,248", change: "+12%", up: true, icon: Users, color: "bg-blue-50 text-blue-600" },
  { label: "Active Today", value: "342", change: "+8%", up: true, icon: Activity, color: "bg-emerald-50 text-emerald-600" },
  { label: "Total Scans", value: "3,890", change: "+23%", up: true, icon: ScanFace, color: "bg-purple-50 text-purple-600" },
  { label: "Chat Messages", value: "45.2K", change: "+18%", up: true, icon: MessageSquare, color: "bg-primary/10 text-primary" },
  { label: "Revenue (MTD)", value: "₹4,82,000", change: "+15%", up: true, icon: CreditCard, color: "bg-amber-50 text-amber-600" },
  { label: "Churn Rate", value: "3.2%", change: "-0.4%", up: false, icon: TrendingUp, color: "bg-red-50 text-red-500" },
];

const systemHealth = [
  { label: "API Response Time", value: "124ms", status: "healthy" },
  { label: "Server Uptime", value: "99.98%", status: "healthy" },
  { label: "Database Load", value: "32%", status: "healthy" },
  { label: "AI Model Latency", value: "890ms", status: "warning" },
  { label: "Storage Used", value: "68 GB / 200 GB", status: "healthy" },
  { label: "Active Connections", value: "1,204", status: "healthy" },
];

const recentActivity = [
  { user: "Priya Sharma", avatar: "PS", action: "Upgraded to Pro Plan", time: "2 min ago", type: "upgrade" },
  { user: "Rahul Verma", avatar: "RV", action: "Completed Face Scan #2891", time: "5 min ago", type: "scan" },
  { user: "Anita Das", avatar: "AD", action: "New account created", time: "12 min ago", type: "signup" },
  { user: "Vikram Singh", avatar: "VS", action: "Chat session — 32 messages", time: "18 min ago", type: "chat" },
  { user: "Meera Patel", avatar: "MP", action: "Payment ₹499 received", time: "25 min ago", type: "payment" },
  { user: "Arjun Reddy", avatar: "AR", action: "Generated health report", time: "31 min ago", type: "report" },
  { user: "Kavya Nair", avatar: "KN", action: "Account suspended — policy violation", time: "45 min ago", type: "alert" },
  { user: "Sanjay Gupta", avatar: "SG", action: "Downgraded to Free Plan", time: "1 hr ago", type: "downgrade" },
];

const topPages = [
  { page: "/chat", views: "12,430", sessions: "3,201" },
  { page: "/vitals-scan", views: "8,920", sessions: "2,118" },
  { page: "/dashboard", views: "7,650", sessions: "4,830" },
  { page: "/reports", views: "4,210", sessions: "1,980" },
  { page: "/doctor", views: "2,890", sessions: "940" },
];

const planDistribution = [
  { plan: "Free", count: 842, pct: 67, color: "bg-muted" },
  { plan: "Pro", count: 318, pct: 26, color: "bg-primary" },
  { plan: "Enterprise", count: 88, pct: 7, color: "bg-amber-500" },
];

const activityColor: Record<string, string> = {
  upgrade: "bg-emerald-50 text-emerald-600",
  scan: "bg-purple-50 text-purple-600",
  signup: "bg-blue-50 text-blue-600",
  chat: "bg-primary/10 text-primary",
  payment: "bg-amber-50 text-amber-600",
  report: "bg-cyan-50 text-cyan-600",
  alert: "bg-red-50 text-red-500",
  downgrade: "bg-muted text-muted-foreground",
};

const AdminOverview = () => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8 space-y-6">
    {/* Header */}
    <div>
      <p className="text-sm text-muted-foreground font-body mb-1">Super Admin</p>
      <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        Dashboard Overview 👋
      </h1>
      <p className="text-sm text-muted-foreground font-body">April 8, 2026 • Real-time data</p>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                <Icon size={16} />
              </div>
              <div className={`flex items-center gap-0.5 text-xs font-medium ${s.up ? "text-emerald-600" : "text-red-500"}`}>
                {s.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {s.change}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground font-body mb-0.5">{s.label}</p>
            <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{s.value}</p>
          </div>
        );
      })}
    </div>

    {/* Two Column: Activity + System Health */}
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Activity Feed */}
      <div className="lg:col-span-3 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Live Activity</h2>
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>
        <div className="space-y-1">
          {recentActivity.map((a, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${activityColor[a.type]}`}>
                {a.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">
                  <span className="font-medium">{a.user}</span>
                </p>
                <p className="text-xs text-muted-foreground truncate">{a.action}</p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{a.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-4">
        {/* System Health */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>System Health</h2>
          <div className="space-y-3">
            {systemHealth.map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{s.value}</span>
                  <span className={`w-2 h-2 rounded-full ${s.status === "healthy" ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
          <h2 className="text-base font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Plan Distribution</h2>
          {/* Bar */}
          <div className="flex h-3 rounded-full overflow-hidden mb-4 gap-0.5">
            {planDistribution.map((p) => (
              <div key={p.plan} className={`${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
            ))}
          </div>
          <div className="space-y-2">
            {planDistribution.map((p) => (
              <div key={p.plan} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                  <span className="text-xs text-muted-foreground">{p.plan}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{p.count} ({p.pct}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Top Pages */}
    <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Globe size={16} className="text-muted-foreground" />
        <h2 className="text-base font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Top Pages</h2>
      </div>
      <div className="space-y-2">
        {topPages.map((p, i) => (
          <div key={p.page} className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0">
            <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
            <span className="text-sm font-mono text-foreground flex-1">{p.page}</span>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye size={12} /> {p.views}</span>
              <span className="flex items-center gap-1"><Clock size={12} /> {p.sessions}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminOverview;
