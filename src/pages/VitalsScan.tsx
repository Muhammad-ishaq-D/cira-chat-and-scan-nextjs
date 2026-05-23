import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Home, LogOut, Heart, Wind, Brain, Zap, Scale, AlertCircle, Menu, ScanFace, Sparkles, FileText, UserRound, Activity, RefreshCw, ShieldCheck, Flame, TrendingUp, LogIn, Info, Crown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useShenAI, type VitalResults, type HealthRisksData } from "@/hooks/useShenAI";
import { vitalsApi, userApi } from "@/lib/apiClient";
import { getUser, logout, isAuthenticated, getToken } from "@/lib/auth";
import { clearDocumentReload, hasRecentDocumentReload, isDocumentCrossOriginIsolated, markDocumentReload } from "@/lib/browserContext";
import { getDeviceId } from "@/lib/freeCredits";
import { toast } from "sonner";
import { secureStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { logAuditEvent } from "@/lib/audit";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
];

const CANVAS_ID = "shenai-canvas";
const VITALS_SCAN_RELOAD_KEY = "cira_vitals_scan_context_reload";

const formatVitalsForDisplay = (r: VitalResults) => [
  { label: "Heart Rate", value: String(Math.round(r.heartRate)), unit: "bpm", icon: Heart, color: "text-red-500 bg-red-50" },
  { label: "Blood Pressure", value: r.systolicBP && r.diastolicBP ? `${Math.round(r.systolicBP)}/${Math.round(r.diastolicBP)}` : "--", unit: "mmHg", icon: Activity, color: "text-pink-500 bg-pink-50" },
  { label: "Breathing Rate", value: r.breathingRate ? String(Math.round(r.breathingRate)) : "--", unit: "/min", icon: Wind, color: "text-cyan-500 bg-cyan-50" },
  { label: "Stress Index", value: r.stressIndex != null ? String(Math.round(r.stressIndex)) : "--", unit: "/100", icon: Brain, color: "text-purple-500 bg-purple-50" },
  { label: "HRV", value: r.hrvSdnn != null ? String(Math.round(r.hrvSdnn)) : "--", unit: "ms", icon: Zap, color: "text-amber-500 bg-amber-50" },
  { label: "Cardiac Workload", value: r.cardiacWorkload != null ? String(Math.round(r.cardiacWorkload)) : "--", unit: "", icon: Heart, color: "text-orange-500 bg-orange-50" },
  { label: "BMI", value: r.bmi != null ? r.bmi.toFixed(1) : "--", unit: "kg/m²", icon: Scale, color: "text-emerald-500 bg-emerald-50" },
];

