import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, Heart, Wind, Brain, Zap, Scale, AlertCircle, Menu, ScanFace, Sparkles, FileText, UserRound, Activity, RefreshCw } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useShenAI, type VitalResults } from "@/hooks/useShenAI";
import { vitalsApi, userApi } from "@/lib/apiClient";
import { getUser, logout } from "@/lib/auth";
import { toast } from "sonner";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const CANVAS_ID = "shenai-canvas";

const formatVitalsForDisplay = (r: VitalResults) => [
  { label: "Heart Rate", value: String(Math.round(r.heartRate)), unit: "bpm", icon: Heart, color: "text-red-500 bg-red-50" },
  { label: "Blood Pressure", value: r.systolicBP && r.diastolicBP ? `${Math.round(r.systolicBP)}/${Math.round(r.diastolicBP)}` : "--", unit: "mmHg", icon: Activity, color: "text-pink-500 bg-pink-50" },
  { label: "Breathing Rate", value: r.breathingRate ? String(Math.round(r.breathingRate)) : "--", unit: "/min", icon: Wind, color: "text-cyan-500 bg-cyan-50" },
  { label: "Stress Index", value: r.stressIndex != null ? String(Math.round(r.stressIndex)) : "--", unit: "/100", icon: Brain, color: "text-purple-500 bg-purple-50" },
  { label: "HRV", value: r.hrvSdnn != null ? String(Math.round(r.hrvSdnn)) : "--", unit: "ms", icon: Zap, color: "text-amber-500 bg-amber-50" },
  { label: "Cardiac Workload", value: r.cardiacWorkload != null ? String(Math.round(r.cardiacWorkload)) : "--", unit: "", icon: Heart, color: "text-orange-500 bg-orange-50" },
  { label: "Parasympathetic Activity", value: r.parasympatheticActivity != null ? String(Math.round(r.parasympatheticActivity)) : "--", unit: "", icon: Zap, color: "text-teal-500 bg-teal-50" },
  { label: "BMI", value: r.bmi != null ? r.bmi.toFixed(1) : "--", unit: "kg/m²", icon: Scale, color: "text-emerald-500 bg-emerald-50" },
];

