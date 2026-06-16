import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, Sparkles, Star, Users, Heart, Shield } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ciraLogo from "@/assets/cira-logo.svg";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SEO from "@/components/SEO";

const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const faqs = t("pages.pricing.faqs", { returnObjects: true }) as { q: string; a: string }[];

  const plans = [
    {
      id: "free",
      name: t("pricing.plans.free.name"),
      icon: Heart,
      desc: t("pricing.plans.free.desc"),
      price: "$0",
      period: t("pricing.plans.free.period"),
      cta: t("pricing.plans.free.cta"),
      action: () => navigate("/free-chat"),
      highlight: false,
      features: t("pages.pricing.features.free", { returnObjects: true }) as string[],
    },
    {
      id: "premium",
      name: t("pricing.plans.premium.name"),
      icon: Sparkles,
      desc: t("pricing.plans.premium.desc"),
      price: billing === "yearly" ? "$48" : "$5",
      period: billing === "yearly" ? t("pricing.plans.premium.perYear") : t("pricing.plans.premium.perMonth"),
      saving: billing === "yearly" ? t("pricing.plans.premium.saveYearly") : null,
      cta: t("pricing.plans.premium.cta"),
      action: () => navigate("/upgrade"),
      highlight: true,
      features: t("pages.pricing.features.premium", { returnObjects: true }) as string[],
      footnote: t("pricing.plans.premium.footnote"),
    },
    {
      id: "family",
      name: t("pricing.plans.family.name"),
      icon: Users,
      desc: t("pricing.plans.family.desc"),
      price: billing === "yearly" ? "$96" : "$10",
      period: billing === "yearly" ? t("pricing.plans.premium.perYear") : t("pricing.plans.premium.perMonth"),
      saving: billing === "yearly" ? t("pricing.plans.family.saveYearly") : null,
      cta: t("pricing.plans.family.cta"),
      action: () => navigate("/upgrade"),
      highlight: false,
      features: t("pages.pricing.features.family", { returnObjects: true }) as string[],
    },
  ];

  return (
    <>
      <SEO
        path="/pricing"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: (faqs || []).map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
    <div className="min-h-screen bg-[#fdfaf3] text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira health logo" width={32} height={32} />
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
                      <Star size={10} fill="white" /> {t("pricing.mostPopular")}
                    </span>
                  </div>
                )}

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${plan.highlight ? "bg-pink-50" : "bg-stone-100"}`}>
                  <Icon size={20} className={plan.highlight ? "text-pink-600" : "text-foreground"} />
                </div>

                <h3 className="text-xl font-semibold mb-1 text-foreground">{plan.name}</h3>
                <p className="text-sm mb-6 text-muted-foreground">{plan.desc}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  {plan.saving && (
                    <p className="text-xs mt-1 text-emerald-600">{plan.saving}</p>
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

        <div className="mt-16 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Shield size={14} />
            {t("pricing.trusted")}
          </div>
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
    </>
  );
};

export default Pricing;