const formatHealthIndexes = (h: HealthRisksData) => [
  ...(h.wellnessScore != null ? [{ label: "Wellness Score", value: String(Math.round(h.wellnessScore)), unit: "/100", icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" }] : []),
  ...(h.vascularAge != null ? [{ label: "Vascular Age", value: String(Math.round(h.vascularAge)), unit: "yrs", icon: TrendingUp, color: "text-blue-600 bg-blue-50" }] : []),
  ...(h.bodyFatPercentage != null ? [{ label: "Body Fat", value: h.bodyFatPercentage.toFixed(1), unit: "%", icon: Scale, color: "text-orange-600 bg-orange-50" }] : []),
  ...(h.basalMetabolicRate != null ? [{ label: "Basal Metabolic Rate", value: String(Math.round(h.basalMetabolicRate)), unit: "kcal", icon: Flame, color: "text-red-600 bg-red-50" }] : []),
  ...(h.totalDailyEnergyExpenditure != null ? [{ label: "Daily Energy", value: String(Math.round(h.totalDailyEnergyExpenditure)), unit: "kcal", icon: Flame, color: "text-amber-600 bg-amber-50" }] : []),
  ...(h.waistToHeightRatio != null ? [{ label: "Waist-to-Height", value: h.waistToHeightRatio.toFixed(2), unit: "", icon: Scale, color: "text-violet-600 bg-violet-50" }] : []),
  ...(h.cvOverallRisk != null ? [{ label: "CV Disease Risk", value: (h.cvOverallRisk * 100).toFixed(1), unit: "%", icon: Heart, color: "text-rose-600 bg-rose-50" }] : []),
  ...(h.hypertensionRisk != null ? [{ label: "Hypertension Risk", value: (h.hypertensionRisk * 100).toFixed(1), unit: "%", icon: Activity, color: "text-red-600 bg-red-50" }] : []),
  ...(h.diabetesRisk != null ? [{ label: "Diabetes Risk", value: (h.diabetesRisk * 100).toFixed(1), unit: "%", icon: AlertCircle, color: "text-yellow-600 bg-yellow-50" }] : []),
];

const VitalsScan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isGuest = searchParams.get("guest") === "1" || !isAuthenticated();
  const { status, progress, error, results, initialize, startMeasurement, reset, cleanup } = useShenAI();
  const [showHistory, setShowHistory] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInitRef = useRef(false);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "G";

  const [userProfile, setUserProfile] = useState<any>(null);

  const scansLeft = userProfile?.credits?.face_scans;
  const noScansLeft = !isGuest && scansLeft !== "Unlimited" && typeof scansLeft === "number" && scansLeft <= 0;

  useEffect(() => {
    let cancelled = false;
    let reloadTimer: number | undefined;

    const ensureSecureScannerContext = async () => {
      if (isDocumentCrossOriginIsolated()) {
        clearDocumentReload(VITALS_SCAN_RELOAD_KEY);
        return true;
      }

      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !window.isSecureContext) {
        console.error("[VitalsScan] Secure context or service workers are unavailable.");
        return false;
      }

      try {
        await navigator.serviceWorker.register("/coi-serviceworker.js");
        await navigator.serviceWorker.ready;
      } catch (serviceWorkerError) {
        console.error("[VitalsScan] Failed to register COI service worker:", serviceWorkerError);
        return false;
      }

      if (cancelled) return false;

      if (!navigator.serviceWorker.controller || !isDocumentCrossOriginIsolated()) {
        // Only reload ONCE — if reload didn't fix isolation (e.g., preview iframe blocks SW),
        // bail out instead of looping.
        if (!hasRecentDocumentReload(VITALS_SCAN_RELOAD_KEY, 30000)) {
          markDocumentReload(VITALS_SCAN_RELOAD_KEY);
          reloadTimer = window.setTimeout(() => {
            window.location.reload();
          }, 250);
        } else {
          console.error("[VitalsScan] COI service worker is active, but the page is still not cross-origin isolated. Stopping reload loop.");
          // Keep the reload marker so we don't try again this session
        }

        return false;
      }

      clearDocumentReload(VITALS_SCAN_RELOAD_KEY);
      return true;
    };

    const init = async () => {
      if (hasInitRef.current) return;

      const canInitialize = await ensureSecureScannerContext();
      if (!canInitialize || cancelled) return;

      hasInitRef.current = true;

      if (isGuest) {
        try {
          const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
          const scanCheck = await fetch(`${API_BASE}/api/guest/scan-check`, {
            headers: { "X-Device-Id": getDeviceId() },
          });
          const scanData = await scanCheck.json();
          if (!scanData.allowed) {
            toast.error("Free guest scan limit reached. Login to get more scans.");
            navigate("/login");
            return;
          }
        } catch {
          toast.error("Could not verify scan eligibility. Please try again.");
          return;
        }

        initialize(CANVAS_ID);
        return;
      }

      // Use cached profile to start SDK init immediately (no network wait).
      // The 34MB WASM download dominates load time, so kick it off ASAP.
      const cachedUser = getUser() as any;
      initialize(CANVAS_ID, {
        age: cachedUser?.age || undefined,
        height: cachedUser?.height || undefined,
        weight: cachedUser?.weight || undefined,
        gender: cachedUser?.biological_sex || cachedUser?.gender || undefined,
      });

      // Fetch history + fresh profile in parallel (non-blocking)
      vitalsApi.getHistory()
        .then((data) => setScanHistory(Array.isArray(data) ? data : data.scans || []))
        .catch(() => { });

      userApi.getProfile()
        .then((freshProfile) => {
          if (cancelled) return;
          setUserProfile(freshProfile);
          const scansLeft = freshProfile?.credits?.face_scans;
          if (scansLeft !== "Unlimited" && typeof scansLeft === "number" && scansLeft <= 0) {
            toast.error("No scan credits remaining. Upgrade your plan.", {
              action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
              duration: 8000,
            });
          }
        })
        .catch(() => { });
    };

    void init();

    return () => {
      cancelled = true;
      if (reloadTimer) {
        window.clearTimeout(reloadTimer);
      }
      cleanup();
      hasInitRef.current = false;
    };
  }, [cleanup, initialize, isGuest, navigate]);


  useEffect(() => {
    if (!results) return;

    let isActive = true;

    const saveScan = async () => {
      // Guest mode: notify backend scan was used, don't save results
      if (isGuest) {
        try {
          const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
          await fetch(`${API_BASE}/api/guest/scan-used`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Device-Id": getDeviceId() },
          });
        } catch { }
        toast.success("Scan complete! (Guest mode — login to save)");
        return;
      }

      const hr = results.healthRisks;
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
          cardiac_workload: results.cardiacWorkload != null ? Math.round(results.cardiacWorkload) : undefined,
          signal_quality: results.signalQuality != null ? Number(results.signalQuality.toFixed(4)) : undefined,
          wellness_score: hr?.wellnessScore != null ? Math.round(hr.wellnessScore) : undefined,
          vascular_age: hr?.vascularAge != null ? Math.round(hr.vascularAge) : undefined,
          body_fat_percentage: hr?.bodyFatPercentage != null ? Number(hr.bodyFatPercentage.toFixed(1)) : undefined,
          basal_metabolic_rate: hr?.basalMetabolicRate != null ? Math.round(hr.basalMetabolicRate) : undefined,
          total_daily_energy_expenditure: hr?.totalDailyEnergyExpenditure != null ? Math.round(hr.totalDailyEnergyExpenditure) : undefined,
          waist_to_height_ratio: hr?.waistToHeightRatio != null ? Number(hr.waistToHeightRatio.toFixed(3)) : undefined,
          body_shape_index: hr?.aBodyShapeIndex != null ? Number(hr.aBodyShapeIndex.toFixed(4)) : undefined,
          fatty_liver_risk: hr?.fattyLiverRisk != null ? hr.fattyLiverRisk : undefined,
          parasympathetic_activity: results.parasympatheticActivity != null ? Math.round(results.parasympatheticActivity) : undefined,
          cv_disease_risk: hr?.cvOverallRisk != null ? Number((hr.cvOverallRisk * 100).toFixed(1)) : undefined,
          coronary_heart_disease_risk: hr?.coronaryHeartDiseaseRisk != null ? Number((hr.coronaryHeartDiseaseRisk * 100).toFixed(1)) : undefined,
          stroke_risk: hr?.strokeRisk != null ? Number((hr.strokeRisk * 100).toFixed(1)) : undefined,
          heart_failure_risk: hr?.heartFailureRisk != null ? Number((hr.heartFailureRisk * 100).toFixed(1)) : undefined,
          hypertension_risk: hr?.hypertensionRisk != null ? Number((hr.hypertensionRisk * 100).toFixed(1)) : undefined,
          diabetes_risk: hr?.diabetesRisk != null ? Number((hr.diabetesRisk * 100).toFixed(1)) : undefined,
          hard_cv_event_risk: hr?.hardCVEventRisk != null ? Number((hr.hardCVEventRisk * 100).toFixed(1)) : undefined,
        }).filter(([, value]) => value !== undefined && value !== null && !(typeof value === "number" && Number.isNaN(value)))
      );

      try {
        await vitalsApi.submitScan(payload);
        if (!isActive) return;
        userApi.getProfile()
          .then((data) => { if (isActive) setUserProfile(data); })
          .catch(() => { });
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
          const msg = typeof err?.message === 'string' ? err.message : String(err);
          console.error("[Scan] Submit error:", msg);
          toast.error(msg || "Failed to save scan to backend");
        }
      }
    };

    saveScan();
    return () => { isActive = false; };
  }, [results, navigate, isGuest]);

  const displayVitals = results ? formatVitalsForDisplay(results) : [];
  const displayHealthIndexes = results?.healthRisks ? formatHealthIndexes(results.healthRisks) : [];

  const handleAnalyzeWithCira = () => {
    if (!results) return;
    const serializableVitals = [...displayVitals, ...displayHealthIndexes].map(v => ({
      label: v.label, value: v.value, unit: v.unit, color: v.color,
    }));
    secureStorage.set("scan_vitals", serializableVitals, true);
    if (!isGuest) {
      logAuditEvent("ANALYZE_VITALS_WITH_CIRA");
    }
    navigate(isGuest ? "/free-chat" : "/chat");
  };


  // Whether we're in immersive camera mode (not finished / results)
  const isCameraView = status !== "finished";

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar — desktop only, hidden during camera view and for guests */}
      {!isCameraView && !isGuest && (
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
                  if (item.id === "scan") {
                    if (noScansLeft) {
                      toast.error("No scan credits remaining. Upgrade your plan.", { action: { label: "Upgrade", onClick: () => navigate("/upgrade") }, duration: 6000 });
                      return;
                    }
                    navigate("/vitals-scan");
                  }
                  if (item.id === "reports") navigate("/reports");
                  if (item.id === "doctor") navigate("/doctor");
                }} className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${item.id === "scan" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
      )}

      {/* Scan history drawer — hidden for guests */}
      {showHistory && !isGuest && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowHistory(false)} />
          <div className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground font-heading">Scan History</p>
              <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
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

      {/* ═══════════ CAMERA VIEW — Split Layout ═══════════ */}
      {isCameraView ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-black">

          {/* ── Left: Camera Panel ── */}
          <div className="relative flex-1 bg-black overflow-hidden" style={{ minHeight: '55vh' }}>
            <canvas
              id={CANVAS_ID}
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: "block" }}
            />

            {/* Idle/Loading overlay — camera side spinner */}
            {(status === "idle" || status === "loading") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3 border-2 border-primary/20">
                  <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-white/60 text-xs font-body">Initializing camera…</p>
              </div>
            )}

            {/* Error overlay — camera side */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6">
                <AlertCircle size={36} className={`mb-3 opacity-80 ${status === "unsupported" ? "text-amber-400" : "text-destructive"}`} />
                <p className="text-white/70 text-xs font-body text-center leading-relaxed max-w-[200px]">{error}</p>
              </div>
            )}

            {/* Progress bar — bottom of camera */}
            {status === "measuring" && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-black/60 backdrop-blur-xl rounded-xl px-4 py-2.5 flex items-center gap-3 border border-white/10">
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-white font-heading min-w-[3ch] text-right">{progress}%</span>
                </div>
              </div>
            )}

            {/* Top bar — history + home */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
              <button
                onClick={() => {
                  const nextState = !showHistory;
                  setShowHistory(nextState);
                  if (nextState) logAuditEvent("OPEN_VITALS_SCAN_HISTORY");
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm bg-black/20 border border-white/10"
                title="History"
              >
                <Menu size={17} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm bg-black/20 border border-white/10"
                title="Back to Dashboard"
              >
                <Home size={17} strokeWidth={1.5} />
              </button>
            </div>

            {/* Mobile-only action button — bottom right */}
            <div className="md:hidden absolute z-20 right-4" style={{ bottom: 'max(env(safe-area-inset-bottom, 16px), 80px)' }}>
              {status === "ready" && (
                noScansLeft ? (
                  <button type="button" onClick={() => navigate("/upgrade")}
                    className="px-5 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-xl flex items-center gap-2 active:scale-95 font-semibold text-sm">
                    <Crown size={18} /><span>Upgrade</span>
                  </button>
                ) : (
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startMeasurement(); }}
                    className="px-5 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl flex items-center gap-2 active:scale-95 font-semibold text-sm">
                    <Heart size={20} /><span>Start</span>
                  </button>
                )
              )}
              {status === "error" && (
                <button onClick={reset} className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl flex items-center justify-center active:scale-95">
                  <RefreshCw size={20} />
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Instructions / Status Panel ── */}
          <div className="hidden md:flex w-80 lg:w-96 bg-background border-l border-border flex-col shrink-0">
            {/* Panel header */}
            <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5 mb-0.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ScanFace size={16} className="text-primary" />
                </div>
                <h2 className="text-sm font-semibold text-foreground font-heading">Face Scan</h2>
              </div>
              <p className="text-[11px] text-muted-foreground font-body ml-[42px]">Non-invasive vitals via camera</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">

              {/* Status indicator */}
              <div className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium font-body
                ${status === "idle" || status === "loading" ? "bg-amber-50 border-amber-200/60 text-amber-700" :
                  status === "ready" ? "bg-emerald-50 border-emerald-200/60 text-emerald-700" :
                  status === "measuring" ? "bg-blue-50 border-blue-200/60 text-blue-700" :
                  status === "error" || status === "unsupported" ? "bg-red-50 border-red-200/60 text-red-700" :
                  "bg-muted border-border text-muted-foreground"}`}>
                {(status === "idle" || status === "loading") && <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />}
                {status === "ready" && <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                {status === "measuring" && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
                {(status === "error" || status === "unsupported") && <AlertCircle size={13} className="shrink-0" />}
                <span>
                  {status === "idle" || status === "loading" ? "Initializing scanner…" :
                   status === "ready" ? "Camera ready · Press Start" :
                   status === "measuring" ? `Scanning · ${progress}% complete` :
                   status === "unsupported" ? "Browser not supported" :
                   status === "error" ? "Scan error" : status}
                </span>
              </div>

              {/* Progress bar — right panel */}
              {status === "measuring" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-muted-foreground font-body">Progress</span>
                    <span className="text-[11px] font-semibold text-foreground font-heading">{progress}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-body mt-2">Keep your face centered and stay still</p>
                </div>
              )}

              {/* Instructions */}
              <div>
                <p className="text-[11px] font-semibold text-foreground font-heading mb-2.5 uppercase tracking-wide">Setup Guide</p>
                <div className="space-y-2">
                  {[
                    { step: "01", icon: "💡", title: "Good lighting", desc: "Face a window or bright light source" },
                    { step: "02", icon: "📱", title: "Hold steady", desc: "Prop your device or rest your arms" },
                    { step: "03", icon: "👤", title: "Center your face", desc: "Keep face fully visible in frame" },
                    { step: "04", icon: "⏱️", title: "Stay still", desc: "30 seconds — avoid moving or talking" },
                  ].map((s) => (
                    <div key={s.step} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">{s.icon}</div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground font-body leading-none mb-0.5">{s.title}</p>
                        <p className="text-[10px] text-muted-foreground font-body leading-snug">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Metrics that will be measured */}
              <div>
                <p className="text-[11px] font-semibold text-foreground font-heading mb-2.5 uppercase tracking-wide">Vitals Measured</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Heart Rate", icon: Heart, color: "text-red-500" },
                    { label: "Blood Pressure", icon: Activity, color: "text-pink-500" },
                    { label: "Breathing Rate", icon: Wind, color: "text-cyan-500" },
                    { label: "Stress Index", icon: Brain, color: "text-purple-500" },
                    { label: "HRV", icon: Zap, color: "text-amber-500" },
                    { label: "Wellness Score", icon: ShieldCheck, color: "text-emerald-500" },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <div key={m.label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                        <Icon size={11} className={m.color} />
                        <span className="text-[10px] text-muted-foreground font-body leading-none">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/40 border border-border/40">
                <AlertCircle size={12} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground font-body leading-snug">Screening tool only — not a substitute for medical diagnosis. 1 credit used per scan · 100% on-device processing.</p>
              </div>

            </div>

            {/* Desktop action button — panel footer */}
            <div className="px-6 py-4 border-t border-border shrink-0">
              {status === "ready" && (
                noScansLeft ? (
                  <button type="button" onClick={() => navigate("/upgrade")}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 hover:opacity-90 transition-all active:scale-[0.98]">
                    <Crown size={18} /><span>Upgrade to Scan</span>
                  </button>
                ) : (
                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); startMeasurement(); }}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all active:scale-[0.98]">
                    <Heart size={18} /><span>Start Scan</span>
                  </button>
                )
              )}
              {status === "error" && (
                <div className="flex gap-2">
                  <button onClick={() => navigate(isGuest ? "/" : "/dashboard")}
                    className="flex-1 h-11 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-all">
                    Go back
                  </button>
                  {status !== "unsupported" && (
                    <button onClick={reset}
                      className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
                      Try again
                    </button>
                  )}
                </div>
              )}
              {(status === "idle" || status === "loading" || status === "measuring") && (
                <div className="h-11 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 border-t-transparent animate-spin" />
                  <span className="text-xs text-muted-foreground font-body">
                    {status === "measuring" ? "Scan in progress…" : "Setting up…"}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ═══════════ RESULTS VIEW ═══════════ */
        <div className="flex-1 relative flex flex-col overflow-hidden">
          {/* Background gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
            <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 md:px-6 pt-4 md:py-8 pb-24 md:pb-8">
              {/* Header */}
              <div className="mb-4 md:mb-8 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-lg md:text-2xl font-semibold text-foreground font-heading">Scan Results</h1>
                  <p className="text-[11px] md:text-sm text-muted-foreground font-body">Your vitals have been analyzed</p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="shrink-0 inline-flex items-center gap-1 h-7 px-2.5 rounded-full border border-border/60 bg-card/80 backdrop-blur-sm text-[10px] md:text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      aria-label="Accuracy information"
                    >
                      <Info size={11} />
                      Accuracy
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-72 p-3 text-[11px] leading-relaxed">
                    <p className="font-semibold text-foreground mb-1.5 text-[12px]">Clinically validated accuracy</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li><span className="text-foreground font-medium">Heart Rate:</span> ±2 BPM vs ECG</li>
                      <li><span className="text-foreground font-medium">Blood Pressure:</span> ±5 mmHg vs cuff</li>
                      <li><span className="text-foreground font-medium">SpO₂:</span> ±2% vs pulse oximeter</li>
                      <li><span className="text-foreground font-medium">Respiratory Rate:</span> ±2 breaths/min</li>
                      <li><span className="text-foreground font-medium">HRV / Stress:</span> validated vs ECG</li>
                    </ul>
                    <p className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                      Screening tool only — not a substitute for medical diagnosis. Best with good lighting & a still face.
                    </p>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="bg-card/80 backdrop-blur-sm border border-emerald-200/60 rounded-2xl p-3 md:p-6 mb-3 md:mb-6 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 6L9 17l-5-5" /></svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground font-heading">Scan Complete</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">Signal quality: {results ? `${Math.round(results.signalQuality * 100)}%` : "--"}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-6">
                {displayVitals.map((v) => {
                  const Icon = v.icon;
                  return (
                    <div key={v.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-2.5 md:p-4">
                      <div className="flex items-center gap-1.5 mb-1.5 md:mb-3">
                        <div className={`w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg flex items-center justify-center ${v.color.split(" ")[1]}`}>
                          <Icon size={11} className={v.color.split(" ")[0]} />
                        </div>
                        <p className="text-[9px] md:text-[11px] text-muted-foreground font-body leading-tight">{v.label}</p>
                      </div>
                      <p className="text-base md:text-xl font-semibold text-foreground font-heading">
                        {v.value}<span className="text-[9px] md:text-xs text-muted-foreground font-normal ml-0.5">{v.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Health Indexes */}
              {displayHealthIndexes.length > 0 && (
                <>
                  <div className="flex items-center gap-1.5 mb-2 mt-1">
                    <ShieldCheck size={13} className="text-primary" />
                    <p className="text-xs font-semibold text-foreground font-heading">Health Indexes</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-3 md:mb-6">
                    {displayHealthIndexes.map((v) => {
                      const Icon = v.icon;
                      return (
                        <div key={v.label} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-2.5 md:p-4">
                          <div className="flex items-center gap-1.5 mb-1.5 md:mb-3">
                            <div className={`w-5 h-5 md:w-7 md:h-7 rounded-md md:rounded-lg flex items-center justify-center ${v.color.split(" ")[1]}`}>
                              <Icon size={11} className={v.color.split(" ")[0]} />
                            </div>
                            <p className="text-[9px] md:text-[11px] text-muted-foreground font-body leading-tight">{v.label}</p>
                          </div>
                          <p className="text-base md:text-xl font-semibold text-foreground font-heading">
                            {v.value}<span className="text-[9px] md:text-xs text-muted-foreground font-normal ml-0.5">{v.unit}</span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Action buttons */}
              <div className="flex gap-2.5 pb-2">
                <button onClick={reset} className="h-10 px-4 md:px-6 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-accent transition-all">Scan Again</button>
                <button onClick={handleAnalyzeWithCira} className="h-10 px-4 md:px-6 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 transition-all flex-1 md:flex-none">
                  Analyze with Cira
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Bottom nav only visible on results view, hidden for guests */}
      {!isCameraView && !isGuest && <MobileBottomNav />}
    </div>
  );
};

export default VitalsScan;
