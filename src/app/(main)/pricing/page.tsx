"use client";

import { useNavigate } from '@/lib/react-router-compat';
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Star, Shield, Zap, Crown } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ciraLogo from "@/assets/cira-logo.svg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const faqs = t("pages.pricing.faqs", { returnObjects: true }) as { q: string; a: string }[];

  const plans = [
    {
      id: "basic",
      name: "Basic",
      icon: Shield,
      color: "from-slate-100 to-slate-200",
      iconColor: "text-slate-600",
      desc: "Try Cira with no signup, no credit card, no catch.",
      price: "Free",
      period: "",
      saving: null,
      cta: t("pricing.plans.free.cta"),
      action: () => navigate("/free-chat"),
      highlight: false,
      features: [
        "1 Face Scan",
        "100,000 Chat Credits",
        "Basic Vital Signs",
        "Health Risk Overview",
        "Email Support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      icon: Zap,
      color: "from-primary/20 to-primary/10",
      iconColor: "text-primary",
      desc: "Advanced monitoring for health-conscious individuals.",
      price: billing === "yearly" ? "$48" : "$5",
      period: billing === "yearly" ? "/year" : "/mo",
      saving: billing === "yearly" ? "Save $12 a year" : null,
      cta: "Get Pro",
      action: () => navigate("/upgrade"),
      highlight: true,
      features: [
        "4 Face Scans / month",
        "500,000 Chat Credits",
        "All Vital Signs + Trends",
        "Detailed Health Indices",
        "3 Doctor Consults",
        "Export Reports (PDF)",
        "Priority Support",
        "7-day money-back guarantee",
        "Cancel anytime",
      ],
      footnote: t("pricing.plans.premium.footnote"),
    },
    {
      id: "enterprise",
      name: "Enterprise",
      icon: Crown,
      color: "from-amber-100 to-orange-100",
      iconColor: "text-amber-600",
      desc: "Complete health intelligence for professionals.",
      price: billing === "yearly" ? "$96" : "$10",
      period: billing === "yearly" ? "/year" : "/mo",
      saving: billing === "yearly" ? "Save $24 a year" : null,
      cta: "Get Enterprise",
      action: () => navigate("/upgrade"),
      highlight: false,
      features: [
        "Unlimited Face Scans",
        "Unlimited Chat Credits",
        "10 Doctor Consults",
        "Advanced AI Diagnostics",
        "Priority Support",
        "All Reports",
        "HIPAA Private",
        "7-day money-back guarantee",
        "Cancel anytime",
      ],
    },
  ];

  return (
    <>
      <SEO path="/pricing" />
      <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

        {/* Gradient blobs */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10">
          <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
            <button onClick={() => navigate("/")} className="flex items-center gap-2">
              <img src={ciraLogo.src} alt="Cira health logo" width={32} height={32} />
              <span className="text-2xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Cira</span>
            </button>
            <button
              onClick={() => navigate("/")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft size={14} /> {t("pages.back")}
            </button>
          </nav>

          <section className="max-w-3xl mx-auto px-6 pt-10 pb-14 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{t("pricing.badge")}</p>
            <h1 className="text-4xl md:text-5xl font-light leading-tight mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pricing.title1")}<br />{t("pricing.title2")}
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {t("pricing.subtitle")}
            </p>

            <div className="inline-flex items-center gap-1 mt-8 p-1 rounded-full bg-stone-100 border border-stone-200">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billing === "monthly" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t("pricing.monthly")}
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  billing === "yearly" ? "bg-foreground text-background shadow-sm" : "text-muted-foreground"
                }`}
              >
                {t("pricing.yearly")}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${billing === "yearly" ? "bg-emerald-500/20 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
                  {t("pricing.savePercent")}
                </span>
              </button>
            </div>
          </section>

          <section className="max-w-5xl mx-auto px-6 pb-20">
            <div className="grid md:grid-cols-3 gap-5">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={`relative bg-card/80 backdrop-blur-sm border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col ${
                      plan.highlight
                        ? "border-primary/40 ring-2 ring-primary/10"
                        : "border-border/50"
                    }`}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <Star size={10} fill="currentColor" /> {t("pricing.mostPopular")}
                        </span>
                      </div>
                    )}

                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon size={22} className={plan.iconColor} />
                    </div>

                    <h3 className="text-lg font-semibold mb-1 text-foreground">{plan.name}</h3>
                    <p className="text-xs mb-4 text-muted-foreground">{plan.desc}</p>

                    <div className="mb-6">
                      <span className="text-3xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {plan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                      {plan.saving && (
                        <p className="text-xs mt-1 text-emerald-600">{plan.saving}</p>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                          <Check size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={plan.action}
                      className={`w-full h-11 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                        plan.highlight
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30"
                          : "border border-border/60 text-foreground hover:bg-accent"
                      }`}
                    >
                      {plan.cta}
                    </button>

                    {plan.footnote && (
                      <p className="text-xs italic mt-4 pt-4 border-t border-border/50 text-muted-foreground">
                        {plan.footnote}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="max-w-3xl mx-auto px-6 pb-24">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-light mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("pricing.faqTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pricing.faqSubtitle")}</p>
            </div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border border-border/50 rounded-xl px-5 bg-card/80 backdrop-blur-sm"
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

          <section className="max-w-3xl mx-auto px-6 pb-24 text-center">
            <div className="rounded-3xl bg-foreground text-background p-12 md:p-16">
              <h2 className="text-3xl md:text-4xl font-light mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t("pricing.ctaTitle")}
              </h2>
              <p className="text-background/70 text-sm mb-8 max-w-md mx-auto">
                {t("pricing.ctaSubtitle")}
              </p>
              <button
                onClick={() => navigate("/free-chat")}
                className="inline-flex items-center gap-2 px-7 h-12 rounded-full bg-white text-foreground font-medium text-sm hover:bg-stone-100 transition-colors"
              >
                {t("pricing.ctaButton")}
              </button>
            </div>
          </section>

          <footer className="max-w-4xl mx-auto px-6 pb-10 flex flex-col items-center gap-3 text-center text-xs text-muted-foreground">
            <LanguageSwitcher />
            <p>{t("pages.pricing.footer")}</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Pricing;
