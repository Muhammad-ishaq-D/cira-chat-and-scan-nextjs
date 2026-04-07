import { useNavigate } from "react-router-dom";
import { Home, Clock, LogOut, Heart, Wind, Brain, Zap, Scale, TrendingUp, ShieldCheck, AlertTriangle, ScanFace, Activity, Sparkles, FileText, UserRound } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const vitals = [
  { label: "Blood Pressure", value: "118/76", unit: "mmHg", icon: Heart },
  { label: "Heart Rate", value: "72", unit: "bpm", icon: Activity },
  { label: "Heart Rate Variability", value: "54", unit: "ms", icon: Zap },
  { label: "Cardiac Workload", value: "Normal", unit: "", icon: Heart },
  { label: "Breathing Rate", value: "16", unit: "/min", icon: Wind },
  { label: "Stress Index", value: "32", unit: "/100", icon: Brain },
  { label: "Body Mass Index", value: "22.4", unit: "kg/m²", icon: Scale },
  { label: "Parasympathetic Activity", value: "High", unit: "", icon: Zap },
];

const healthIndices = [
  { label: "Vascular Age", value: "28", unit: "yrs" },
  { label: "Wellness Score", value: "82", unit: "/100" },
  { label: "Waist-to-Height Ratio", value: "0.46", unit: "" },
  { label: "Body Fat Percentage", value: "18.2", unit: "%" },
  { label: "Basal Metabolic Rate", value: "1,680", unit: "kcal" },
  { label: "Body Shape Index", value: "0.074", unit: "" },
  { label: "Total Daily Energy", value: "2,240", unit: "kcal" },
];

const healthRisks = [
  { label: "Cardiovascular Risk", level: "Low" },
  { label: "Coronary Heart Disease", level: "Low" },
  { label: "Stroke Risk", level: "Low" },
  { label: "Heart Failure Risk", level: "Low" },
  { label: "Diabetes Risk", level: "Moderate" },
  { label: "Fatty Liver Disease", level: "Low" },
  { label: "Cardiovascular Event", level: "Low" },
];

const riskColor = (level: string) => {
  if (level === "Low") return "text-emerald-600 bg-emerald-50";
  if (level === "Moderate") return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const activeNav: string = "home";

  return (
    <div className="h-screen flex bg-background">
      {/* Slim icon sidebar */}
      <div className="w-[72px] border-r border-border bg-card flex flex-col items-center py-4 shrink-0">
        <div className="mb-6">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "home") navigate("/dashboard");
                  if (item.id === "chat") navigate("/chat");
                  if (item.id === "scan") navigate("/vitals-scan");
                  if (item.id === "reports") navigate("/reports");
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  activeNav === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} active={activeNav === item.id} />
                ) : (
                  <Icon size={18} strokeWidth={activeNav === item.id ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-body font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => navigate("/")}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
              AX
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Gradient background */}
        <div className="fixed inset-0 pointer-events-none" style={{ left: 72 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-muted-foreground font-body mb-1">Welcome back</p>
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Good Morning, Alex 👋
            </h1>
            <p className="text-sm text-muted-foreground font-body">March 29, 2026</p>
          </div>

          {/* Overall Health Card */}
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <ShieldCheck size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-body">Overall Health</p>
                <p className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Excellent</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-body ml-[52px]">
              All vitals within normal range. <span className="text-amber-600 font-medium">1 item needs attention.</span>
            </p>
          </div>

          {/* Vital Signs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Vital Signs</h2>
            <p className="text-xs text-muted-foreground font-body mb-4">Measured entirely from the face scan</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {vitals.map((v) => {
                const Icon = v.icon;
                return (
                  <div key={v.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-body leading-tight">{v.label}</p>
                    </div>
                    <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                      {v.value}
                      <span className="text-xs text-muted-foreground font-normal ml-1">{v.unit}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Health Indices */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Health Indices</h2>
            <p className="text-xs text-muted-foreground font-body mb-4">Based on scan and user data</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {healthIndices.map((h) => (
                <div key={h.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-secondary/60 flex items-center justify-center">
                      <TrendingUp size={14} className="text-muted-foreground" />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body leading-tight">{h.label}</p>
                  </div>
                  <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {h.value}
                    <span className="text-xs text-muted-foreground font-normal ml-1">{h.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Health Risks */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Health Risks</h2>
            <p className="text-xs text-muted-foreground font-body mb-4">Based on scan and user data</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {healthRisks.map((r) => (
                <div key={r.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md hover:border-border transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${r.level === "Low" ? "bg-emerald-50" : "bg-amber-50"}`}>
                      <AlertTriangle size={14} className={r.level === "Low" ? "text-emerald-600" : "text-amber-600"} />
                    </div>
                    <p className="text-[11px] text-muted-foreground font-body leading-tight">{r.label}</p>
                  </div>
                  <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${riskColor(r.level)}`}>
                    {r.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
