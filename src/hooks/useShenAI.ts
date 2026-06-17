import { useState, useRef, useCallback, useEffect } from "react";
import type {
  ShenaiSDK,
  MeasurementResults,
  InitializationSettings,
  HealthRisks,
  RisksFactors,
} from "@shenai/sdk";

const SHENAI_API_KEY = "5709b1dea46a4a2ca1ea9c6592c970db";

let ciraCameraStream: MediaStream | null = null;

function stopCiraCameraStream() {
  try {
    ciraCameraStream?.getTracks().forEach((track) => track.stop());
  } catch { }
  ciraCameraStream = null;
}

function capCameraResolution(maxWidth = 320, maxHeight = 240) {
  if (
    typeof navigator === "undefined" ||
    !navigator.mediaDevices?.getUserMedia ||
    (navigator.mediaDevices as any).__cira_capped
  ) {
    return;
  }

  const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

  const rememberStream = (stream: MediaStream) => {
    if (stream.getVideoTracks().length > 0) {
      ciraCameraStream = stream;
    }
    return stream;
  };

  navigator.mediaDevices.getUserMedia = async function (constraints) {
    if (constraints?.video && typeof constraints.video === "object") {
      const applyConstraints = (vid: any, useMax: boolean) => ({
        ...constraints,
        video: {
          ...vid,
          width: {
            ...(typeof vid.width === "object" ? vid.width : {}),
            ideal: maxWidth,
            ...(useMax ? { max: maxWidth } : {}),
          },
          height: {
            ...(typeof vid.height === "object" ? vid.height : {}),
            ideal: maxHeight,
            ...(useMax ? { max: maxHeight } : {}),
          },
          frameRate: {
            ...(typeof vid.frameRate === "object" ? vid.frameRate : {}),
            ideal: 15,
            max: 24,
          },
        },
      });

      const vid = { ...(constraints.video as any) };

      try {
        const stream = await orig(applyConstraints(vid, true));
        return rememberStream(stream);
      } catch (e: any) {
        if (e?.name === "OverconstrainedError") {
          const stream = await orig(applyConstraints(vid, false));
          return rememberStream(stream);
        }
        throw e;
      }
    }

    const stream = await orig(constraints);
    return rememberStream(stream);
  };

  (navigator.mediaDevices as any).__cira_capped = true;
}

export type ShenAIStatus =
  | "idle"
  | "loading"
  | "ready"
  | "measuring"
  | "processing"
  | "finished"
  | "error"
  | "unsupported";

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

  if (
    normalized === "male" ||
    normalized === "female" ||
    normalized === "other"
  ) {
    return normalized;
  }

  return undefined;
}

