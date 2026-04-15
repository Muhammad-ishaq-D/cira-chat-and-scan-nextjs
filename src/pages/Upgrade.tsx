import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, CreditCard, Shield, Zap, Crown, Sparkles, Star, Loader2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { billingApi } from "@/lib/apiClient";
import { toast } from "sonner";

interface Plan {
  id: string; name: string; price: string; period: string; desc: string;
  icon: any; color: string; iconColor: string; current?: boolean; popular?: boolean;
  features: string[];
}

const defaultPlans: Plan[] = [
  {
    id: "basic", name: "Basic", price: "Free", period: "", desc: "Get started with essential health insights",
    icon: Shield, color: "from-slate-100 to-slate-200", iconColor: "text-slate-600", current: true,
    features: ["1 Face Scan", "100,000 Chat Credits", "Basic Vital Signs", "Health Risk Overview", "Email Support"],
  },
  {
    id: "pro", name: "Pro", price: "$29.99", period: "/mo", desc: "Advanced monitoring for health-conscious individuals",
    icon: Zap, color: "from-primary/20 to-primary/10", iconColor: "text-primary", popular: true,
    features: ["20 Face Scans / month", "500,000 Chat Credits", "All Vital Signs + Trends", "Detailed Health Indices", "3 Doctor Consults", "Export Reports (PDF)", "Priority Support"],
  },
  {
    id: "enterprise", name: "Enterprise", price: "$99.99", period: "/mo", desc: "Complete health intelligence for professionals",
    icon: Crown, color: "from-amber-100 to-orange-100", iconColor: "text-amber-600",
    features: ["Unlimited Face Scans", "Unlimited Chat Credits", "10 Doctor Consults", "Advanced AI Diagnostics", "Priority Support", "All Reports", "HIPAA Compliance"],
  },
];

