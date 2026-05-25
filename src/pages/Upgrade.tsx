import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Shield, Zap, Crown, Sparkles, Star, Loader2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { billingApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe";

interface Plan {
  id: string; name: string; price: string; period: string; desc: string;
  icon: any; color: string; iconColor: string; current?: boolean; popular?: boolean;
  features: string[];
  stripe_price_id?: string;
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
    features: ["20 Face Scans / month", "500,000 Chat Credits", "All Vital Signs + Trends", "Detailed Health Indices", "3 Doctor Consults", "Export Reports (PDF)", "Priority Support"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "$10.00", period: "/mo", desc: "Complete health intelligence for professionals",
    icon: Crown, color: "from-amber-100 to-orange-100", iconColor: "text-amber-600",
    features: ["Unlimited Face Scans", "Unlimited Chat Credits", "10 Doctor Consults", "Advanced AI Diagnostics", "Priority Support", "All Reports", "HIPAA Compliance"],
  },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>(defaultPlans);
  const [redirectingId, setRedirectingId] = useState<string | null>(null);

  useEffect(() => {
    billingApi.getPlans()
      .then((rawData) => {
        const data = Array.isArray(rawData) ? rawData : rawData?.plans;
        if (Array.isArray(data) && data.length > 0) {
          setPlans(prev => prev.map(p => {
            const apiPlan = data.find((ap: any) => ap.id === p.id || ap.plan_id === p.id || ap.name?.toLowerCase() === p.id);
            if (apiPlan) {
              const apiPrice = apiPlan.price_display || apiPlan.price || apiPlan.amount || apiPlan.monthly_price;
              const displayPrice = typeof apiPrice === 'number' ? `$${apiPrice}` : (apiPrice ? (String(apiPrice) === '0' || String(apiPrice) === '0.00' ? 'Free' : `$${apiPrice}`) : p.price);

              const dynamicFeatures: string[] = [];
              const scans = apiPlan.face_scans ?? -1;
              const credits = apiPlan.chat_credits ?? -1;
              const isScansUnlimited = scans === -1 || String(scans).toLowerCase() === 'unlimited';
              const isCreditsUnlimited = credits === -1 || String(credits).toLowerCase() === 'unlimited';
              dynamicFeatures.push(isScansUnlimited ? "Unlimited Face Scans" : `${scans} Face Scan${String(scans) !== '1' ? 's' : ''} / month`);
              dynamicFeatures.push(isCreditsUnlimited ? "Unlimited Chat Credits" : `${Number(credits).toLocaleString()} Chat Credits`);
              try {
                const featureFlags = typeof apiPlan.features === 'string' ? JSON.parse(apiPlan.features) : apiPlan.features;
                if (featureFlags && typeof featureFlags === 'object' && !Array.isArray(featureFlags)) {
                  if (featureFlags.vitals_scan) dynamicFeatures.push("Vital Signs Monitoring");
                  if (featureFlags.reports) dynamicFeatures.push("Export Reports (PDF)");
                  if (featureFlags.priority_support) dynamicFeatures.push("Priority Support");
                } else if (Array.isArray(featureFlags)) {
                  dynamicFeatures.push(...featureFlags);
                }
              } catch {}

              return {
                ...p,
                id: apiPlan.id ?? p.id,
                price: displayPrice,
                features: dynamicFeatures,
                stripe_price_id: apiPlan.stripe_price_id || apiPlan.price_id,
              };
            }
            return p;
          }));
        }
      })
      .catch(() => {});

    billingApi.getSubscription()
      .then((sub) => {
        const activeName = (sub?.plan_name || "basic").toLowerCase();
        setPlans(prev => prev.map(p => ({ ...p, current: p.name.toLowerCase() === activeName })));
      })
      .catch(() => {
        setPlans(prev => prev.map(p => ({ ...p, current: p.name.toLowerCase() === "basic" })));
      });
  }, []);

  const handleUpgrade = (plan: Plan) => {
    if (plan.current) return;
    if (plan.id === "basic" || plan.name.toLowerCase() === "basic") return;

    const link =
      STRIPE_PAYMENT_LINKS[plan.name.toLowerCase()] ||
      STRIPE_PAYMENT_LINKS[plan.id];

    if (!link) {
      toast.error("Payment link is not configured for this plan.");
      return;
    }

    setRedirectingId(plan.id);
    // Force same-tab navigation (break out of preview iframe if needed)
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = link;
        return;
      }
    } catch {
      // cross-origin iframe — fall through
    }
    window.location.assign(link);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft size={16} />Back to Dashboard
        </button>
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4"><img src={ciraLogo} alt="Cira" width={28} height={28} /><Sparkles size={20} className="text-primary" /></div>
          <h1 className="text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Choose Your Plan</h1>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">Unlock advanced health insights and unlimited scans with a plan that fits your needs.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isRedirecting = redirectingId === plan.id;
            return (
              <div key={plan.id} className={`relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all ${(plan as any).popular ? "border-primary/40 ring-2 ring-primary/10" : "border-border/50"}`}>
                {(plan as any).popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"><Star size={10} /> Most Popular</span></div>}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}><Icon size={22} className={plan.iconColor} /></div>
                <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6"><span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.price}</span><span className="text-sm text-muted-foreground">{plan.period}</span></div>
                <ul className="space-y-2.5 mb-6">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-xs text-foreground"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />{f}</li>))}</ul>
                <button
                  onClick={() => handleUpgrade(plan)}
                  disabled={plan.current || isRedirecting || plan.name.toLowerCase() === "basic"}
                  className={`w-full h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${plan.current ? "bg-secondary text-muted-foreground cursor-default" : (plan as any).popular ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : "border border-border/60 text-foreground hover:bg-accent"} disabled:opacity-60`}
                >
                  {isRedirecting ? (<><Loader2 size={14} className="animate-spin" /> Redirecting…</>) : plan.current ? "Current Plan" : plan.name.toLowerCase() === "basic" ? "Free" : "Upgrade"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
