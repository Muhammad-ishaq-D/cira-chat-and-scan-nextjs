import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, Gauge, AlertCircle, Download, RefreshCw } from "lucide-react";

interface Props {
  progress: number;
  status: "idle" | "loading";
  onRetry?: () => void;
}

const STUCK_TIMEOUT_MS = 20000;


type NetInfo = {
  online: boolean;
  effectiveType?: string;
  downlink?: number; // Mbps
  rtt?: number; // ms
};

function readConnection(): NetInfo {
  const nav: any = typeof navigator !== "undefined" ? navigator : {};
  const c = nav.connection || nav.mozConnection || nav.webkitConnection;
  return {
    online: typeof navigator !== "undefined" ? navigator.onLine : true,
    effectiveType: c?.effectiveType,
    downlink: typeof c?.downlink === "number" ? c.downlink : undefined,
    rtt: typeof c?.rtt === "number" ? c.rtt : undefined,
  };
}

const SdkLoadingOverlay = ({ progress, status, onRetry }: Props) => {
  const { t } = useTranslation();
  const [net, setNet] = useState<NetInfo>(() => readConnection());
  const [ping, setPing] = useState<number | null>(null);
  const [displayed, setDisplayed] = useState(0);
  const [isStuck, setIsStuck] = useState(false);
  const lastChangeRef = useRef<number>(Date.now());
  const lastProgressRef = useRef<number>(progress);

  // Track when real progress last changed (for stuck detection)
  useEffect(() => {
    if (progress !== lastProgressRef.current) {
      lastProgressRef.current = progress;
      lastChangeRef.current = Date.now();
      setIsStuck(false);
    }
  }, [progress]);

  // Stuck check — fires when no progress movement for STUCK_TIMEOUT_MS
  useEffect(() => {
    const id = window.setInterval(() => {
      if (progress < 100 && Date.now() - lastChangeRef.current > STUCK_TIMEOUT_MS) {
        setIsStuck(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [progress]);

  // Smoothly animate displayed % toward the real progress, clamped 0-100.
  useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(progress)));
    let raf = 0;
    const tick = () => {
      setDisplayed((cur) => {
        if (cur === target) return cur;
        const step = Math.max(1, Math.ceil(Math.abs(target - cur) / 25));
        const next = cur < target ? Math.min(target, cur + step) : Math.max(target, cur - step);
        if (next !== target) raf = requestAnimationFrame(tick);
        return next;
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);


  useEffect(() => {

    const update = () => setNet(readConnection());
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    const nav: any = navigator;
    const c = nav.connection || nav.mozConnection || nav.webkitConnection;
    c?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      c?.removeEventListener?.("change", update);
    };
  }, []);

  // Active ping measurement (cache-busted HEAD to favicon)
  useEffect(() => {
    let cancelled = false;
    const measure = async () => {
      try {
        const start = performance.now();
        await fetch(`/favicon.svg?_p=${Date.now()}`, { method: "GET", cache: "no-store" });
        const elapsed = Math.round(performance.now() - start);
        if (!cancelled) setPing(elapsed);
      } catch {
        if (!cancelled) setPing(null);
      }
    };
    measure();
    const id = window.setInterval(measure, 3500);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  const quality = (() => {
    if (!net.online) return { label: "Offline", color: "text-red-400", dot: "bg-red-400" };
    const eff = net.effectiveType;
    if (eff === "4g" || (net.downlink && net.downlink >= 5)) return { label: "Excellent", color: "text-emerald-400", dot: "bg-emerald-400" };
    if (eff === "3g" || (net.downlink && net.downlink >= 1.5)) return { label: "Good", color: "text-amber-400", dot: "bg-amber-400" };
    if (eff === "2g" || eff === "slow-2g") return { label: "Slow", color: "text-orange-400", dot: "bg-orange-400" };
    return { label: "Stable", color: "text-emerald-400", dot: "bg-emerald-400" };
  })();

  const shown = Math.max(0, Math.min(100, status === "loading" ? Math.max(displayed, 2) : displayed));
  const phase = status === "idle"
    ? "Preparing scanner"
    : progress < 100
      ? "Downloading scanner engine"
      : "Starting camera";

  const handleRetry = () => {
    if (onRetry) onRetry();
    else window.location.reload();
  };

  if (isStuck) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-10 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border-2 border-amber-500/30">
          <WifiOff size={24} className="text-amber-400" />
        </div>
        <h2 className="text-white text-lg font-heading font-semibold mb-1">Connection issue</h2>
        <p className="text-white/60 text-xs font-body mb-1 max-w-xs">
          The scanner engine is taking longer than expected to download.
        </p>
        <p className="text-white/40 text-[11px] font-body mb-5 max-w-xs">
          Please check your internet connection and try again.
        </p>

        <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-sm mb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {net.online ? <Wifi size={13} className="text-white/60" /> : <WifiOff size={13} className="text-red-400" />}
              <span className="text-[11px] text-white/60 font-medium">
                {net.online ? "Online" : "Offline"}
              </span>
            </div>
            <span className="text-[11px] text-white/60 tabular-nums">
              {ping != null ? `${ping}ms` : "no response"}
            </span>
          </div>
        </div>

        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <RefreshCw size={14} /> Retry
        </button>
        <p className="text-[10px] text-white/30 mt-4">Stuck at {displayed}% · waited 20s+</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 px-6">

      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-2 border-primary/20">
        {status === "loading" && progress < 100 ? (
          <Download size={22} className="text-primary animate-pulse" />
        ) : (
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        )}
      </div>

      <h2 className="text-white text-lg font-heading font-semibold mb-1">{phase}</h2>
      <p className="text-white/50 text-xs font-body mb-5">
        {status === "loading" && progress < 100
          ? "First-time setup downloads ~10MB · then cached"
          : "Setting up secure camera · Please wait"}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider text-white/40 font-medium">Engine</span>
          <span className="text-[11px] font-semibold text-white/80 tabular-nums">{shown}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
            style={{ width: `${shown}%` }}
          />
        </div>
      </div>

      {/* Network info */}
      <div className="w-full max-w-xs bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {net.online ? <Wifi size={13} className="text-white/60" /> : <WifiOff size={13} className="text-red-400" />}
            <span className="text-[11px] text-white/60 font-medium">Network</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${quality.dot} animate-pulse`} />
            <span className={`text-[11px] font-semibold ${quality.color}`}>{quality.label}</span>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Type</p>
            <p className="text-[11px] text-white/80 font-semibold tabular-nums">{net.effectiveType?.toUpperCase() ?? "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Speed</p>
            <p className="text-[11px] text-white/80 font-semibold tabular-nums">
              {net.downlink != null ? `${net.downlink.toFixed(1)} Mb` : "—"}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-white/40">Ping</p>
            <p className="text-[11px] text-white/80 font-semibold tabular-nums">
              {ping != null ? `${ping}ms` : net.rtt ? `${net.rtt}ms` : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-5">
        <AlertCircle size={10} className="text-white/30 shrink-0" />
        <p className="text-[10px] text-white/30">Credits deducted upon scan · 100% on-device</p>
      </div>

      {!net.online && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-red-400">
          <Gauge size={12} /> No connection — engine download paused
        </div>
      )}
    </div>
  );
};

export default SdkLoadingOverlay;