const Upgrade = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(defaultPlans);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    billingApi.getPlans()
      .then((rawData) => {
        const data = Array.isArray(rawData) ? rawData : rawData?.plans;
        if (Array.isArray(data) && data.length > 0) {
          // Merge API plans with UI defaults for icons
          setPlans(prev => prev.map(p => {
            const apiPlan = data.find((ap: any) => ap.id === p.id || ap.plan_id === p.id || ap.name?.toLowerCase() === p.id);
            if (apiPlan) {
              const apiPrice = apiPlan.price_display || apiPlan.price || apiPlan.amount || apiPlan.monthly_price;
              const displayPrice = typeof apiPrice === 'number' ? `$${apiPrice}` : (apiPrice ? (String(apiPrice) === '0' || String(apiPrice) === '0.00' ? 'Free' : `$${apiPrice}`) : p.price);
              
              // Build dynamic features from API data
              const dynamicFeatures: string[] = [];
              const scans = apiPlan.face_scans ?? -1;
              const credits = apiPlan.chat_credits ?? -1;
              
              dynamicFeatures.push(scans === -1 ? "Unlimited Face Scans" : `${scans} Face Scan${scans !== 1 ? 's' : ''} / month`);
              dynamicFeatures.push(credits === -1 ? "Unlimited Chat Credits" : `${credits.toLocaleString()} Chat Credits`);
              // Parse additional features from JSON
              try {
                const featureFlags = typeof apiPlan.features === 'string' ? JSON.parse(apiPlan.features) : apiPlan.features;
                if (featureFlags && typeof featureFlags === 'object' && !Array.isArray(featureFlags)) {
                  if (featureFlags.vitals_scan) dynamicFeatures.push("Vital Signs Monitoring");
                  if (featureFlags.reports) dynamicFeatures.push("Export Reports (PDF)");
                  if (featureFlags.doctor) dynamicFeatures.push("Doctor Access");
                  if (featureFlags.priority_support) dynamicFeatures.push("Priority Support");
                } else if (Array.isArray(featureFlags)) {
                  dynamicFeatures.push(...featureFlags);
                }
              } catch {}
              
              return { ...p, price: displayPrice, features: dynamicFeatures };
            }
            return p;
          }));
        }
      })
      .catch(() => {});
    
    billingApi.getSubscription()
      .then((sub) => {
        if (sub?.plan_id || sub?.plan_name) {
          setPlans(prev => prev.map(p => ({
            ...p,
            current: p.id === sub.plan_id || p.name.toLowerCase() === (sub.plan_name || "").toLowerCase(),
          })));
        }
      })
      .catch(() => {});
  }, []);

  const handleUpgrade = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (plan?.current) return;
    setSelectedPlan(planId);
    setShowPayment(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await billingApi.subscribe(selectedPlan!, {
        card_number: cardNumber.replace(/\s/g, ""),
        expiry,
        cvc,
        cardholder_name: name,
      });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: any) {
      toast.error(err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  const formatCard = (val: string) => {
    const nums = val.replace(/\D/g, "").slice(0, 16);
    return nums.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val: string) => {
    const nums = val.replace(/\D/g, "").slice(0, 4);
    if (nums.length >= 3) return nums.slice(0, 2) + "/" + nums.slice(2);
    return nums;
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
        </div>
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check size={36} className="text-emerald-600" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            Welcome to {plans.find((p) => p.id === selectedPlan)?.name}!
          </h1>
          <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (showPayment) {
    const plan = plans.find((p) => p.id === selectedPlan);
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-6 py-12">
          <button onClick={() => setShowPayment(false)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft size={16} />Back to plans
          </button>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div><h2 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan?.name} Plan</h2><p className="text-sm text-muted-foreground">{plan?.desc}</p></div>
              <div className="text-right"><p className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan?.price}</p><p className="text-xs text-muted-foreground">{plan?.period}</p></div>
            </div>
          </div>
          <form onSubmit={handlePayment} className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 mb-2"><CreditCard size={18} className="text-muted-foreground" /><h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Payment Details</h3></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cardholder Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Card Number</label><input type="text" value={cardNumber} onChange={(e) => setCardNumber(formatCard(e.target.value))} placeholder="4242 4242 4242 4242" required className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono tracking-wider" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry</label><input type="text" value={expiry} onChange={(e) => setExpiry(formatExpiry(e.target.value))} placeholder="MM/YY" required className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" /></div>
              <div><label className="text-xs font-medium text-muted-foreground mb-1.5 block">CVC</label><input type="text" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" required className="w-full h-11 rounded-xl border border-border/60 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono" /></div>
            </div>
            <button type="submit" disabled={processing} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-medium text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all disabled:opacity-60">
              {processing ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Processing...</span> : `Pay ${plan?.price}${plan?.period}`}
            </button>
            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground"><Shield size={12} /><span>Secured with 256-bit SSL encryption</span></div>
          </form>
        </div>
      </div>
    );
  }

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
            return (
              <div key={plan.id} className={`relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all ${(plan as any).popular ? "border-primary/40 ring-2 ring-primary/10" : "border-border/50"}`}>
                {(plan as any).popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1"><Star size={10} /> Most Popular</span></div>}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}><Icon size={22} className={plan.iconColor} /></div>
                <h3 className="text-lg font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.name}</h3>
                <p className="text-xs text-muted-foreground mb-4">{plan.desc}</p>
                <div className="mb-6"><span className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{plan.price}</span><span className="text-sm text-muted-foreground">{plan.period}</span></div>
                <ul className="space-y-2.5 mb-6">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-xs text-foreground"><Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />{f}</li>))}</ul>
                <button onClick={() => handleUpgrade(plan.id)} disabled={plan.current} className={`w-full h-11 rounded-xl text-sm font-medium transition-all ${plan.current ? "bg-secondary text-muted-foreground cursor-default" : (plan as any).popular ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30" : "border border-border/60 text-foreground hover:bg-accent"}`}>{plan.current ? "Current Plan" : "Upgrade"}</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Upgrade;
