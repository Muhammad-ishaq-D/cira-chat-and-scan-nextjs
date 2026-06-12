import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldCheck, Stethoscope, ArrowRight } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import PrescriptionRefillChat from "@/components/PrescriptionRefillChat";
import { isAuthenticated } from "@/lib/auth";

const PrescriptionRefill = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loggedIn = isAuthenticated();
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <SEO
        title="Prescription Refill — Cira AI Nurse"
        description="Request a prescription refill with Cira. Securely share your medication and history with a licensed doctor through our network."
        path="/prescription-refill"
      />

      {showChat ? (
        <div className="min-h-screen bg-[#f7f6f0]">
          <PrescriptionRefillChat onExit={() => setShowChat(false)} />
        </div>
      ) : (
        <div className="relative min-h-screen overflow-hidden bg-[#f7f6f0]">
          {/* Glassy gradient background */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-3xl" />
            <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-sky-200/60 via-primary/10 to-transparent blur-3xl" />
            <div className="absolute -bottom-40 left-1/4 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-200/40 via-cyan-100/30 to-transparent blur-3xl" />
          </div>

          {/* Top bar: logo left, auth right (no back button) */}
          <nav className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-5 max-w-7xl mx-auto">
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
              aria-label="Cira home"
            >
              <img src={ciraLogo} alt="Cira" width={28} height={28} />
              <span className="font-heading text-xl tracking-tight text-foreground">cira</span>
            </button>

            <div className="flex items-center gap-2">
              {!loggedIn && (
                <button
                  onClick={() => navigate("/login")}
                  className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium font-body hover:opacity-90 hover:scale-105 transition-all duration-200"
                >
                  {t("nav.login")}
                </button>
              )}
            </div>
          </nav>

          {/* Hero */}
          <section className="relative z-10 max-w-3xl mx-auto px-6 pt-12 sm:pt-24 pb-16 text-center">
            <h1
              className="font-heading text-foreground leading-[1.05] tracking-tight"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(2.75rem, 7vw, 5rem)",
                fontWeight: 500,
              }}
            >
              {t("pages.prescriptionRefill.startTitle")}
            </h1>

            {/* Floating glass CTA card */}
            <div className="mt-16 sm:mt-24 mx-auto max-w-md">
              <div
                className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/60 p-6 sm:p-7 text-center"
                style={{
                  boxShadow:
                    "0 30px 60px -20px rgba(15, 42, 60, 0.18), 0 8px 24px -12px rgba(15, 42, 60, 0.10), inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <p className="text-foreground font-semibold leading-snug" style={{ fontSize: 16 }}>
                {t(
                  "pages.prescriptionRefill.heroPitch",
                  "Get your prescription renewed by a licensed doctor. Straight to your inbox in minutes."
                )}
                </p>

                <button
                  onClick={() => setShowChat(true)}
                  className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
                  style={{ minHeight: 52, fontSize: 16 }}
                >
                  {t("pages.prescriptionRefill.startCta")}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <p className="mt-3 text-[11px] text-muted-foreground font-medium tracking-wide">
                  {t("pages.prescriptionRefill.price")}
                </p>
              </div>

              {/* Trust row */}
              <div className="mt-6 flex items-center justify-center gap-6 text-xs text-foreground/70">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  {t("pages.prescriptionRefill.trustHipaa", "Privacy-first")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  {t("pages.prescriptionRefill.trustDoctor", "Doctor-reviewed")}
                </span>
              </div>

              <p className="mt-6 text-[11px] text-muted-foreground leading-relaxed max-w-sm mx-auto">
                {t("pages.prescriptionRefill.refund")}
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default PrescriptionRefill;
