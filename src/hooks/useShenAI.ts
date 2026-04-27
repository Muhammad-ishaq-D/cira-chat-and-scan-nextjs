import { useState, useRef, useCallback, useEffect } from "react";
import type { ShenaiSDK, MeasurementResults, InitializationSettings, HealthRisks, RisksFactors } from "shenai-sdk";

const SHENAI_API_KEY = "5709b1dea46a4a2ca1ea9c6592c970db";

export type ShenAIStatus = "idle" | "loading" | "ready" | "measuring" | "finished" | "error" | "unsupported";

export interface VitalResults {
  heartRate: number;
  systolicBP: number | null;
  diastolicBP: number | null;
  breathingRate: number | null;
  stressIndex: number | null;
  hrvSdnn: number | null;
  bmi: number | null;
  cardiacWorkload: number | null;
  parasympatheticActivity: number | null;
  signalQuality: number;
  raw: MeasurementResults;
  healthRisks: HealthRisksData | null;
}

export interface HealthRisksData {
  wellnessScore: number | null;
  vascularAge: number | null;
  bodyFatPercentage: number | null;
  waistToHeightRatio: number | null;
  basalMetabolicRate: number | null;
  totalDailyEnergyExpenditure: number | null;
  bodyRoundnessIndex: number | null;
  conicityIndex: number | null;
  aBodyShapeIndex: number | null;
  hypertensionRisk: number | null;
  diabetesRisk: number | null;
  cvOverallRisk: number | null;
  coronaryHeartDiseaseRisk: number | null;
  strokeRisk: number | null;
  heartFailureRisk: number | null;
  peripheralVascularDiseaseRisk: number | null;
  coronaryDeathRisk: number | null;
  fatalStrokeRisk: number | null;
  totalCVMortality: number | null;
  hardCVEventRisk: number | null;
  fattyLiverRisk: number | null;
}

export interface UserProfileData {
  age?: number | string | null;
  height?: number | string | null;
  weight?: number | string | null;
  gender?: string | null;
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function normalizeGender(value: unknown): "male" | "female" | "other" | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim().toLowerCase();
  if (normalized === "male" || normalized === "female" || normalized === "other") {
    return normalized;
  }

  return undefined;
}

function normalizeUserProfile(userProfile?: UserProfileData): UserProfileData | undefined {
  if (!userProfile) return undefined;

  const age = toFiniteNumber(userProfile.age);
  const height = toFiniteNumber(userProfile.height);
  const weight = toFiniteNumber(userProfile.weight);
  const gender = normalizeGender(userProfile.gender);

  if (age == null && height == null && weight == null && !gender) {
    return undefined;
  }

  return {
    ...(age != null ? { age } : {}),
    ...(height != null ? { height } : {}),
    ...(weight != null ? { weight } : {}),
    ...(gender ? { gender } : {}),
  };
}

function getEnumValue(value: { value?: number } | number | null | undefined): number | null {
  if (typeof value === "number") return value;

  if (value && typeof value === "object" && typeof value.value === "number") {
    return value.value;
  }

  return null;
}

function buildRiskFactors(sdk: ShenaiSDK, userProfile?: UserProfileData, raw?: MeasurementResults | null): RisksFactors {
  const factors: RisksFactors = {};
  const age = toFiniteNumber(userProfile?.age);
  const height = toFiniteNumber(userProfile?.height);
  const weight = toFiniteNumber(userProfile?.weight);
  const gender = normalizeGender(userProfile?.gender);

  if (age != null) factors.age = age;
  if (height != null) factors.bodyHeight = height;
  if (weight != null) factors.bodyWeight = weight;
  if (gender) {
    factors.gender = sdk.Gender[
      gender === "male" ? "MALE" : gender === "female" ? "FEMALE" : "OTHER"
    ];
  }
  if (raw?.systolic_blood_pressure_mmhg != null) factors.sbp = raw.systolic_blood_pressure_mmhg;
  if (raw?.diastolic_blood_pressure_mmhg != null) factors.dbp = raw.diastolic_blood_pressure_mmhg;

  return factors;
}

