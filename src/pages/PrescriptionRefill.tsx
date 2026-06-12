import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Pill } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import { isAuthenticated } from "@/lib/auth";

const PrescriptionRefill = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loggedIn = isAuthenticated();

  return (
    <>
      <SEO
        title="Prescription Refill — Cira AI Nurse"
        description="Request a prescription refill with Cira. Securely share your medication and history with a licensed doctor through our network."
        path="/prescription-refill"
      />
      <div className="min-h-screen bg-background">
        {/* Top nav */}
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("common.back")}
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

        {/* Start page content */}
        <section className="max-w-xl mx-auto px-6 pt-8 pb-16 text-center">
          {/* Pill icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-6">
            <Pill className="w-7 h-7 text-primary" />
          </div>

          {/* Title */}
          <h1 className="font-heading text-3xl md:text-4xl leading-[1.1] text-foreground mb-3">
            {t("pages.prescriptionRefill.startTitle")}
          </h1>

          {/* Subtitle / Powered by badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="inline-block text-[10px] uppercase tracking-[0.15em] text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
              {t("pages.prescriptionRefill.startSubtitle")}
            </span>
          </div>

          {/* Main CTA */}
          <button
            onClick={() => navigate(loggedIn ? "/dashboard/prescription-refill" : "/login")}
            className="w-full sm:w-auto px-10 py-4 rounded-full bg-primary text-primary-foreground text-lg font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            {t("pages.prescriptionRefill.startCta")}
          </button>

          {/* Trust text */}
          <div className="mt-6 space-y-1">
            <p className="text-sm font-medium text-foreground">
              {t("pages.prescriptionRefill.price")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {t("pages.prescriptionRefill.refund")}
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default PrescriptionRefill;
