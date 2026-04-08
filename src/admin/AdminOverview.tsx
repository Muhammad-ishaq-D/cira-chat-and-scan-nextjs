import { Users, MessageSquare, ScanFace, CreditCard } from "lucide-react";

const stats = [
  { label: "Total Users", value: "1,248", icon: Users, color: "text-blue-500 bg-blue-50" },
  { label: "Chat Messages", value: "45.2K", icon: MessageSquare, color: "text-primary bg-primary/10" },
  { label: "Face Scans", value: "3,890", icon: ScanFace, color: "text-emerald-500 bg-emerald-50" },
  { label: "Revenue", value: "$12,400", icon: CreditCard, color: "text-amber-500 bg-amber-50" },
];

const recentActivity = [
  { user: "Priya Sharma", action: "Upgraded to Pro", time: "2 min ago" },
  { user: "Rahul Verma", action: "Used Face Scan", time: "5 min ago" },
  { user: "Anita Das", action: "Signed up", time: "12 min ago" },
  { user: "Vikram Singh", action: "Chat — 32 messages", time: "18 min ago" },
  { user: "Meera Patel", action: "Payment ₹499", time: "25 min ago" },
];

const AdminOverview = () => (
  <div className="p-6 space-y-6">
    <h1 className="font-heading text-2xl font-semibold text-foreground">Dashboard Overview</h1>

    {/* Stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <div key={s.label} className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon size={16} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>

    {/* Recent Activity */}
    <div className="bg-card rounded-xl border border-border p-5">
      <h2 className="font-heading text-base font-semibold text-foreground mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {recentActivity.map((a, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{a.user}</p>
              <p className="text-xs text-muted-foreground">{a.action}</p>
            </div>
            <span className="text-xs text-muted-foreground">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AdminOverview;