function normalizeUserProfile(
  userProfile?: UserProfileData
): UserProfileData | undefined {
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

function getEnumValue(
  value: { value?: number } | number | null | undefined
): number | null {
  if (typeof value === "number") return value;

  if (value && typeof value === "object" && typeof value.value === "number") {
    return value.value;
  }

  return null;
}

function buildRiskFactors(
  sdk: ShenaiSDK,
  userProfile?: UserProfileData,
  raw?: MeasurementResults | null
): RisksFactors {
  const factors: RisksFactors = {};

  const age = toFiniteNumber(userProfile?.age);
  const height = toFiniteNumber(userProfile?.height);
  const weight = toFiniteNumber(userProfile?.weight);
  const gender = normalizeGender(userProfile?.gender);

  if (age != null) factors.age = age;
  if (height != null) factors.bodyHeight = height;
  if (weight != null) factors.bodyWeight = weight;

  if (gender) {
    factors.gender =
      sdk.Gender[
        gender === "male" ? "MALE" : gender === "female" ? "FEMALE" : "OTHER"
      ];
  }

  if (raw?.systolic_blood_pressure_mmhg != null) {
    factors.sbp = raw.systolic_blood_pressure_mmhg;
  }

  if (raw?.diastolic_blood_pressure_mmhg != null) {
    factors.dbp = raw.diastolic_blood_pressure_mmhg;
  }

  return factors;
}

function mergeHealthRisksData(
  primary: HealthRisksData | null,
  fallback: HealthRisksData | null
): HealthRisksData | null {
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
    peripheralVascularDiseaseRisk:
      risks.cvDiseases?.peripheralVascularDiseaseRisk ?? null,
    coronaryDeathRisk:
      risks.hardAndFatalEvents?.coronaryDeathEventRisk ?? null,
    fatalStrokeRisk:
      risks.hardAndFatalEvents?.fatalStrokeEventRisk ?? null,
    totalCVMortality:
      risks.hardAndFatalEvents?.totalCVMortalityRisk ?? null,
    hardCVEventRisk:
      risks.hardAndFatalEvents?.hardCVEventRisk ?? null,
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
  const finishTimerRef = useRef<number | null>(null);
  const finishHandledRef = useRef(false);
  const riskProfileRef = useRef<UserProfileData | undefined>(undefined);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    finishHandledRef.current = false;

    stopCiraCameraStream();

    if (sdkRef.current) {
      try {
        sdkRef.current.deinitialize();
      } catch { }
      sdkRef.current = null;
    }

    riskProfileRef.current = undefined;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const initialize = useCallback(
    async (canvasId: string, userProfile?: UserProfileData, language?: string) => {
      cleanup();

      const isMobile =
        typeof window !== "undefined" && window.innerWidth < 768;

      capCameraResolution(isMobile ? 240 : 320, isMobile ? 180 : 240);

      setStatus("loading");
      setError(null);
      setResults(null);
      setProgress(0);
      finishHandledRef.current = false;

      try {
        const ShenAI = (await import("@shenai/sdk")).default;

        const sdk: ShenaiSDK = await ShenAI({
          enablePreloadDisplay: false,
          locateFile: (filename: string) => {
            if (filename.endsWith(".wasm")) return "/wasm/shenai_sdk.wasm";
            return filename;
          },
          onWasmLoadingProgress: (p: number) => {
            setProgress(Math.round(p * 100));
          },
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
          showVisualWarnings: !isMobile,
          enableCameraSwap: true,
          showFaceMask: !isMobile,
          showBloodFlow: false,
          hideShenaiLogo: true,
          enableStartAfterSuccess: false,
          enableSummaryScreen: false,
          showStartStopButton: false,
          showInfoButton: false,
          showDisclaimer: false,

          // Important: avoid heavy internal risk calculation during final frame processing.
          // We compute it manually after stopping camera frame ingestion.
          enableHealthRisks: false,

          applyPrecisionModeToBloodPressure: true,
          enableFullFrameProcessing: false,
          cameraAspectRatio: 0,

          ...(language ? { language } : {}),

          ...(Object.keys(riskFactors).length > 0
            ? { risksFactors: riskFactors }
            : {}),
        };

        const canvasSelector = `#${canvasId}`;

        sdk.initialize(SHENAI_API_KEY, "cira-user", settings, (result) => {
          console.log("[ShenAI] init result:", result.value);

          if (result.value === 0) {
            setStatus("ready");

            try {
              sdk.attachToCanvas(canvasSelector, true);
            } catch (e) {
              console.error("[ShenAI] attachToCanvas error:", e);
              setError("Could not attach scanner to camera canvas.");
              setStatus("error");
            }

            return;
          }

          const errors: Record<number, string> = {
            1: "Invalid API key",
            2: "Connection error — check your internet",
            3: "Internal SDK error",
          };

          setError(errors[result.value] || "Initialization failed");
          setStatus("error");
        });
      } catch (err: any) {
        console.error("[ShenAI] init error:", err);

        const msg = String(err?.message || err || "");

        if (
          msg.includes("invalid value type") ||
          msg.includes("CompileError") ||
          msg.includes("exn") ||
          err?.name === "CompileError"
        ) {
          setError(
            "Your browser doesn't support the technology needed for the face scan. Please open Cira in the latest Chrome, Safari 17.4+, Edge, or Firefox — and avoid in-app browsers."
          );
          setStatus("unsupported");
        } else {
          setError(err?.message || "Failed to load Shen AI SDK");
          setStatus("error");
        }
      }
    },
    [cleanup]
  );

  const startMeasurement = useCallback(() => {
    const sdk = sdkRef.current;
    if (!sdk) return;

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    finishHandledRef.current = false;

    setError(null);
    setResults(null);
    setStatus("measuring");
    setProgress(0);

    try {
      sdk.setOperatingMode(sdk.OperatingMode.MEASURE);
      sdk.startMeasurement();
    } catch (e: any) {
      console.error("[ShenAI] startMeasurement error:", e);
      setError(e?.message || "Could not start measurement.");
      setStatus("error");
      return;
    }

    pollRef.current = window.setInterval(() => {
      try {
        const activeSdk = sdkRef.current;
        if (!activeSdk) return;

        const mState = activeSdk.getMeasurementState();

        let prog = 0;
        if (typeof activeSdk.getMeasurementProgressPercentage === "function") {
          prog = activeSdk.getMeasurementProgressPercentage();
        }

        if (typeof prog === "number" && prog > 0) {
          setProgress(Math.round(prog));
        }

        const isFinished =
          mState.value === activeSdk.MeasurementState?.FINISHED?.value;

        const isFailed =
          mState.value === activeSdk.MeasurementState?.FAILED?.value;

        if (isFinished) {
          if (finishHandledRef.current) return;
          finishHandledRef.current = true;

          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          setProgress(100);
          setStatus("processing");

          let rawSnapshot: ReturnType<
            typeof activeSdk.getMeasurementResults
          > | null = null;

          let healthRisks: HealthRisksData | null = null;

          try {
            rawSnapshot = activeSdk.getMeasurementResults();
          } catch (e) {
            console.warn("[ShenAI] getMeasurementResults failed:", e);
          }

          try {
            activeSdk.stopMeasurement();
          } catch (e) {
            console.warn("[ShenAI] stopMeasurement failed:", e);
          }

          // Main crash fix: stop actual browser camera stream before any delayed
          // SDK cleanup, risk calculation, or React result rendering.
          stopCiraCameraStream();

          try {
            if (rawSnapshot) {
              let directRisks: HealthRisks | null = null;
              let computedRisks: HealthRisks | null = null;

              try {
                if (typeof activeSdk.getHealthRisks === "function") {
                  directRisks = activeSdk.getHealthRisks();
                }
              } catch { }

              const computedFactors = buildRiskFactors(
                activeSdk,
                riskProfileRef.current,
                rawSnapshot
              );

              if (Object.keys(computedFactors).length > 0) {
                try {
                  computedRisks = activeSdk.computeHealthRisks(computedFactors);
                } catch { }
              }

              healthRisks = mergeHealthRisksData(
                directRisks ? extractHealthRisks(directRisks) : null,
                computedRisks ? extractHealthRisks(computedRisks) : null
              );
            }
          } catch (e) {
            console.warn("[ShenAI] Could not compute health risks:", e);
          }

          finishTimerRef.current = window.setTimeout(() => {
            try {
              activeSdk.deinitialize();
            } catch (e) {
              console.warn("[ShenAI] deinitialize after finish failed:", e);
            }

            if (sdkRef.current === activeSdk) {
              sdkRef.current = null;
            }

            finishTimerRef.current = null;

            if (!rawSnapshot) {
              setError(
                "Scan completed, but results could not be read. Please try again."
              );
              setStatus("error");
              return;
            }

            setResults({
              heartRate: rawSnapshot.heart_rate_bpm,
              systolicBP: rawSnapshot.systolic_blood_pressure_mmhg,
              diastolicBP: rawSnapshot.diastolic_blood_pressure_mmhg,
              breathingRate: rawSnapshot.breathing_rate_bpm,
              stressIndex: rawSnapshot.stress_index,
              hrvSdnn: rawSnapshot.hrv_sdnn_ms,
              bmi: rawSnapshot.bmi_kg_per_m2,
              cardiacWorkload: rawSnapshot.cardiac_workload_mmhg_per_sec,
              parasympatheticActivity: rawSnapshot.parasympathetic_activity,
              signalQuality: rawSnapshot.average_signal_quality,
              raw: rawSnapshot,
              healthRisks,
            });

            setStatus("finished");
          }, 800);

          return;
        }

        if (isFailed) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          stopCiraCameraStream();

          setError("Measurement failed — try again with better lighting");
          setStatus("error");
        }
      } catch (e: any) {
        console.error("[ShenAI] Poll error:", e);

        const msg = String(e?.message || e || "");

        if (
          e?.name === "RuntimeError" ||
          msg.includes("unreachable") ||
          msg.includes("Aborted") ||
          msg.includes("table index is out of bounds")
        ) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }

          stopCiraCameraStream();

          setError("Scan failed. Restarting scanner...");
          setStatus("error");

          window.setTimeout(() => {
            window.location.reload();
          }, 1200);
        }
      }
    }, 300);
  }, []);

  const reset = useCallback(() => {
    const sdk = sdkRef.current;

    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }

    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    finishHandledRef.current = false;

    if (sdk) {
      try {
        sdk.stopMeasurement();
      } catch { }

      try {
        sdk.resetMeasurementSession();
      } catch { }

      try {
        sdk.setOperatingMode(sdk.OperatingMode.POSITIONING);
      } catch { }

      setStatus("ready");
    } else {
      // After finished scan we deinitialize SDK, so a clean reload is safer.
      setStatus("idle");
    }

    setResults(null);
    setError(null);
    setProgress(0);
  }, []);

  return {
    status,
    progress,
    error,
    results,
    initialize,
    startMeasurement,
    reset,
    cleanup,
  };
}