import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { billingApi } from "@/lib/apiClient";
import { PENDING_PLAN_STORAGE_KEY } from "@/lib/stripe";
import ciraLogo from "@/assets/cira-logo.svg";

function normalizePlanKey(name?: string): string | null {
  const key = (name || "").toLowerCase().trim();
  if (!key) return null;
  if (key === "basic" || key === "free") return "basic";
  if (key === "pro" || key === "enterprise") return key;
  return null;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"activating" | "success" | "error">("activating");
  const [planName, setPlanName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const sessionId = searchParams.get("session_id");
      const planFromUrl = searchParams.get("plan") || "";
      const planKey =
        normalizePlanKey(planFromUrl) ||
        normalizePlanKey(sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) || "") ||
        null;

      if (!planKey || planKey === "basic") {
        if (!cancelled) {
          setErrorMsg(
            "Could not determine which plan you purchased. Open Upgrade and try again, or contact support."
          );
          setStatus("error");
        }
        return;
      }

      try {
        const result = await billingApi.confirmCheckout(sessionId || undefined, planKey);
        if (cancelled) return;

        setPlanName(result.plan_name || planKey);
        setStatus("success");
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Could not activate your plan";
        setErrorMsg(message);
        setStatus("error");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-lg text-center">
        <div className="flex justify-center mb-6">
          <img src={ciraLogo} alt="Cira" width={40} height={40} />
        </div>

        {status === "activating" && (
          <>
            <Loader2 size={40} className="text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold mb-2">Activating your plan…</h1>
            <p className="text-sm text-muted-foreground">
              Applying your subscription and allocating face scans and chat credits.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Payment Successful</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your <span className="font-medium text-foreground capitalize">{planName}</span> plan is
              active. Face scans and chat credits have been updated.
            </p>
            <button
              onClick={() => navigate("/upgrade?paid=1")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium"
            >
              View My Plan
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle size={40} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Activation issue</h1>
            <p className="text-sm text-muted-foreground mb-6">{errorMsg}</p>
            <button
              onClick={() => navigate("/upgrade?paid=1")}
              className="w-full h-11 rounded-xl border border-border/60 text-sm font-medium hover:bg-accent mb-3"
            >
              Try Again on Upgrade Page
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full h-11 rounded-xl text-sm text-muted-foreground hover:bg-accent"
            >
              Go to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
