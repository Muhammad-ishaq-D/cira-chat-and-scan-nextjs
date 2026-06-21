import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  progress: number;
  status: "idle" | "loading" | "error";
  error?: string | null;
  onRetry?: () => void;
}

const SdkLoadingOverlay = ({ progress, status, error, onRetry }: Props) => {
  const { t } = useTranslation();
  const [displayed, setDisplayed] = useState(0);

  // Smoothly animate the displayed percentage toward the real progress.
  useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(progress)));
    let raf = 0;
    const tick = () => {
      setDisplayed((cur) => {
        if (cur === target) return cur;
        const step = Math.max(1, Math.ceil(Math.abs(target - cur) / 20));
        const next = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
        if (next !== target) raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);

  const handleRetry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  if (status === "error") {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/30">
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <h2 className="text-white text-base font-heading font-semibold mb-2">
          {t("components.sdkLoading.connectionIssue")}
        </h2>
        <p className="text-white/60 text-xs font-body mb-5 max-w-xs leading-relaxed">
          {error || t("components.sdkLoading.takingLonger")}
        </p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={14} /> {t("components.sdkLoading.retry")}
        </button>
      </div>
    );
  }

  const shown = status === "loading" ? Math.max(displayed, 2) : displayed;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6">
      <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin mb-5" />

      <p className="text-white text-sm font-heading font-medium mb-1">
        {progress < 100 ? t("components.sdkLoading.downloading") : t("components.sdkLoading.startingCamera")}
      </p>
      <p className="text-white/40 text-[11px] font-body mb-5 tabular-nums">{shown}%</p>

      <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${shown}%` }}
        />
      </div>
    </div>
  );
};

export default SdkLoadingOverlay;
