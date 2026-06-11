import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import {
  MessageSquare,
  Stethoscope,
  ShieldCheck,
  Clock,
  HeartPulse,
  Brain,
  Thermometer,
  Activity,
  AlertCircle,
  Pill,
} from "lucide-react";

const SymptomChecker = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const commonSymptoms = [
    { icon: Thermometer, label: t("symptomChecker.symptoms.items.fever") },
    { icon: Brain, label: t("symptomChecker.symptoms.items.headache") },
    { icon: Activity, label: t("symptomChecker.symptoms.items.chest") },
    { icon: HeartPulse, label: t("symptomChecker.symptoms.items.breath") },
    { icon: AlertCircle, label: t("symptomChecker.symptoms.items.abdominal") },
    { icon: Pill, label: t("symptomChecker.symptoms.items.medication") },
  ];

  const steps = [
    {
      icon: MessageSquare,
      title: t("symptomChecker.steps.one.title"),
      text: t("symptomChecker.steps.one.text"),
    },
    {
      icon: Stethoscope,
      title: t("symptomChecker.steps.two.title"),
      text: t("symptomChecker.steps.two.text"),
    },
    {
      icon: ShieldCheck,
      title: t("symptomChecker.steps.three.title"),
      text: t("symptomChecker.steps.three.text"),
    },
  ];

  const faqs = [
    { q: t("symptomChecker.faq.q1.q"), a: t("symptomChecker.faq.q1.a") },
    { q: t("symptomChecker.faq.q2.q"), a: t("symptomChecker.faq.q2.a") },
    { q: t("symptomChecker.faq.q3.q"), a: t("symptomChecker.faq.q3.a") },
    { q: t("symptomChecker.faq.q4.q"), a: t("symptomChecker.faq.q4.a") },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Cira Free AI Symptom Checker",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: "https://askainurse.com/symptom-checker",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description: t("symptomChecker.seoDescription"),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <SEO
        title={t("symptomChecker.seoTitle")}
        description={t("symptomChecker.seoDescription")}
        path="/symptom-checker"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
        <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src={ciraLogo} alt="Cira health logo" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          </button>
          <button
            onClick={() => navigate("/free-chat")}
            className="text-sm font-body text-foreground hover:text-primary transition-colors"
          >
            {t("symptomChecker.nav.startFreeChat")}
          </button>
        </nav>

        <header className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-6">
            {t("symptomChecker.hero.eyebrow")}
          </p>
          <h1 className="font-heading text-[44px] md:text-[64px] font-semibold text-foreground leading-[1.05] mb-6">
            {t("symptomChecker.hero.title")}
          </h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            {t("symptomChecker.hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/free-chat")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-body text-sm hover:opacity-90 transition-opacity"
            >
              {t("symptomChecker.hero.ctaPrimary")}
            </button>
            <button
              onClick={() => navigate("/how-it-works")}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors px-4 py-3"
            >
              {t("symptomChecker.hero.ctaSecondary")}
            </button>
          </div>
          <p className="text-xs text-muted-foreground/80 mt-6 italic max-w-xl mx-auto">
            {t("symptomChecker.hero.disclaimer")}
          </p>
        </header>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 text-center">
            {t("symptomChecker.symptoms.title")}
          </h2>
          <p className="font-body text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            {t("symptomChecker.symptoms.subtitle")}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {commonSymptoms.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-5 rounded-2xl border border-border/60 bg-card/40"
              >
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <span className="font-body text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-12 text-center">
            {t("symptomChecker.steps.title")}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="p-6 rounded-2xl border border-border/60 bg-card/40">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-body text-muted-foreground">
                    {t("symptomChecker.steps.stepLabel", { n: i + 1 })}
                  </span>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-10 text-center">
            {t("symptomChecker.faq.title")}
          </h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q} className="p-6 rounded-2xl border border-border/60 bg-card/40">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  {f.q}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-border/60">
          <Clock className="w-6 h-6 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4">
            {t("symptomChecker.cta.title")}
          </h2>
          <p className="font-body text-muted-foreground mb-8 max-w-xl mx-auto">
            {t("symptomChecker.cta.text")}
          </p>
          <button
            onClick={() => navigate("/free-chat")}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-body text-sm hover:opacity-90 transition-opacity"
          >
            {t("symptomChecker.cta.button")}
          </button>
        </section>
      </div>
    </>
  );
};

export default SymptomChecker;
