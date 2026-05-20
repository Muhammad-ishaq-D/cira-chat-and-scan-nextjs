import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Check, Sparkles, Star, Users, Heart, Shield } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import LandingMenu from "@/components/LandingMenu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    q: "Do I need to sign up to try it?",
    a: "No. You can chat with Cira and run one face scan completely free — no account, no credit card, no commitment.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in one click from your account. No emails, no phone calls, no retention pressure.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes — a 7-day money-back guarantee on Premium and Family plans. If Cira isn't right for you, we'll refund you in full.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit cards, debit cards, Apple Pay and Google Pay. Local payment methods are added in select markets.",
  },
  {
    q: "Will my price ever go up?",
    a: "Your price is locked in for as long as your subscription stays active. We honor the rate you signed up with.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Face scans are processed 100% on-device — your video never leaves your phone. Your conversations and vitals are encrypted and never sold.",
  },
  {
    q: "Is this a replacement for a doctor?",
    a: "No. Cira is an AI nurse who helps you understand your symptoms and decide your next step. She does not replace professional medical advice.",
  },
  {
    q: "Can I switch between Premium and Family?",
    a: "Yes — upgrade, downgrade or switch plans at any time from your account settings.",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      id: "free",
      name: "Free",
      icon: Heart,
      desc: "Try Cira with no signup, no credit card, no catch.",
      price: "$0",
      period: "forever",
      cta: "Start Free",
      action: () => navigate("/free-chat"),
      highlight: false,
      features: [
        "Chat with Cira, your AI nurse",
        "1 free face scan",
        "Instant health insights",
        "No account required",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      icon: Sparkles,
      desc: "Everything you need for ongoing health support.",
      price: billing === "yearly" ? "$48" : "$5",
      period: billing === "yearly" ? "/year" : "/month",
      saving: billing === "yearly" ? "Save $12 a year" : null,
      cta: "Get Premium",
      action: () => navigate("/upgrade"),
      highlight: true,
      features: [
        "Unlimited face scans",
        "Full conversation history",
        "Detailed clinical reports",
        "Priority response speed",
        "7-day money-back guarantee",
        "Cancel anytime",
      ],
      footnote: "Less than a coffee. More than a checkup.",
    },
    {
      id: "family",
      name: "Family",
      icon: Users,
      desc: "Cira for the whole household — up to 4 members.",
      price: billing === "yearly" ? "$96" : "$10",
      period: billing === "yearly" ? "/year" : "/month",
      saving: billing === "yearly" ? "Save $24 a year" : null,
      cta: "Get Family",
      action: () => navigate("/upgrade"),
      highlight: false,
      features: [
        "Everything in Premium",
        "Up to 4 individual profiles",
        "Separate health histories per person",
        "Ideal for parents managing kids' and elders' health",
        "7-day money-back guarantee",
        "Cancel anytime",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#fdfaf3] text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <LandingMenu />
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={ciraLogo} alt="Cira" width={32} height={32} />
            <span className="text-2xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Cira</span>
          </button>
        </div>
        <button
          onClick={() => navigate("/")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-10 pb-14 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">Pricing</p>
        <h1 className="text-4xl md:text-5xl font-light leading-tight mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
          Simple. Honest.<br />Built for everyone.
        </h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          No hidden fees. No insurance paperwork. Cancel in one click.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-full bg-stone-100 border border-stone-200">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              billing === "monthly" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              billing === "yearly" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            Yearly
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${billing === "yearly" ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
              Save 20%
            </span>
          </button>
        </div>
      </section>

      {/* Plans */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-7 transition-all bg-white shadow-sm ${
                  plan.highlight
                    ? "border-2 border-pink-400 shadow-[0_10px_40px_-10px_rgba(236,72,153,0.35)] md:scale-[1.03]"
                    : "border border-stone-200 hover:border-stone-300"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 text-white text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <Star size={10} fill="white" /> Most Popular
                    </span>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${plan.highlight ? "bg-pink-50" : "bg-stone-100"}`}>
                  <Icon size={20} className={plan.highlight ? "text-pink-600" : "text-foreground"} />
                </div>

                <h3 className="text-xl font-semibold mb-1 text-foreground">{plan.name}</h3>
                <p className="text-sm mb-6 text-muted-foreground">
                  {plan.desc}
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  {plan.saving && (
                    <p className="text-xs mt-1 text-emerald-600">
                      {plan.saving}
                    </p>
                  )}
                </div>

                <button
                  onClick={plan.action}
                  className={`w-full h-11 rounded-xl text-sm font-medium transition-all mb-6 ${
                    plan.highlight
                      ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white hover:from-pink-600 hover:to-pink-700 shadow-md"
                      : "bg-stone-100 text-foreground hover:bg-stone-200 border border-stone-200"
                  }`}
                >
                  {plan.cta}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check size={11} className="text-emerald-600" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>

                {plan.footnote && (
                  <p className="text-xs italic mt-6 pt-5 border-t border-stone-200 text-muted-foreground">
                    {plan.footnote}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust */}
        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Shield size={14} />
            Trusted by users in 30+ countries
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Frequently asked questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know before you start.
          </p>
        </div>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-stone-200 rounded-xl px-5 bg-white"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
        <div className="rounded-3xl bg-foreground text-background p-12 md:p-16">
          <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Start with Cira today.
          </h2>
          <p className="text-background/70 text-sm mb-8 max-w-md mx-auto">
            No signup needed for your first scan.
          </p>
          <button
            onClick={() => navigate("/free-chat")}
            className="inline-flex items-center gap-2 px-7 h-12 rounded-full bg-white text-foreground font-medium text-sm hover:bg-stone-100 transition-colors"
          >
            Try Cira Free
          </button>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-10 text-center text-xs text-muted-foreground">
        <p>© 2026 AskAINurse · Cira AI</p>
      </footer>
    </div>
  );
};

export default Pricing;
