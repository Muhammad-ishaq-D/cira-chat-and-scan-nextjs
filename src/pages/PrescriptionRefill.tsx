import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pill, FileText, Stethoscope, ShieldCheck, Clock } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import { isAuthenticated } from "@/lib/auth";

const PrescriptionRefill = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loggedIn = isAuthenticated();

  const steps = [
    { icon: FileText, titleKey: "pages.prescriptionRefill.step1Title", bodyKey: "pages.prescriptionRefill.step1Body" },
    { icon: Stethoscope, titleKey: "pages.prescriptionRefill.step2Title", bodyKey: "pages.prescriptionRefill.step2Body" },
    { icon: Pill, titleKey: "pages.prescriptionRefill.step3Title", bodyKey: "pages.prescriptionRefill.step3Body" },
  ];

  return (
    <>
      <SEO
        title="Prescription Refill — Cira AI Nurse"
        description="Request a prescription refill with Cira. Securely share your medication and history with a licensed doctor through our network."
        path="/prescription-refill"
      />
      <div className="min-h-screen bg-background">
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("pages.back")}
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={ciraLogo} alt="Cira" width={24} height={24} />
            <span className="font-heading text-lg">Cira</span>
          </button>
          <button
            onClick={() => navigate(loggedIn ? "/dashboard/prescription-refill" : "/login")}
            className="text-sm font-medium text-foreground hover:text-primary transition-colors"
          >
            {loggedIn ? t("pages.prescriptionRefill.openInDashboard") : t("nav.login")}
          </button>
        </nav>

        <section className="max-w-3xl mx-auto px-6 pt-10 pb-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Pill className="w-8 h-8 text-primary" />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            {t("pages.prescriptionRefill.eyebrow")}
          </p>
          <h1 className="font-heading text-4xl md:text-5xl leading-[1.1] text-foreground mb-5">
            {t("pages.prescriptionRefill.title")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("pages.prescriptionRefill.subtitle")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => navigate(loggedIn ? "/dashboard/prescription-refill" : "/login")}
              className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              {t("pages.prescriptionRefill.ctaPrimary")}
            </button>
            <button
              onClick={() => navigate("/free-chat")}
              className="px-6 py-3 rounded-full border border-border text-foreground font-medium hover:bg-accent/60 transition-colors"
            >
              {t("pages.prescriptionRefill.ctaSecondary")}
            </button>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 pb-20">
          <h2 className="font-heading text-2xl md:text-3xl text-center mb-10">
            {t("pages.prescriptionRefill.howTitle")}
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="rounded-2xl border bg-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-heading text-3xl text-primary/80">{i + 1}</span>
                  <s.icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl mb-2">{t(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(s.bodyKey)}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex items-start gap-3 rounded-2xl border bg-secondary/40 p-5 max-w-3xl mx-auto">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t("pages.prescriptionRefill.disclaimer")}
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default PrescriptionRefill;