const VitalsScan = () => {
  const navigate = useNavigate();
  const { status, progress, error, results, initialize, startMeasurement, reset, cleanup } = useShenAI();
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitRef = useRef(false);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    vitalsApi.getHistory()
      .then((data) => setScanHistory(Array.isArray(data) ? data : data.scans || []))
      .catch(() => {});
    userApi.getProfile()
      .then((data) => setUserProfile(data))
      .catch(() => {});
  }, []);

  // Clean up SDK on unmount only — don't auto-init (needs user gesture for camera)
  useEffect(() => {
    return () => { cleanup(); hasInitRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!results) return;

    let isActive = true;

    const saveScan = async () => {
      const payload = Object.fromEntries(
        Object.entries({
          timestamp: new Date().toISOString(),
          heart_rate: Number.isFinite(results.heartRate) ? Math.round(results.heartRate) : undefined,
          systolic_bp: results.systolicBP != null ? Math.round(results.systolicBP) : undefined,
          diastolic_bp: results.diastolicBP != null ? Math.round(results.diastolicBP) : undefined,
          breathing_rate: results.breathingRate != null ? Math.round(results.breathingRate) : undefined,
          stress_index: results.stressIndex != null ? Math.round(results.stressIndex) : undefined,
          hrv_sdnn: results.hrvSdnn != null ? Math.round(results.hrvSdnn) : undefined,
          bmi: results.bmi != null ? Number(results.bmi.toFixed(1)) : undefined,
          signal_quality: results.signalQuality != null ? Number(results.signalQuality.toFixed(4)) : undefined,
        }).filter(([, value]) => value !== undefined && value !== null && !(typeof value === "number" && Number.isNaN(value)))
      );

      try {
        await vitalsApi.submitScan(payload);

        if (!isActive) return;

        const historyData = await vitalsApi.getHistory().catch(() => null);
        if (isActive && historyData) {
          setScanHistory(Array.isArray(historyData) ? historyData : historyData.scans || []);
        }

        toast.success("Scan saved · 1 scan credit used");
      } catch (err: any) {
        if (!isActive) return;

        if (err?.message?.includes("insufficient") || err?.message?.includes("credits")) {
          toast.error("No scan credits remaining. Upgrade your plan.", {
            action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
            duration: 8000,
          });
        } else {
          console.error("[Scan] Submit error:", err);
          toast.error(err?.message || "Failed to save scan to backend");
        }
      }
    };

    saveScan();

    return () => {
      isActive = false;
    };
  }, [results, navigate]);

  const displayVitals = results ? formatVitalsForDisplay(results) : [];

  const handleAnalyzeWithCira = () => {
    if (!results) return;
    // Store vitals as plain serializable data (icons can't be JSON-serialized)
    const serializableVitals = displayVitals.map(v => ({
      label: v.label,
      value: v.value,
      unit: v.unit,
      color: v.color,
    }));
    sessionStorage.setItem("cira_scan_vitals", JSON.stringify(serializableVitals));
    navigate("/chat");
  };

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-4"><img src={ciraLogo} alt="Cira" width={28} height={28} /></div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => {
                if (item.id === "home") navigate("/dashboard");
                if (item.id === "chat") navigate("/chat");
                if (item.id === "scan") navigate("/vitals-scan");
                if (item.id === "reports") navigate("/reports");
                if (item.id === "doctor") navigate("/doctor");
              }} className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                item.id === "scan" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}>
                {item.id === "chat" ? <AiSparkleIcon size={18} /> : <Icon size={18} strokeWidth={item.id === "scan" ? 2 : 1.5} />}
                <span className="text-[9px] font-body font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button onClick={() => { logout(); navigate("/login"); }} className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">{initials}</div>
          </ProfilePopover>
        </div>
      </div>

      {/* Scan history drawer */}
      {showHistory && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" style={{ left: 72 }} onClick={() => setShowHistory(false)} />
          <div className="fixed top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out]" style={{ left: 72 }} onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground font-heading">Scan History</p>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body px-2 mb-2">Recent Scans</p>
              {scanHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No scans yet</p>
              ) : (
                scanHistory.map((scan: any) => (
                  <button key={scan.id} className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-body transition-all text-muted-foreground hover:bg-accent/50 hover:text-foreground">
                    <div className="flex items-center gap-2">
                      <ScanFace size={14} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{scan.date || scan.created_at}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{scan.hr || scan.heart_rate || "--"} bpm · {scan.status || "Completed"}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <button onClick={() => setShowHistory(!showHistory)} className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all bg-card/60 backdrop-blur-sm border border-border/40 shadow-sm" title="Scan History">
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div className="fixed inset-0 pointer-events-none" style={{ left: 72 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-1 font-heading">Vitals Scan</h1>
            <p className="text-sm text-muted-foreground font-body">AI-powered face scan to measure your vitals in 30 seconds</p>
          </div>

          {status !== "finished" ? (
            <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-8 shadow-sm flex flex-col items-center">
              {/* Camera canvas — explicit height required for WASM renderer */}
              <div className="w-full max-w-xl rounded-2xl overflow-hidden bg-black border border-border/30 mb-6 relative" style={{ height: 480 }}>
                <canvas
                  id={CANVAS_ID}
                  ref={canvasRef}
                  style={{ display: "block", width: "100%", height: "100%" }}
                />
                {status === "idle" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                    <ScanFace size={48} className="text-primary mb-3 opacity-60" />
                    <p className="text-sm text-white/70 font-body">Tap below to start camera</p>
                  </div>
                )}
                {status === "measuring" && (
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="bg-card/90 backdrop-blur-sm rounded-xl px-4 py-2.5 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-foreground font-heading">{progress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 mb-4 text-destructive">
                  <AlertCircle size={14} />
                  <p className="text-xs">{error}</p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-5">
                <AlertCircle size={14} className="text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Credits will be deducted upon scan · 100% on-device processing</p>
              </div>

              <div className="flex gap-3">
                {status === "ready" && (
                  <button onClick={startMeasurement} className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    Start Face Scan
                  </button>
                )}
                {status === "measuring" && (
                  <button disabled className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm opacity-60 cursor-not-allowed">
                    Scanning...
                  </button>
                )}
                {status === "error" && (
                  <button onClick={reset} className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2">
                    <RefreshCw size={16} /> Try Again
                  </button>
                )}
                {status === "idle" && (
                  <button onClick={() => initialize(CANVAS_ID, {
                    age: userProfile?.age || undefined,
                    height: userProfile?.height || undefined,
                    weight: userProfile?.weight || undefined,
                    gender: userProfile?.biological_sex || undefined,
                  })} className="h-12 px-8 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all flex items-center gap-2">
                    <ScanFace size={18} /> Start Camera
                  </button>
                )}
              </div>

              {(status === "ready" || status === "idle") && (
                <div className="mt-6 grid grid-cols-3 gap-4 w-full max-w-md">
                  {[{ step: "1", text: "Good lighting" }, { step: "2", text: "Face the camera" }, { step: "3", text: "Stay still 30s" }].map((s) => (
                    <div key={s.step} className="text-center">
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center mx-auto mb-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground">{s.step}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{s.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="bg-card/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-6 mb-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground font-heading">Scan Complete</p>
                    <p className="text-xs text-muted-foreground">All vitals measured successfully · Signal quality: {results ? `${Math.round(results.signalQuality * 100)}%` : "--"}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {displayVitals.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${v.color.split(" ")[1]}`}>
                          <Icon size={14} className={v.color.split(" ")[0]} />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-body">{v.label}</p>
                      </div>
                      <p className="text-xl font-semibold text-foreground font-heading">
                        {v.value}<span className="text-xs text-muted-foreground font-normal ml-1">{v.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3">
                <button onClick={reset} className="h-11 px-6 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-accent transition-all">Scan Again</button>
                <button onClick={handleAnalyzeWithCira} className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
                  Analyze with Cira
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default VitalsScan;
