"use client";

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from '@/lib/react-router-compat';
import { useTranslation } from "react-i18next";
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
    scans: "10 Face Scans",
    chat: "1,000,000 Chat Credits",
    consults: "10 Doctor Consults",
  },
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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
        normalizePlanKey(globalThis?.sessionStorage?.getItem(PENDING_PLAN_STORAGE_KEY) || "") ||
        null;

      if (!resolvedKey || resolvedKey === "basic") {
        if (!cancelled) {
          setErrorMsg(t("paymentSuccess.noPlan"));
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
        globalThis?.sessionStorage?.removeItem(PENDING_PLAN_STORAGE_KEY);
      } catch (err: unknown) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : t("paymentSuccess.activationFailed"));
        setStatus("error");
      }
    };
    run();
    return () => { cancelled = true; };
  }, [searchParams, t]);

  const meta = PLAN_META[planKey] || PLAN_META["pro"];
  const PlanIcon = meta?.icon ?? Zap;
  const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(i18n.language, {
    year: "numeric", month: "long", day: "numeric",
  });

  const currency = payment?.currency ?? "usd";
  const fmt = (amount: number | null) =>
    amount != null
      ? new Intl.NumberFormat(i18n.language, { style: "currency", currency }).format(amount)
      : meta?.price ?? "$5.00";

  const displaySubtotal = fmt(payment?.subtotal ?? null);
  const displayTax = payment?.tax ? fmt(payment.tax) : null;
  const displayTotal = fmt(payment?.total ?? null);

  if (status === "activating") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-10 shadow-xl text-center max-w-sm w-full">
          <img src={ciraLogo.src} alt="Cira" width={36} height={36} className="mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <Loader2 size={26} className="text-primary animate-spin" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{t("paymentSuccess.activating")}</h1>
          <p className="text-sm text-muted-foreground">{t("paymentSuccess.activatingBody")}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        </div>
        <div className="relative z-10 bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-10 shadow-xl text-center max-w-sm w-full">
          <img src={ciraLogo.src} alt="Cira" width={36} height={36} className="mx-auto mb-6" />
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
            <AlertCircle size={26} className="text-amber-500" />
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">{t("paymentSuccess.issueTitle")}</h1>
          <p className="text-sm text-muted-foreground mb-8">{errorMsg}</p>
          <button
            onClick={() => navigate("/upgrade?paid=1")}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium mb-3"
          >
            {t("paymentSuccess.tryAgain")}
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full h-11 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-accent"
          >
            {t("paymentSuccess.goToDashboard")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex">
      <div className="w-[44%] h-full bg-muted/30 border-r border-border/50 flex flex-col px-14 py-12 overflow-y-auto">
        <div className="flex items-center gap-2 mb-12">
          <img src={ciraLogo.src} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </div>

        <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">
          {t("paymentSuccess.subscribeTo", { plan: planName })}
        </p>

        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-5xl font-bold text-foreground tracking-tight">{displaySubtotal}</span>
          <span className="text-sm text-muted-foreground mb-2">{t("paymentSuccess.perMonth")}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-10">{t("paymentSuccess.billedMonthlyRenews", { date: nextBilling })}</p>

        <div className="flex items-center gap-3 mb-10">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta?.color} flex items-center justify-center shrink-0`}>
            <PlanIcon size={18} className={meta?.iconColor} />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground capitalize">{planName}</p>
            <p className="text-xs text-muted-foreground">{t("paymentSuccess.billedMonthly")}</p>
          </div>
          <span className="ml-auto text-sm font-medium text-foreground">{displaySubtotal}</span>
        </div>

        <div className="border-t border-border/40" />

        <div className="mt-4 space-y-3 text-sm">
          {displayTax && (
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t("paymentSuccess.tax")}</span>
              <span className="font-medium text-foreground">{displayTax}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">{t("paymentSuccess.totalPaid")}</span>
            <span className="font-semibold text-foreground">{displayTotal}</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mt-auto pt-10 leading-relaxed">
          {t("paymentSuccess.statementFootnote")}
        </p>
      </div>

      <div className="flex-1 h-full flex flex-col items-center justify-center px-14 py-12 bg-background overflow-hidden">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={34} className="text-emerald-500" strokeWidth={1.8} />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground text-center mb-1">
            {t("paymentSuccess.thanksTitle")}
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-7">
            {t("paymentSuccess.thanksBody")}
          </p>

          <div className="border border-border/50 rounded-xl divide-y divide-border/40 mb-8 text-sm">
            {user?.email && (
              <div className="px-4 py-3.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("paymentSuccess.contactInfo")}</p>
                <p className="text-foreground font-medium">{user.email}</p>
              </div>
            )}
            <div className="px-4 py-3.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{t("paymentSuccess.creditsAllocated")}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <Scan size={13} className="text-primary shrink-0" />{meta?.scans}
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <MessageCircle size={13} className="text-primary shrink-0" />{meta?.chat}
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <UserCheck size={13} className="text-primary shrink-0" />{meta?.consults}
                </div>
              </div>
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{t("paymentSuccess.nextBillingDate")}</p>
              <p className="text-foreground font-medium">{nextBilling}</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all mb-3"
          >
            {t("paymentSuccess.goToDashboard")}
          </button>
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full h-10 rounded-xl border border-border/60 text-sm text-muted-foreground hover:bg-accent transition-all"
          >
            {t("paymentSuccess.viewPlan")}
          </button>

          <p className="text-center text-[11px] text-muted-foreground mt-6">
            {t("paymentSuccess.needHelp")}{" "}
            <a href="mailto:support@askainurse.com" className="text-primary hover:underline">
              support@askainurse.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
