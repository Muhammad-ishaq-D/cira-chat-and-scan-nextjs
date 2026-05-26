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
import SdkLoadingOverlay from "@/components/SdkLoadingOverlay";

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

      {/* ═══════════ CAMERA VIEW — 3-column layout ═══════════ */}
      {/* Always kept in DOM so the ShenAI SDK can finish its deferred DOM cleanup
          without hitting unmounted nodes (removeChild NotFoundError). */}
      <div
        className={`flex-1 flex justify-center overflow-hidden ${(status === "idle" || status === "loading") ? "bg-black" : "bg-gray-50"}`}
       style={{
  visibility: isCameraView ? "visible" : "hidden",
  pointerEvents: isCameraView ? "auto" : "none",
  position: isCameraView ? "relative" : "absolute",
  inset: isCameraView ? undefined : 0,
  opacity: isCameraView ? 1 : 0,
}}
      >

          {/* ── Left: Instructions Panel ── */}
          <div className={(status === "idle" || status === "loading") ? "hidden" : "hidden lg:flex w-72 xl:w-80 shrink-0 bg-white border-r border-gray-100 flex-col overflow-y-auto"}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ScanFace size={16} className="text-primary" />
                </div>
                <h2 className="font-heading font-semibold text-foreground">How to Scan</h2>
              </div>

              <div className="space-y-5">
                {[
                  { step: "1", icon: Zap, title: "Good Lighting", desc: "Ensure your face is well-lit. Natural light or a bright room works best." },
                  { step: "2", icon: UserRound, title: "Position Your Face", desc: "Center your face in the camera and keep it within the red markers." },
                  { step: "3", icon: Activity, title: "Stay Still", desc: "Keep your head and body steady during the 30-second measurement." },
                  { step: "4", icon: Wind, title: "Breathe Normally", desc: "Breathe naturally. Don't hold your breath or take deep breaths." },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground font-heading">{item.title}</p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  <p className="text-[11px] font-semibold text-foreground">100% Private</p>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">All analysis happens on your device. No video is recorded or transmitted.</p>
              </div>

              {!isGuest && (
                <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertCircle size={12} className="text-primary" />
                    <p className="text-[11px] font-semibold text-primary">Scan Credits</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {scansLeft === "Unlimited" ? "Unlimited scans available" : `${scansLeft ?? 0} scan${scansLeft === 1 ? "" : "s"} remaining`}
                  </p>
                </div>
              )}

              {/* History button */}
              {!isGuest && (
                <button
                  onClick={() => { const next = !showHistory; setShowHistory(next); if (next) logAuditEvent("OPEN_VITALS_SCAN_HISTORY"); }}
                  className="mt-4 w-full h-9 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Menu size={14} strokeWidth={1.5} />
                  Scan History
                </button>
              )}
            </div>
          </div>

          {/* ── Center: Camera ── */}
          <div className="flex-1 relative flex flex-col bg-black overflow-hidden mx-auto w-full md:max-w-[640px] md:aspect-[16/10] md:self-start md:mt-4 md:rounded-2xl">
            <canvas
              id={CANVAS_ID}
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ display: "block" }}
            />

            {/* Idle/Loading overlay */}
            {(status === "idle" || status === "loading") && (
              <SdkLoadingOverlay status={status} progress={progress} />
            )}

            {/* Progress overlay during measurement */}
            {(status === "measuring" || status === "processing") && (
              <div className="absolute bottom-4 left-4 right-4 z-10">
                <div className="bg-black/70 backdrop-blur-xl rounded-2xl px-5 py-3 flex items-center gap-4 border border-white/10">
                  {status === "processing" || progress >= 100 ? (
                    <div className="flex-1 flex items-center justify-center py-1">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                      <span className="text-sm font-medium text-white">Analyzing results...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-white font-heading min-w-[3ch] text-right">{progress}%</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6">
                <AlertCircle size={40} className={`mb-3 opacity-80 ${status === "unsupported" ? "text-amber-400" : "text-destructive"}`} />
                <h3 className="text-white text-base font-heading font-semibold mb-2 text-center">
                  {status === "unsupported" ? "Browser not supported" : "Something went wrong"}
                </h3>
                <p className="text-white/70 text-xs font-body mb-5 max-w-sm text-center leading-relaxed">{error}</p>
                {status === "unsupported" && (
                  <div className="text-[11px] text-white/50 font-body mb-5 max-w-xs text-center leading-relaxed">
                    Tip: copy the link and open it in <span className="text-white/80">Safari</span> or <span className="text-white/80">Chrome</span> directly.
                  </div>
                )}
                <div className="flex gap-2.5">
                  <button onClick={() => navigate(isGuest ? "/" : "/dashboard")} className="h-10 px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-medium transition-all">
                    Go back
                  </button>
                  {status !== "unsupported" && (
                    <button onClick={reset} className="h-10 px-5 rounded-full bg-primary text-primary-foreground text-xs font-medium transition-all">
                      Try again
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Top bar — home button only (history moved to left panel) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-end p-3 md:p-4">
              <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm bg-black/20 border border-white/10" title="Back to Dashboard">
                <Home size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Mobile history + start buttons at bottom */}
            <div className="lg:hidden absolute bottom-4 left-4 z-20">
              {!isGuest && (
                <button
                  onClick={() => { const next = !showHistory; setShowHistory(next); if (next) logAuditEvent("OPEN_VITALS_SCAN_HISTORY"); }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all backdrop-blur-sm bg-black/20 border border-white/10"
                >
                  <Menu size={18} strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Floating Action Button */}
            <div className="absolute z-20 right-4 bottom-4">
              {status === "ready" && (
                noScansLeft ? (
                  <button
                    type="button"
                    onClick={() => navigate("/upgrade")}
                    className="relative z-30 px-6 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-2xl shadow-amber-400/40 hover:shadow-amber-400/60 transition-all flex items-center justify-center gap-2 active:scale-95 ring-4 ring-amber-400/20 font-semibold text-sm"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Crown size={20} />
                    <span>Upgrade to Scan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("[VitalsScan] Start button clicked");
                      startMeasurement();
                    }}
                    className="relative z-30 px-6 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all flex items-center justify-center gap-2 active:scale-95 ring-4 ring-primary/20 font-semibold text-sm"
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Heart size={22} />
                    <span>Start</span>
                  </button>
                )
              )}
              {status === "error" && (
                <button onClick={reset} className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl shadow-primary/40 transition-all flex items-center justify-center active:scale-95 ring-4 ring-primary/20">
                  <RefreshCw size={22} />
                </button>
              )}
            </div>
          </div>

          {/* ── Right: Vitals Panel ── */}
          <div className={(status === "idle" || status === "loading") ? "hidden" : "hidden lg:flex w-72 xl:w-80 shrink-0 bg-white border-l border-gray-100 flex-col overflow-y-auto"}>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Heart size={16} className="text-rose-500" />
                </div>
                <h2 className="font-heading font-semibold text-foreground">Vitals</h2>
              </div>

              {/* Status indicator */}
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2.5 ${
                (status === "measuring" || status === "processing") ? "bg-primary/10 border border-primary/20" :
                status === "ready" ? "bg-emerald-50 border border-emerald-200" :
                "bg-gray-50 border border-gray-100"
              }`}>
                {(status === "measuring" || status === "processing") ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-primary">
                        {status === "processing" || progress >= 100 ? "Analyzing..." : "Measuring..."}
                      </p>
                      {status !== "processing" && progress < 100 && (
                        <div className="mt-1.5 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0">{progress}%</span>
                  </>
                ) : status === "ready" ? (
                  <>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <p className="text-xs font-medium text-emerald-700">Ready to scan</p>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                    <p className="text-xs font-medium text-muted-foreground">Initializing...</p>
                  </>
                )}
              </div>

              {/* Vital placeholder cards */}
              <div className="space-y-2">
                {[
                  { label: "Heart Rate", unit: "bpm", icon: Heart, color: "text-red-500", bg: "bg-red-50" },
                  { label: "Blood Pressure", unit: "mmHg", icon: Activity, color: "text-pink-500", bg: "bg-pink-50" },
                  { label: "Breathing Rate", unit: "/min", icon: Wind, color: "text-cyan-500", bg: "bg-cyan-50" },
                  { label: "Stress Index", unit: "/100", icon: Brain, color: "text-purple-500", bg: "bg-purple-50" },
                  { label: "HRV", unit: "ms", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
                  { label: "Cardiac Workload", unit: "", icon: Heart, color: "text-orange-500", bg: "bg-orange-50" },
                  { label: "BMI", unit: "kg/m²", icon: Scale, color: "text-emerald-500", bg: "bg-emerald-50" },
                ].map((vital) => {
                  const Icon = vital.icon;
                  return (
                    <div key={vital.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${vital.bg}`}>
                        <Icon size={14} className={vital.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-muted-foreground font-body">{vital.label}</p>
                        <p className="text-sm font-semibold text-foreground font-heading">
                          --<span className="text-[10px] text-muted-foreground font-normal ml-0.5">{vital.unit}</span>
                        </p>
                      </div>
                      {(status === "measuring" || status === "processing") && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-4 leading-relaxed">
                Values appear after scan completes
              </p>
            </div>
          </div>

        </div>

      {/* ═══════════ RESULTS VIEW ═══════════ */}
      {!isCameraView && (
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
               <button
  onClick={() => window.location.reload()}
  className="h-10 px-4 md:px-6 rounded-xl border border-border/60 text-foreground text-sm font-medium hover:bg-accent transition-all"
>
  Scan Again
</button>
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