function mergeHealthRisksData(primary: HealthRisksData | null, fallback: HealthRisksData | null): HealthRisksData | null {
  if (!primary && !fallback) return null;

  const pick = <K extends keyof HealthRisksData>(key: K) =>
    (primary?.[key] ?? fallback?.[key] ?? null) as HealthRisksData[K];

  return {
    wellnessScore: pick("wellnessScore"),
    vascularAge: pick("vascularAge"),
    bodyFatPercentage: pick("bodyFatPercentage"),
    waistToHeightRatio: pick("waistToHeightRatio"),
    basalMetabolicRate: pick("basalMetabolicRate"),
    totalDailyEnergyExpenditure: pick("totalDailyEnergyExpenditure"),
    bodyRoundnessIndex: pick("bodyRoundnessIndex"),
    conicityIndex: pick("conicityIndex"),
    aBodyShapeIndex: pick("aBodyShapeIndex"),
    hypertensionRisk: pick("hypertensionRisk"),
    diabetesRisk: pick("diabetesRisk"),
    cvOverallRisk: pick("cvOverallRisk"),
    coronaryHeartDiseaseRisk: pick("coronaryHeartDiseaseRisk"),
    strokeRisk: pick("strokeRisk"),
    heartFailureRisk: pick("heartFailureRisk"),
    peripheralVascularDiseaseRisk: pick("peripheralVascularDiseaseRisk"),
    coronaryDeathRisk: pick("coronaryDeathRisk"),
    fatalStrokeRisk: pick("fatalStrokeRisk"),
    totalCVMortality: pick("totalCVMortality"),
    hardCVEventRisk: pick("hardCVEventRisk"),
    fattyLiverRisk: pick("fattyLiverRisk"),
  };
}

function extractHealthRisks(risks: HealthRisks): HealthRisksData {
  return {
    wellnessScore: risks.wellnessScore,
    vascularAge: risks.vascularAge,
    bodyFatPercentage: risks.bodyFatPercentage,
    waistToHeightRatio: risks.waistToHeightRatio,
    basalMetabolicRate: risks.basalMetabolicRate,
    totalDailyEnergyExpenditure: risks.totalDailyEnergyExpenditure,
    bodyRoundnessIndex: risks.bodyRoundnessIndex,
    conicityIndex: risks.conicityIndex,
    aBodyShapeIndex: risks.aBodyShapeIndex,
    hypertensionRisk: risks.hypertensionRisk ?? null,
    diabetesRisk: risks.diabetesRisk ?? null,
    cvOverallRisk: risks.cvDiseases?.overallRisk ?? null,
    coronaryHeartDiseaseRisk: risks.cvDiseases?.coronaryHeartDiseaseRisk ?? null,
    strokeRisk: risks.cvDiseases?.strokeRisk ?? null,
    heartFailureRisk: risks.cvDiseases?.heartFailureRisk ?? null,
    peripheralVascularDiseaseRisk: risks.cvDiseases?.peripheralVascularDiseaseRisk ?? null,
    coronaryDeathRisk: risks.hardAndFatalEvents?.coronaryDeathEventRisk ?? null,
    fatalStrokeRisk: risks.hardAndFatalEvents?.fatalStrokeEventRisk ?? null,
    totalCVMortality: risks.hardAndFatalEvents?.totalCVMortalityRisk ?? null,
    hardCVEventRisk: risks.hardAndFatalEvents?.hardCVEventRisk ?? null,
    fattyLiverRisk: getEnumValue(risks.nonAlcoholicFattyLiverDiseaseRisk),
  };
}

