import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, Stethoscope, ArrowRight,
  CheckCircle2, Copy, Check, Loader2, XCircle, Users, AlertCircle,
} from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import ReferralLetterChat from "@/components/ReferralLetterChat";
import { isAuthenticated } from "@/lib/auth";
import { referralApi } from "@/lib/referralApi";

const ReferralLetter = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loggedIn = isAuthenticated();

  const [showChat, setShowChat] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Success polling state
  const [referralId, setReferralId] = useState<string | null>(null);
  const [pollingStatus, setPollingStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [emailStatus, setEmailStatus] = useState<"pending" | "sent" | "failed">("pending");
  const [refNumber, setRefNumber] = useState("");
  const [isPolling, setIsPolling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Detect Stripe redirect on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");

    if (status === "success") {
      const savedId = localStorage.getItem("cira_pending_referral_id");
      // Clean the URL immediately
      window.history.replaceState({}, "", window.location.pathname);
      if (savedId) {
        setReferralId(savedId);
        setShowSuccess(true);
        setPollingStatus("pending");
        setIsPolling(true);
      }
    } else if (status === "cancel") {
      // Reopen chat at checkout phase — handled inside ReferralLetterChat
      setShowChat(true);
    }
  }, []);

  // Poll for payment + email status
  useEffect(() => {
    if (!isPolling || !referralId) return;
    let intervalId: ReturnType<typeof setInterval>;

    const poll = async () => {
      try {
        const res = await referralApi.getStatus(referralId);
        if (res.payment_status === "paid") {
          setPollingStatus("paid");
          setRefNumber(res.reference_code || "");
          setEmailStatus(res.email_status);
          setIsPolling(false);
          localStorage.removeItem("cira_pending_referral_id");
          localStorage.removeItem("cira_cached_referral");
          localStorage.removeItem("cira_pending_referral_email");
        } else if (res.payment_status === "failed") {
          setPollingStatus("failed");
          setIsPolling(false);
        }
      } catch {
        // network blip — keep polling
      }
    };

    poll();
    intervalId = setInterval(poll, 2500);
    return () => clearInterval(intervalId);
  }, [isPolling, referralId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  const handleDone = () => {
    setShowSuccess(false);
    setPollingStatus("pending");
    setEmailStatus("pending");
    setRefNumber("");
    setReferralId(null);
    navigate("/referral-letter");
  };

  // ── Success page ─────────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <>
        <SEO
          title="Referral Letter — Cira AI Nurse"
          description="Your referral letter is being prepared."
          path="/referral-letter"
        />
        <div className="min-h-screen bg-[#f7f6f0] flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md space-y-4">

            {/* Pending */}
            {pollingStatus === "pending" && (
              <div className="bg-white border border-border rounded-2xl p-6 text-center space-y-3 shadow-sm">
                <div className="flex justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <h3 className="font-semibold text-foreground" style={{ fontSize: 17 }}>
                  Confirming your payment…
                </h3>
                <p className="text-foreground/80 text-sm leading-relaxed">
                  Hang tight — we are generating your referral letter and emailing it to you as a PDF attachment. This usually takes a few seconds.
                </p>
              </div>
            )}

            {/* Failed */}
            {pollingStatus === "failed" && (
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mb-3">
                    <XCircle className="w-8 h-8 text-amber-500" strokeWidth={2.5} />
                  </div>
                  <h3 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
                    Payment confirmation failed
                  </h3>
                  <p className="mt-2 text-foreground/80 text-sm">
                    We couldn't confirm your payment. If you completed the Stripe payment, please contact support.
                  </p>
                </div>
                <button
                  onClick={handleDone}
                  className="w-full rounded-xl py-3 bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                >
                  Back to start
                </button>
              </div>
            )}

            {/* Paid / Success */}
            {pollingStatus === "paid" && (
              <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
                {/* Green header */}
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-5 py-5 space-y-3">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500" strokeWidth={2.5} />
                    </div>
                    <h3 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
                      Referral Letter Ready!
                    </h3>
                    <p className="mt-1 text-emerald-600 text-sm font-medium">
                      We have emailed your referral letter to your inbox.
                    </p>
                  </div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Reference number */}
                  <div className="rounded-2xl border border-border bg-background/60 p-4 text-center space-y-2">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                      Reference Number
                    </p>
                    <p className="font-mono font-semibold text-foreground tracking-wider" style={{ fontSize: 22 }}>
                      {refNumber || "REF-LETTER"}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-foreground hover:bg-accent transition-colors"
                      style={{ minHeight: 40, fontSize: 14 }}
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email status */}
                  <p className="text-xs text-muted-foreground text-center">
                    {emailStatus === "sent"
                      ? "Email sent — check your inbox."
                      : emailStatus === "failed"
                      ? "We couldn't send the email — support will reach out."
                      : "Sending your referral letter by email…"}
                  </p>

                  <p className="text-xs text-muted-foreground leading-relaxed text-center px-1">
                    If you do not see the email in 1–2 minutes, please check your spam folder.
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={() => navigate("/doctor")}
                      className="w-full py-3 rounded-xl bg-white border border-border text-primary text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-accent transition-colors active:scale-95"
                    >
                      <Users size={15} />
                      {t("referral.btn.findDoctor")}
                    </button>
                    <button
                      onClick={handleDone}
                      className="w-full py-2.5 text-muted-foreground text-[13px] hover:text-foreground transition-colors font-medium"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI disclosure */}
            <div className="flex items-start gap-2 px-1">
              <AlertCircle size={12} className="text-muted-foreground/60 shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground/60 leading-snug">
                {t("referral.aiDisclosure")}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Chat overlay ─────────────────────────────────────────────────────────────
  if (showChat) {
    return (
      <div className="h-[100dvh] bg-[#f7f6f0] overflow-hidden animate-fade-in">
        <ReferralLetterChat onExit={() => setShowChat(false)} />
      </div>
    );
  }

  // ── Landing page ─────────────────────────────────────────────────────────────
  return (
    <>
      <SEO
        title="Referral Letter — Cira AI Nurse"
        description="Request a referral letter with Cira. Securely share your history and symptoms with a specialist doctor through our network."
        path="/referral-letter"
      />

      <div className="relative min-h-screen overflow-hidden bg-[#f7f6f0] animate-fade-in">
        {/* Glassy gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-primary/25 via-primary/10 to-transparent blur-3xl" />
          <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-sky-200/60 via-primary/10 to-transparent blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-200/40 via-cyan-100/30 to-transparent blur-3xl" />
        </div>

        {/* Top bar */}
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
            {t("pages.referralLetter.startTitle")}
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
                  "pages.referralLetter.startSubtitle",
                  "Get a professional GP-to-specialist referral letter. Delivered to your inbox in minutes."
                )}
              </p>

              <button
                onClick={() => setShowChat(true)}
                className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
                style={{ minHeight: 52, fontSize: 16 }}
              >
                {t("pages.referralLetter.startCta")}
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="mt-3 text-[11px] text-muted-foreground font-medium tracking-wide">
                {t("pages.referralLetter.price")}
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
              {t("pages.referralLetter.refund")}
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default ReferralLetter;
