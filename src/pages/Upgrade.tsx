import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Shield, Zap, Crown, Sparkles, Star, Loader2, CalendarDays, AlertCircle, TriangleAlert, RotateCcw } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { billingApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { STRIPE_PAYMENT_LINKS, PENDING_PLAN_STORAGE_KEY } from "@/lib/stripe";
import { getUser, getUserId } from "@/lib/auth";

interface Plan {
  id: string; name: string; price: string; period: string; desc: string;
  icon: typeof Shield; color: string; iconColor: string; current?: boolean; popular?: boolean;
  features: string[];
  stripe_price_id?: string;
}

interface Subscription {
  plan_id?: string;
  plan_name?: string;
  plan_key?: string;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

function normalizePlanKey(nameOrId?: string): string {
  const key = (nameOrId || "basic").toLowerCase().trim();
  if (key === "basic" || key === "free") return "basic";
  if (key === "pro") return "pro";
  if (key === "enterprise") return "enterprise";
  return key;
}

function planMatchesSubscription(plan: Plan, sub: Subscription | null): boolean {
  if (!sub) return normalizePlanKey(plan.name) === "basic";
  const planKey = normalizePlanKey(plan.name);
  const subKey = normalizePlanKey(sub.plan_key || sub.plan_name || sub.plan_id);
  if (planKey === subKey) return true;
  if (plan.id && sub.plan_id && plan.id === sub.plan_id) return true;
  return false;
}

const defaultPlans: Plan[] = [
  {
    id: "basic", name: "Basic", price: "Free", period: "", desc: "Get started with essential health insights",
    icon: Shield, color: "from-slate-100 to-slate-200", iconColor: "text-slate-600",
    features: ["1 Face Scan", "100,000 Chat Credits", "Basic Vital Signs", "Health Risk Overview", "Email Support"],
  },
  {
    id: "pro", name: "Pro", price: "$5.00", period: "/mo", desc: "Advanced monitoring for health-conscious individuals",
    icon: Zap, color: "from-primary/20 to-primary/10", iconColor: "text-primary", popular: true,
    features: ["4 Face Scans / month", "500,000 Chat Credits", "All Vital Signs + Trends", "Detailed Health Indices", "3 Doctor Consults", "Export Reports (PDF)", "Priority Support"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "$10.00", period: "/mo", desc: "Complete health intelligence for professionals",
    icon: Crown, color: "from-amber-100 to-orange-100", iconColor: "text-amber-600",
    features: ["Unlimited Face Scans", "Unlimited Chat Credits", "10 Doctor Consults", "Advanced AI Diagnostics", "Priority Support", "All Reports", "HIPAA Private"],
  },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [redirectingId, setRedirectingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ planId: string; isCancel: boolean } | null>(null);
  const [currentPlanLabel, setCurrentPlanLabel] = useState<string>("Basic");
  const [currentPlanKey, setCurrentPlanKey] = useState<string>("basic");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);

  const applyCurrentPlan = useCallback((sub: Subscription | null) => {
    const label = sub?.plan_name || (sub?.plan_key === "pro" ? "Pro" : sub?.plan_key === "enterprise" ? "Enterprise" : "Basic");
    const key = normalizePlanKey(sub?.plan_key || sub?.plan_name || sub?.plan_id);
    setCurrentPlanLabel(label);
    setCurrentPlanKey(key);
    setSubscription(sub);
    setPlans((prev) => prev.map((p) => ({ ...p, current: planMatchesSubscription(p, sub) })));
  }, []);

  const refreshSubscription = useCallback(async () => {
    try {
      const sub = await billingApi.getSubscription();
      applyCurrentPlan(sub);
      return sub;
    } catch {
      applyCurrentPlan(null);
      return null;
    } finally {
      setLoadingPlan(false);
    }
  }, [applyCurrentPlan]);

  useEffect(() => {
    billingApi.getPlans()
      .then((rawData) => {
        const data = Array.isArray(rawData) ? rawData : rawData?.plans;
        if (Array.isArray(data) && data.length > 0) {
          setPlans((prev) => prev.map((p) => {
            const apiPlan = data.find(
              (ap: { id?: string; plan_id?: string; name?: string }) =>
                ap.id === p.id || ap.plan_id === p.id || normalizePlanKey(ap.name) === normalizePlanKey(p.name)
            );
            if (apiPlan) {
              const apiPrice = apiPlan.price_display || apiPlan.price || apiPlan.amount || apiPlan.monthly_price;
              const displayPrice = typeof apiPrice === "number"
                ? `$${apiPrice}`
                : (apiPrice ? (String(apiPrice) === "0" || String(apiPrice) === "0.00" ? "Free" : `$${apiPrice}`) : p.price);

              const dynamicFeatures: string[] = [];
              const scans = apiPlan.face_scans ?? -1;
              const credits = apiPlan.chat_credits ?? -1;
              const isScansUnlimited = scans === -1 || String(scans).toLowerCase() === "unlimited";
              const isCreditsUnlimited = credits === -1 || String(credits).toLowerCase() === "unlimited";
              dynamicFeatures.push(isScansUnlimited ? "Unlimited Face Scans" : `${scans} Face Scan${String(scans) !== "1" ? "s" : ""} / month`);
              dynamicFeatures.push(isCreditsUnlimited ? "Unlimited Chat Credits" : `${Number(credits).toLocaleString()} Chat Credits`);
              try {
                const featureFlags = typeof apiPlan.features === "string" ? JSON.parse(apiPlan.features) : apiPlan.features;
                if (featureFlags && typeof featureFlags === "object" && !Array.isArray(featureFlags)) {
                  if (featureFlags.vitals_scan) dynamicFeatures.push("Vital Signs Monitoring");
                  if (featureFlags.reports) dynamicFeatures.push("Export Reports (PDF)");
                  if (featureFlags.priority_support) dynamicFeatures.push("Priority Support");
                } else if (Array.isArray(featureFlags)) {
                  dynamicFeatures.push(...featureFlags);
                }
              } catch { /* ignore */ }

              return {
                ...p,
                id: apiPlan.id ?? p.id,
                name: apiPlan.name ?? p.name,
                price: displayPrice,
                features: dynamicFeatures.length > 0 ? dynamicFeatures : p.features,
                stripe_price_id: apiPlan.stripe_price_id || apiPlan.price_id,
              };
            }
            return p;
          }));
        }
      })
      .catch(() => {});

    refreshSubscription();

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSubscription();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refreshSubscription]);

  // After Stripe redirect (?paid=1), poll until the selected plan is active
  useEffect(() => {
    if (searchParams.get("paid") !== "1") return;

    const pendingKey =
      sessionStorage.getItem(PENDING_PLAN_STORAGE_KEY) || searchParams.get("plan") || "";
    const targetKey = normalizePlanKey(pendingKey);
    if (!targetKey || targetKey === "basic") return;

    let cancelled = false;
    const sync = async () => {
      let activationError: string | null = null;
      for (let i = 0; i < 5; i++) {
        try {
          await billingApi.confirmCheckout(undefined, targetKey);
          activationError = null;
          break;
        } catch (err) {
          activationError = err instanceof Error ? err.message : "Could not activate your plan";
          await new Promise((r) => setTimeout(r, 2000));
        }
        if (cancelled) return;
      }

      let activated = false;
      for (let i = 0; i < 15; i++) {
        if (cancelled) return;
        const sub = await refreshSubscription();
        const activatedKey = normalizePlanKey(sub?.plan_key || sub?.plan_name || sub?.plan_id || "");
        if (activatedKey === targetKey) { activated = true; break; }
        await new Promise((r) => setTimeout(r, 2000));
      }

      if (cancelled) return;
      if (activated) {
        toast.success(t("upgrade.toast.planActive", { plan: targetKey }));
        sessionStorage.removeItem(PENDING_PLAN_STORAGE_KEY);
      } else {
        toast.error(activationError || t("upgrade.errors.activationFailed"));
      }
      setSearchParams({}, { replace: true });
    };
    sync();
    return () => { cancelled = true; };
  }, [searchParams, refreshSubscription, setSearchParams, t]);

  const handleUpgrade = (plan: Plan) => {
    if (plan.current) return;
    if (plan.id === "basic" || plan.name.toLowerCase() === "basic") return;

    const link = STRIPE_PAYMENT_LINKS[plan.name.toLowerCase()] || STRIPE_PAYMENT_LINKS[plan.id];
    if (!link) {
      toast.error(t("upgrade.errors.noPaymentLink"));
      return;
    }

    setRedirectingId(plan.id);
    sessionStorage.setItem(PENDING_PLAN_STORAGE_KEY, normalizePlanKey(plan.name));

    const userId = getUserId();
    if (!userId) {
      toast.error(t("upgrade.errors.signInAgain"));
      setRedirectingId(null);
      return;
    }

    const user = getUser();
    const url = new URL(link);
    url.searchParams.set("client_reference_id", userId);
    if (user?.email) url.searchParams.set("prefilled_email", user.email);

    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = url.toString();
        return;
      }
    } catch {
      // cross-origin iframe — fall through
    }
    window.location.assign(url.toString());
  };

  const handleCancelOrReactivate = async (planId: string, isCancel: boolean) => {
    setCancellingId(planId);
    try {
      if (isCancel) {
        await billingApi.cancelSubscription();
        toast.success(t("upgrade.toast.willCancel"));
      } else {
        await billingApi.reactivateSubscription();
        toast.success(t("upgrade.toast.reactivated"));
      }
      await refreshSubscription();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upgrade.errors.updateFailed"));
    } finally {
      setCancellingId(null);
    }
  };

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(i18n.language, {
        year: "numeric", month: "long", day: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={16} />{t("upgrade.back")}
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={ciraLogo} alt="Cira" width={28} height={28} />
            <Sparkles size={20} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {t("upgrade.title")}
          </h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("upgrade.subtitle")}
          </p>

          {loadingPlan && (
            <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 size={14} className="animate-spin" /> {t("upgrade.loadingPlan")}
            </p>
          )}

          {!loadingPlan && (
            <div className="mt-4 flex flex-col items-center gap-1">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {t("upgrade.currentPlan")} <span className="font-semibold capitalize">{currentPlanLabel}</span>
              </span>
              {renewalDate && currentPlanKey !== "basic" && (
                <span className={`inline-flex items-center gap-1.5 text-xs mt-1 ${subscription?.cancel_at_period_end ? "text-amber-600" : "text-muted-foreground"}`}>
                  <CalendarDays size={12} />
                  {subscription?.cancel_at_period_end
                    ? t("upgrade.cancelsOn", { date: renewalDate })
                    : t("upgrade.renewsOn", { date: renewalDate })}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isRedirecting = redirectingId === plan.id;
            const isCancelling = cancellingId === plan.id;
            const planKey = normalizePlanKey(plan.name);
            const isPaid = planKey !== "basic";
            let actionLabel: string;
            if (plan.current) actionLabel = t("upgrade.currentPlanBadge");
            else if (!isPaid) actionLabel = t("upgrade.free");
            else actionLabel = t("upgrade.upgradeTo", { plan: plan.name });

            return (
              <div
                key={plan.id}
                className={`relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col ${
                  plan.current
                    ? "border-emerald-500/50 ring-2 ring-emerald-500/20"
                    : plan.popular
                    ? "border-primary/40 ring-2 ring-primary/10"
                    : "border-border/50"
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-semibold uppercase tracking-wider">
                      {t("upgrade.currentPlanBadge")}
                    </span>
                  </div>
                )}
                {plan.popular && !plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
                      <Star size={10} /> {t("upgrade.mostPopular")}
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                  <Icon size={22} className={plan.iconColor} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {plan.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                      <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />{f}
                    </li>
                  ))}
                </ul>

                {/* Primary action button */}
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.current || isRedirecting || !isPaid}
                  className={`w-full h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                    ${plan.current
                      ? "bg-secondary text-muted-foreground cursor-default"
                      : plan.popular
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                      : "border border-border/60 text-foreground hover:bg-accent"
                    } disabled:opacity-60`}
                >
                  {isRedirecting
                    ? <><Loader2 size={14} className="animate-spin" /> {t("upgrade.redirecting")}</>
                    : actionLabel}
                </button>

                {/* Cancel / Reactivate for current paid plan */}
                {plan.current && isPaid && (
                  <div className="mt-3">
                    {subscription?.cancel_at_period_end ? (
                      <button
                        onClick={() => setConfirmModal({ planId: plan.id, isCancel: false })}
                        disabled={!!isCancelling}
                        className="w-full h-9 rounded-xl text-xs font-medium border border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isCancelling ? <Loader2 size={12} className="animate-spin" /> : null}
                        {t("upgrade.reactivate")}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmModal({ planId: plan.id, isCancel: true })}
                        disabled={!!isCancelling}
                        className="w-full h-9 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isCancelling ? <Loader2 size={12} className="animate-spin" /> : null}
                        {t("upgrade.cancel")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Downgrade info note */}
        {currentPlanKey !== "basic" && (
          <p className="mt-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <AlertCircle size={12} />
            Unused credits roll over each month (capped at 1× your plan's monthly allocation).
          </p>
        )}
      </div>

      {/* ── Confirmation Modal ─────────────────────────────────────────────── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setConfirmModal(null)}
          />

          {/* Dialog */}
          <div className="relative z-10 bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
              confirmModal.isCancel ? "bg-destructive/10" : "bg-emerald-100"
            }`}>
              {confirmModal.isCancel
                ? <TriangleAlert size={22} className="text-destructive" />
                : <RotateCcw size={22} className="text-emerald-600" />
              }
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-foreground text-center mb-2">
              {confirmModal.isCancel ? "Cancel Subscription?" : "Reactivate Subscription?"}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
              {confirmModal.isCancel
                ? `Your plan will be downgraded to Basic immediately and Stripe will stop future charges. You can reactivate anytime.`
                : `Your ${currentPlanLabel} plan will resume. Stripe will charge you on the next billing date${renewalDate ? ` (${renewalDate})` : ""}.`
              }
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 h-10 rounded-xl border border-border/60 text-sm font-medium text-muted-foreground hover:bg-accent transition-all"
              >
                No, go back
              </button>
              <button
                onClick={() => {
                  const { planId, isCancel } = confirmModal;
                  setConfirmModal(null);
                  handleCancelOrReactivate(planId, isCancel);
                }}
                disabled={!!cancellingId}
                className={`flex-1 h-10 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 ${
                  confirmModal.isCancel
                    ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {cancellingId ? <Loader2 size={14} className="animate-spin" /> : null}
                {confirmModal.isCancel ? "Yes, cancel" : "Yes, reactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upgrade;