export function useShenAI() {
  const [status, setStatus] = useState<ShenAIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VitalResults | null>(null);
  const sdkRef = useRef<ShenaiSDK | null>(null);
  const pollRef = useRef<number | null>(null);
  const riskProfileRef = useRef<UserProfileData | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (sdkRef.current) {
      try { sdkRef.current.deinitialize(); } catch {}
      sdkRef.current = null;
    }
    riskProfileRef.current = undefined;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const initialize = useCallback(async (canvasId: string, userProfile?: UserProfileData) => {
    cleanup();
    setStatus("loading");
    setError(null);
    setResults(null);
    setProgress(0);

    try {
      const ShenAI = (await import("shenai-sdk")).default;
      const sdk: ShenaiSDK = await ShenAI({
        // Disable SDK's internal preload canvas — we render our own React loader,
        // and skipping this avoids extra canvas rendering work during WASM init.
        enablePreloadDisplay: false,
        locateFile: (filename: string) => {
          if (filename.endsWith(".wasm")) return "/wasm/shenai_sdk.wasm";
          return filename;
        },
        onWasmLoadingProgress: (p: number) => setProgress(Math.round(p * 100)),
      } as any);

      sdkRef.current = sdk;
      const normalizedProfile = normalizeUserProfile(userProfile);
      riskProfileRef.current = normalizedProfile;
      const riskFactors = buildRiskFactors(sdk, normalizedProfile);

      const settings: InitializationSettings = {
        operatingMode: sdk.OperatingMode.POSITIONING,
        measurementPreset: sdk.MeasurementPreset.THIRTY_SECONDS_ALL_METRICS,
        precisionMode: sdk.PrecisionMode.RELAXED,
        cameraMode: sdk.CameraMode.FACING_USER,
        onboardingMode: sdk.OnboardingMode.HIDDEN,
        showUserInterface: true,
        showFacePositioningOverlay: true,
        showVisualWarnings: true,
        enableCameraSwap: false,
        showFaceMask: true,
        showBloodFlow: true,
        hideShenaiLogo: true,
        enableStartAfterSuccess: false,
        enableSummaryScreen: false,
        showStartStopButton: false,
        showInfoButton: false,
        showDisclaimer: false,
        enableHealthRisks: true,
        ...(Object.keys(riskFactors).length > 0 ? { risksFactors: riskFactors } : {}),
      };

      const canvasSelector = `#${canvasId}`;

      sdk.initialize(SHENAI_API_KEY, "cira-user", settings, (result) => {
        console.log("[ShenAI] init result:", result.value);
        if (result.value === 0) {
          setStatus("ready");
          sdk.attachToCanvas(canvasSelector, true);
        } else {
          const errors: Record<number, string> = {
            1: "Invalid API key",
            2: "Connection error — check your internet",
            3: "Internal SDK error",
          };
          setError(errors[result.value] || "Initialization failed");
          setStatus("error");
        }
      });
    } catch (err: any) {
      console.error("[ShenAI] init error:", err);
      const msg = String(err?.message || err || "");
      // Catch the "invalid value type 'exn'" CompileError that slips through
      // when validate() lies (some WebViews) or when other WASM features fail.
      if (
        msg.includes("invalid value type") ||
        msg.includes("CompileError") ||
        msg.includes("exn") ||
        err?.name === "CompileError"
      ) {
        setError(
          "Your browser doesn't support the technology needed for the face scan. Please open Cira in the latest Chrome, Safari (17.4+), Edge, or Firefox — and avoid in-app browsers (Facebook, Instagram, etc.)."
        );
        setStatus("unsupported");
      } else {
        setError(err.message || "Failed to load Shen AI SDK");
        setStatus("error");
      }
    }
  }, [cleanup]);

  const startMeasurement = useCallback(() => {
    const sdk = sdkRef.current;
    if (!sdk) return;

    setStatus("measuring");
    setProgress(0);
    sdk.setOperatingMode(sdk.OperatingMode.MEASURE);
    sdk.startMeasurement();

    pollRef.current = window.setInterval(() => {
      try {
        const mState = sdk.getMeasurementState();
        let prog = 0;
        if (typeof sdk.getMeasurementProgressPercentage === "function") {
          prog = sdk.getMeasurementProgressPercentage();
        }
        if (typeof prog === "number" && prog > 0) setProgress(Math.round(prog));

        // FINISHED
        if (mState.value === 6 || mState.value === sdk.MeasurementState?.FINISHED?.value) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setProgress(100);

          const raw = sdk.getMeasurementResults();
          let healthRisks: HealthRisksData | null = null;

          try {
            const directRisks = sdk.getHealthRisks();
            const computedFactors = buildRiskFactors(sdk, riskProfileRef.current, raw);
            const computedRisks = Object.keys(computedFactors).length > 0
              ? sdk.computeHealthRisks(computedFactors)
              : null;

            console.log("[ShenAI] Health risks:", { directRisks, computedRisks });

            healthRisks = mergeHealthRisksData(
              directRisks ? extractHealthRisks(directRisks) : null,
              computedRisks ? extractHealthRisks(computedRisks) : null,
            );
          } catch (e) {
            console.warn("[ShenAI] Could not get health risks:", e);
          }

          console.log("[ShenAI] Raw results:", raw);
          if (raw) {
            setResults({
              heartRate: raw.heart_rate_bpm,
              systolicBP: raw.systolic_blood_pressure_mmhg,
              diastolicBP: raw.diastolic_blood_pressure_mmhg,
              breathingRate: raw.breathing_rate_bpm,
              stressIndex: raw.stress_index,
              hrvSdnn: raw.hrv_sdnn_ms,
              bmi: raw.bmi_kg_per_m2,
              cardiacWorkload: raw.cardiac_workload_mmhg_per_sec,
              parasympatheticActivity: raw.parasympathetic_activity,
              signalQuality: raw.average_signal_quality,
              raw,
              healthRisks,
            });
          }
          setStatus("finished");

          // Stop camera after scan is done
          try { sdk.deinitialize(); } catch {}
          sdkRef.current = null;
        } else if (mState.value === 7 || mState.value === sdk.MeasurementState?.FAILED?.value) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setError("Measurement failed — try again with better lighting");
          setStatus("error");
        }
      } catch (e) {
        console.error("[ShenAI] Poll error:", e);
      }
    }, 300);
  }, []);

  const reset = useCallback(() => {
    const sdk = sdkRef.current;
    if (sdk) {
      try {
        sdk.stopMeasurement();
        sdk.resetMeasurementSession();
        sdk.setOperatingMode(sdk.OperatingMode.POSITIONING);
      } catch {}
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setStatus(sdk ? "ready" : "idle");
    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  return { status, progress, error, results, initialize, startMeasurement, reset, cleanup };
}
