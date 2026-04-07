import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, Camera, Heart, Wind, Brain, Zap, Scale, AlertCircle, Menu, Plus, ScanFace, Sparkles, FileText } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";

const mockScanHistory = [
  { id: "1", date: "Today, 10:32 AM", status: "Completed", hr: "72 bpm" },
  { id: "2", date: "Mar 28, 4:15 PM", status: "Completed", hr: "68 bpm" },
  { id: "3", date: "Mar 25, 9:00 AM", status: "Completed", hr: "75 bpm" },
  { id: "4", date: "Mar 20, 11:45 AM", status: "Completed", hr: "70 bpm" },
];

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
];

const VitalsScan = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const startScan = () => {
    setScanning(true);
    setScanComplete(false);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setScanComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  const scanResults = [
    { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, color: "text-red-500 bg-red-50" },
    { label: "Blood Pressure", value: "118/76", unit: "mmHg", icon: Heart, color: "text-pink-500 bg-pink-50" },
    { label: "Breathing Rate", value: "16", unit: "/min", icon: Wind, color: "text-cyan-500 bg-cyan-50" },
    { label: "Stress Index", value: "32", unit: "/100", icon: Brain, color: "text-purple-500 bg-purple-50" },
    { label: "HRV", value: "54", unit: "ms", icon: Zap, color: "text-amber-500 bg-amber-50" },
    { label: "BMI", value: "22.4", unit: "kg/m²", icon: Scale, color: "text-emerald-500 bg-emerald-50" },
  ];

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div className="w-[72px] border-r border-border bg-card flex flex-col items-center py-4 shrink-0">
        <div className="mb-4">
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
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  item.id === "scan"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} />
                ) : (
                  <Icon size={18} strokeWidth={item.id === "scan" ? 2 : 1.5} />
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

      {/* Scan history drawer */}
      {showHistory && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/10"
            style={{ left: 72 }}
            onClick={() => setShowHistory(false)}
          />
          <div
            className="fixed top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out]"
            style={{ left: 72 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Scan History</p>
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body px-2 mb-2">Recent Scans</p>
              {mockScanHistory.map((scan) => (
                <button
                  key={scan.id}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-body transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                >
                  <div className="flex items-center gap-2">
                    <ScanFace size={14} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{scan.date}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{scan.hr} · {scan.status}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Hamburger for scan history */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all bg-card/60 backdrop-blur-sm border border-border/40 shadow-sm"
          title="Scan History"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div className="fixed inset-0 pointer-events-none" style={{ left: 72 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Vitals Scan
            </h1>
            <p className="text-sm text-muted-foreground font-body">AI-powered face scan to measure your vitals in 30 seconds</p>
          </div>

          {/* Scan Area */}
          {!scanComplete ? (
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 mb-8 shadow-sm flex flex-col items-center">
              {/* Camera Preview Placeholder */}
              <div className="w-56 h-56 rounded-full border-4 border-dashed border-border/60 flex items-center justify-center mb-6 relative overflow-hidden">
                {scanning ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary/20 to-transparent transition-all duration-300"
                      style={{ height: `${progress}%` }}
                    />
                    <div className="relative z-10 text-center">
                      <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{progress}%</p>
                      <p className="text-xs text-muted-foreground mt-1">Scanning...</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <Camera size={40} className="text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">Position your face</p>
                  </div>
                )}
              </div>

              {/* Credits Info */}
              <div className="flex items-center gap-2 mb-5">
                <AlertCircle size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">2 scans</span> remaining on Basic plan
                </p>
              </div>

              <button
                onClick={startScan}
                disabled={scanning}
                className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-60"
              >
                {scanning ? "Scanning..." : "Start Face Scan"}
              </button>

              {/* Instructions */}
              <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-md">
                {[
                  { step: "1", text: "Good lighting" },
                  { step: "2", text: "Face the camera" },
                  { step: "3", text: "Stay still 30s" },
                ].map((s) => (
                  <div key={s.step} className="text-center">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center mx-auto mb-1.5">
                      <span className="text-[10px] font-semibold text-muted-foreground">{s.step}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Scan Results */
            <div>
              <div className="bg-card/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Scan Complete</p>
                    <p className="text-xs text-muted-foreground">All vitals measured successfully</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {scanResults.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${v.color.split(" ")[1]}`}>
                          <Icon size={14} className={v.color.split(" ")[0]} />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body">{v.label}</p>
                      </div>
                      <p className="text-xl font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                        {v.value}
                        <span className="text-xs text-muted-foreground font-normal ml-1">{v.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setScanComplete(false); setProgress(0); }}
                  className="h-11 px-6 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-accent transition-all"
                >
                  Scan Again
                </button>
                <button
                  onClick={() => navigate("/dashboard")}
                  className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl transition-all"
                >
                  View Full Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VitalsScan;
