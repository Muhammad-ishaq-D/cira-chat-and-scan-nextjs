import { useState, useRef, useCallback, useEffect } from "react";
import type { ShenaiSDK, MeasurementResults, InitializationSettings } from "shenai-sdk";

const SHENAI_API_KEY = "5709b1dea46a4a2ca1ea9c6592c970db";

export type ShenAIStatus = "idle" | "loading" | "ready" | "measuring" | "finished" | "error";

export interface VitalResults {
  heartRate: number;
  systolicBP: number | null;
  diastolicBP: number | null;
  breathingRate: number | null;
  stressIndex: number | null;
  hrvSdnn: number | null;
  bmi: number | null;
  signalQuality: number;
  raw: MeasurementResults;
}

export function useShenAI() {
  const [status, setStatus] = useState<ShenAIStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<VitalResults | null>(null);
  const sdkRef = useRef<ShenaiSDK | null>(null);
  const pollRef = useRef<number | null>(null);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (sdkRef.current) {
      try {
        sdkRef.current.deinitialize();
      } catch {}
      sdkRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const initialize = useCallback(async (canvasId: string) => {
    cleanup();
    setStatus("loading");
    setError(null);
    setResults(null);
    setProgress(0);

    try {
      const ShenAI = (await import("shenai-sdk")).default;
      const sdk: ShenaiSDK = await ShenAI({
        enablePreloadDisplay: true,
        preloadDisplayCanvasId: canvasId,
        hidePreloadDisplayLogo: true,
        locateFile: (filename: string) => {
          if (filename.endsWith(".wasm")) return "/wasm/shenai_sdk.wasm";
          return filename;
        },
        onWasmLoadingProgress: (p: number) => setProgress(Math.round(p * 100)),
      } as any);

      sdkRef.current = sdk;

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
        enableHealthRisks: false,
      };

      // Use CSS selector format as per Shen AI docs
      const canvasSelector = `#${canvasId}`;

      sdk.initialize(SHENAI_API_KEY, "cira-user", settings, (result) => {
        console.log("[ShenAI] init result:", result.value);
        if (result.value === 0) {
          setStatus("ready");
          // Attach using CSS selector format
          sdk.attachToCanvas(canvasSelector, true);
          console.log("[ShenAI] attached to canvas:", canvasSelector);
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
      setError(err.message || "Failed to load Shen AI SDK");
      setStatus("error");
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
        
        // Try multiple ways to get progress
        let prog = 0;
        if (typeof sdk.getMeasurementProgressPercentage === "function") {
          prog = sdk.getMeasurementProgressPercentage();
        } else if (typeof (sdk as any).getMeasurementRemainingTime === "function") {
          const remaining = (sdk as any).getMeasurementRemainingTime();
          const total = 30;
          prog = Math.max(0, Math.min(100, ((total - remaining) / total) * 100));
        }
        if (typeof prog === "number" && prog > 0) setProgress(Math.round(prog));

        console.log("[ShenAI] measurementState:", mState.value, "progress:", prog);

        // FINISHED state
        if (mState.value === 6 || mState.value === sdk.MeasurementState?.FINISHED?.value) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setProgress(100);

          const raw = sdk.getMeasurementResults();
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
              signalQuality: raw.average_signal_quality,
              raw,
            });
          }
          setStatus("finished");
        } else if (mState.value === 7 || mState.value === sdk.MeasurementState?.FAILED?.value) {
          // FAILED state
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
