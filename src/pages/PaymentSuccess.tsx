import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { billingApi } from "@/lib/apiClient";
import { PENDING_PLAN_STORAGE_KEY } from "@/lib/stripe";
import ciraLogo from "@/assets/cira-logo.svg";

const MAX_ATTEMPTS = 15;
const INTERVAL_MS = 2000;

function normalizePlanKey(name?: string): string {
  const key = (name || "basic").toLowerCase().trim();
  if (key === "basic" || key === "free") return "basic";
  return key;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"polling" | "success" | "timeout">("polling");
  const [planName, setPlanName] = useState<string>("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const sessionId = searchParams.get("session_id");
    const planFromUrl = searchParams.get("plan") || "";
    const pendingKey =
      planFromUrl ||
      sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) ||
      "";

    if (planFromUrl) {
      sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, planFromUrl);
    }

    const poll = async () => {
      if (sessionId) {
        try {
          await billingApi.confirmCheckout(sessionId, pendingKey || undefined);
        } catch {
          // Webhook may still apply — continue polling
        }
      }

      for (let count = 0; !cancelled && count < MAX_ATTEMPTS; count++) {
        setAttempts(count + 1);
        try {
          const sub = await billingApi.getSubscription();
          const currentKey = normalizePlanKey(sub?.plan_key || sub?.plan_name);
          const targetKey = pendingKey ? normalizePlanKey(pendingKey) : null;

          const matched = targetKey
            ? currentKey === targetKey
            : currentKey === "pro" || currentKey === "enterprise";

          if (matched) {
            if (!cancelled) {
              setPlanName(sub?.plan_name || currentKey);
              setStatus("success");
              sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
            }
            return;
          }
        } catch {
          // retry
        }
        await new Promise((r) => setTimeout(r, INTERVAL_MS));
      }
      if (!cancelled) setStatus("timeout");
    };

    poll();
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

        {status === "polling" && (
          <>
            <Loader2 size={40} className="text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold mb-2">Confirming your payment…</h1>
            <p className="text-sm text-muted-foreground">
              Activating your new plan. This usually takes a few seconds.
            </p>
            <p className="text-xs text-muted-foreground mt-3">Attempt {attempts} / {MAX_ATTEMPTS}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Payment Successful</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your <span className="font-medium text-foreground capitalize">{planName}</span> plan is now active.
            </p>
            <button
              onClick={() => navigate("/upgrade?paid=1")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium"
            >
              View My Plan
            </button>
          </>
        )}

        {status === "timeout" && (
          <>
            <AlertCircle size={40} className="text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Still processing…</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Your payment may still be confirming. Open the upgrade page to check your plan.
            </p>
            <button
              onClick={() => navigate("/upgrade?paid=1")}
              className="w-full h-11 rounded-xl border border-border/60 text-sm font-medium hover:bg-accent"
            >
              Check Plan Status
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
