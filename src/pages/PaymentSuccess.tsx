import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, Zap, Crown, CheckCircle2, Scan, MessageCircle, UserCheck } from "lucide-react";
import { billingApi } from "@/lib/apiClient";
import { PENDING_PLAN_STORAGE_KEY } from "@/lib/stripe";
import { getUser } from "@/lib/auth";
import ciraLogo from "@/assets/cira-logo.svg";

function normalizePlanKey(name?: string): string | null {
  const key = (name || "").toLowerCase().trim();
  if (!key) return null;
  if (key === "basic" || key === "free") return "basic";
  if (key === "pro" || key === "enterprise") return key;
  return null;
}

const PLAN_META: Record<string, {
  price: string;
  icon: typeof Zap;
  color: string;
  iconColor: string;
  scans: string;
  chat: string;
  consults: string;
}> = {
  pro: {
    price: "$5.00",
    icon: Zap,
    color: "from-primary/20 to-primary/10",
    iconColor: "text-primary",
    scans: "4 Face Scans / month",
    chat: "500,000 Chat Credits",
    consults: "3 Doctor Consults",
  },
  enterprise: {
    price: "$10.00",
    icon: Crown,
    color: "from-amber-100 to-orange-100",
    iconColor: "text-amber-600",
    scans: "Unlimited Face Scans",
    chat: "Unlimited Chat Credits",
    consults: "10 Doctor Consults",
  },
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"activating" | "success" | "error">("activating");
  const [planName, setPlanName] = useState<string>("");
  const [planKey, setPlanKey] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [payment, setPayment] = useState<{
    subtotal: number | null;
    tax: number;
    total: number | null;
    currency: string;
  } | null>(null);
  const user = getUser();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const sessionId = searchParams.get("session_id");
      const planFromUrl = searchParams.get("plan") || "";
      const resolvedKey =
        normalizePlanKey(planFromUrl) ||
        normalizePlanKey(sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) || "") ||
        null;

      if (!resolvedKey || resolvedKey === "basic") {
        if (!cancelled) {
          setErrorMsg("Could not determine which plan you purchased. Open Upgrade and try again, or contact support.");
          setStatus("error");
        }
        return;
      }

      try {
        const result = await billingApi.confirmCheckout(sessionId || undefined, resolvedKey);
        if (cancelled) return;
        setPlanName(result.plan_name || resolvedKey);
        setPlanKey(normalizePlanKey(result.plan_name || resolvedKey) || resolvedKey);
        if (result.payment) setPayment(result.payment);
        setStatus("success");
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
      } catch (err: unknown) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Could not activate your plan");
        setStatus("error");
      }
    };
    run();
    return () => { cancelled = true; };
  }, [searchParams]);

  const meta = PLAN_META[planKey] || PLAN_META["pro"];
  const PlanIcon = meta?.icon ?? Zap;
  const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const currency = payment?.currency ?? "usd";
  const fmt = (amount: number | null) =>
    amount != null
      ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount)
      : meta?.price ?? "$5.00";

  const displaySubtotal = fmt(payment?.subtotal ?? null);
  const displayTax = payment?.tax ? fmt(payment.tax) : null;
  const displayTotal = fmt(payment?.total ?? null);

  // ── Activating state ─────────────────────────────────────────────────────────
  if (status === "activating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-10 shadow-xl text-center max-w-sm w-full">
          <img src={ciraLogo} alt="Cira" width={36} height={36} className="mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Loader2 size={26} className="text-primary animate-spin" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Activating your plan…</h1>
          <p className="text-sm text-muted-foreground">Applying your subscription and allocating credits. This takes just a moment.</p>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        </div>
        <div className="relative z-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-10 shadow-xl text-center max-w-sm w-full">
          <img src={ciraLogo} alt="Cira" width={36} height={36} className="mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={26} className="text-amber-500" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">Activation issue</h1>
          <p className="text-sm text-muted-foreground mb-8">{errorMsg}</p>
          <button
            onClick={() => navigate("/upgrade?paid=1")}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium mb-3"
          >
            Try Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full h-11 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-accent"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
          <span className="text-sm font-semibold text-foreground tracking-wide">Cira</span>
        </div>

        {/* Main card — two columns */}
        <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">

          {/* ── Left: Order summary ────────────────────────────── */}
          <div className="md:w-[42%] bg-muted/40 border-b md:border-b-0 md:border-r border-border/40 p-8 flex flex-col">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">
              Subscribe to {planName}
            </p>

            {/* Price */}
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-bold text-foreground">{displaySubtotal}</span>
              <span className="text-sm text-muted-foreground mb-1.5">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground mb-8">Billed monthly · Renews {nextBilling}</p>

            {/* Plan icon */}
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta?.color} flex items-center justify-center mb-5`}>
              <PlanIcon size={20} className={meta?.iconColor} />
            </div>

            {/* Line items */}
            <div className="space-y-3 text-sm flex-1">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground capitalize">{planName}</span>
                <span className="font-medium text-foreground">{displaySubtotal}</span>
              </div>
              {displayTax && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium text-foreground">{displayTax}</span>
                </div>
              )}
              <div className="border-t border-border/40 pt-3 flex justify-between items-center">
                <span className="text-muted-foreground">Total paid today</span>
                <span className="font-semibold text-foreground">{displayTotal}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-8 leading-relaxed">
              A payment to Cira Health will appear on your statement. Subscription auto-renews monthly. Cancel anytime.
            </p>
          </div>

          {/* ── Right: Success message ─────────────────────────── */}
          <div className="flex-1 p-8 flex flex-col">
            {/* Checkmark */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={34} className="text-emerald-500" strokeWidth={1.8} />
              </div>
            </div>

            <h1 className="text-xl font-bold text-foreground text-center mb-1.5">
              Thanks for subscribing!
            </h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
              Your <span className="font-medium text-foreground capitalize">{planName}</span> plan is now active. Your credits have been allocated.
            </p>

            {/* Info box */}
            <div className="border border-border/50 rounded-xl divide-y divide-border/40 mb-8 text-sm">
              {user?.email && (
                <div className="px-4 py-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Contact</p>
                  <p className="text-foreground font-medium">{user.email}</p>
                </div>
              )}
              <div className="px-4 py-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Credits allocated</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <Scan size={13} className="text-primary shrink-0" />
                    {meta?.scans}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <MessageCircle size={13} className="text-primary shrink-0" />
                    {meta?.chat}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-foreground">
                    <UserCheck size={13} className="text-primary shrink-0" />
                    {meta?.consults}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Next billing date</p>
                <p className="text-foreground font-medium">{nextBilling}</p>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mb-3"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/upgrade")}
              className="w-full h-10 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-accent transition-all"
            >
              View Plan Details
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Need help? Contact us at{" "}
          <a href="mailto:support@askainurse.com" className="text-primary hover:underline">
            support@askainurse.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
