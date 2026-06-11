import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ciraLogo from "@/assets/cira-logo.svg";
import dashboardPreview from "@/assets/dashboard-preview.png";
import founderPhoto from "@/assets/founder-jeanmarc.jpg";
import realScan from "@/assets/real-scan.webp";
import faceNormal from "@/assets/face-normal.jpg";
import faceHeatmap from "@/assets/face-heatmap.jpg";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { isAuthenticated, getUser } from "@/lib/auth";
import ConsentBanner from "@/components/ConsentBanner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import HamburgerMenu from "@/components/HamburgerMenu";
import SEO from "@/components/SEO";

const HeroChatPreview = () => {
  const { t } = useTranslation();
  const heroChatMessages = [
    { role: "cira", text: t("index.heroChat.m1") },
    { role: "user", text: t("index.heroChat.m2") },
    { role: "cira", text: t("index.heroChat.m3") },
    { role: "user", text: t("index.heroChat.m4") },
    { role: "cira", text: t("index.heroChat.m5") },
    { role: "user", text: t("index.heroChat.m6") },
    { role: "cira", text: t("index.heroChat.m7") },
  ];

  const [visibleMessages, setVisibleMessages] = useState<typeof heroChatMessages>([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgIndex >= heroChatMessages.length) {
      const timer = setTimeout(() => {
        setVisibleMessages([]);
        setMsgIndex(0);
      }, 3000);
      return () => clearTimeout(timer);
    }
    const delay = heroChatMessages[msgIndex].role === "cira" ? 1200 : 800;
    const timer = setTimeout(() => {
      setVisibleMessages((prev) => [...prev, heroChatMessages[msgIndex]]);
      setMsgIndex((i) => i + 1);
    }, msgIndex === 0 ? 600 : delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgIndex]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-md w-[220px]">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/30">
        <img src={ciraLogo} alt="Cira health logo" className="w-5 h-5 rounded-full" />
        <span className="text-[10px] font-semibold text-foreground font-heading">Cira</span>
        <span className="ml-auto text-[8px] text-emerald-500 font-medium flex items-center gap-0.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> {t("index.heroChat.online")}
        </span>
      </div>
      <div ref={scrollRef} className="space-y-1.5 h-[90px] overflow-hidden">
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === "user" ? "flex justify-end" : ""}`}>
            <div className={`px-2.5 py-1.5 text-[11px] font-body leading-relaxed max-w-[90%] rounded-lg ${msg.role === "cira" ? "bg-primary/5 rounded-tl-none text-foreground" : "bg-primary/10 rounded-tr-none text-foreground"}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {msgIndex < heroChatMessages.length && visibleMessages.length > 0 && (
          <div className="flex items-center gap-1 px-1">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1 h-1 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>
    </div>
  );
};

const Index = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [heroMessage] = useState("");

  const specialties = [
    t("index.specialties.gp"),
    t("index.specialties.pediatrics"),
    t("index.specialties.psychology"),
    t("index.specialties.sexology"),
    t("index.specialties.weightLoss"),
    t("index.specialties.cardiology"),
  ];

  const markersCol1 = [
    t("index.markers.bp"),
    t("index.markers.hr"),
    t("index.markers.hrv"),
    t("index.markers.cardiacWorkload"),
    t("index.markers.breathingRate"),
    t("index.markers.stressIndex"),
    t("index.markers.bmi"),
    t("index.markers.parasympathetic"),
  ];

  const markersCol2 = [
    t("index.markers.vascularAge"),
    t("index.markers.wellnessScore"),
    t("index.markers.waistHeight"),
    t("index.markers.bodyFat"),
    t("index.markers.bmr"),
    t("index.markers.bodyShape"),
    t("index.markers.tdee"),
  ];

  const markersCol3 = [
    t("index.markers.cvdRisk"),
    t("index.markers.chdRisk"),
    t("index.markers.strokeRisk"),
    t("index.markers.heartFailure"),
    t("index.markers.diabetes"),
    t("index.markers.fattyLiver"),
    t("index.markers.cvEvent"),
  ];

  const accuracyData = [
    { metric: t("index.accuracy.hr"), time: t("index.accuracy.sec30"), accuracy: "0.13 MAE" },
    { metric: t("index.accuracy.hrv"), time: t("index.accuracy.sec30"), accuracy: "3.28 MAE" },
    { metric: t("index.accuracy.br"), time: t("index.accuracy.sec30"), accuracy: "1.12 MAE" },
    { metric: t("index.accuracy.sbp"), time: t("index.accuracy.sec30"), accuracy: "9.23 MAE" },
    { metric: t("index.accuracy.dbp"), time: t("index.accuracy.sec30"), accuracy: "6.09 MAE" },
    { metric: t("index.accuracy.bmi"), time: t("index.accuracy.sec30"), accuracy: "2.84 MAE" },
  ];

  const faqs = [
    { q: t("index.faq.q1"), a: t("index.faq.a1") },
    { q: t("index.faq.q2"), a: t("index.faq.a2") },
    { q: t("index.faq.q3"), a: t("index.faq.a3") },
    { q: t("index.faq.q4"), a: t("index.faq.a4") },
    { q: t("index.faq.q5"), a: t("index.faq.a5") },
    { q: t("index.faq.q6"), a: t("index.faq.a6") },
  ];

  const handleAskCira = () => {
    if (heroMessage.trim()) {
      sessionStorage.setItem("cira_landing_message", heroMessage.trim());
    }
    navigate(isAuthenticated() ? "/chat" : "/free-chat");
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    const els = pageRef.current?.querySelectorAll(".scroll-fade");
    els?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SEO
        title="Cira — your AI health nurse, anytime"
        description="Talk to Cira, your AI nurse. Ask health questions, scan vitals with your camera, and get clear next steps."
        path="/"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "MedicalOrganization",
            name: "Cira",
            url: "https://cira-chat-and-scan.lovable.app/",
            logo: "https://cira-chat-and-scan.lovable.app/favicon.svg",
            description: "AI health nurse offering symptom guidance and camera-based vital sign scans.",
            sameAs: ["https://askainurse.com"],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Cira",
            url: "https://cira-chat-and-scan.lovable.app/",
            applicationCategory: "HealthApplication",
            operatingSystem: "Web",
            description: "Chat with an AI nurse and scan your vitals from any device with a camera.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
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
        ]}
      />
    <div ref={pageRef} className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between pl-3 pr-6 sm:pl-4 lg:pl-6 py-5 max-w-full lg:max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <HamburgerMenu />
          <div className="flex items-center gap-2 ml-4 sm:ml-6 lg:ml-8">
            <img src={ciraLogo} alt="Cira health logo" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
            <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">{t("index.beta")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitcher variant="header" className="hidden sm:inline-flex" />
          {isAuthenticated() ? (
            (() => {
              const user = getUser();
              const initials = (user?.name || user?.email || "U")
                .split(" ")
                .map((n) => n[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <button
                  onClick={() => navigate("/dashboard")}
                  aria-label={t("index.goDashboardAria")}
                  className="rounded-full hover:scale-105 transition-transform duration-200"
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name || "Profile"}
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full object-cover border border-border/60"
                    />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center border border-border/60">
                      {initials}
                    </span>
                  )}
                </button>
              );
            })()
          ) : (
            <button onClick={() => navigate("/login")} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium font-body hover:opacity-90 hover:scale-105 transition-all duration-200">
              {t("index.loginBtn")}
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center items-center" style={{ minHeight: "calc(100vh - 68px)" }}>
        <div className="text-center mb-2 sm:mb-3 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-2 mb-3.5 sm:mb-4 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur shadow-sm">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-body tracking-widest uppercase bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t("index.tagFaceScan")}
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="relative group inline-flex items-center gap-1 text-[11px] font-semibold font-body tracking-wider text-emerald-600 dark:text-emerald-400 cursor-default">
              {t("index.hipaaShort")}
              <span className="hidden sm:block pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 w-56 rounded-lg border border-border bg-popover px-3 py-2 text-[11px] font-normal font-body leading-snug text-popover-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-left">
                <strong className="block mb-0.5 text-foreground">{t("index.hipaaTooltipTitle")}</strong>
                {t("index.hipaaTooltipBody")}
                <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-border" />
              </span>
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-[56px] font-semibold text-foreground leading-[1.1] tracking-tight">
            {t("index.heroTitle1")}<br /><span className="text-primary">{t("index.heroTitle2")}</span>
          </h1>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed mb-4 sm:mb-6 font-body max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.15s" }}>
          {t("index.heroSubtitle")}
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-4 sm:mb-6 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-2 animate-fade-in order-1" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={faceNormal} alt="Face scan" width={128} height={128} fetchPriority="high" decoding="async" className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg" />
                <span className="absolute -bottom-1.5 -right-1.5 bg-card border border-border text-[9px] sm:text-[10px] font-body text-muted-foreground px-1.5 py-0.5 rounded-full shadow">{t("index.youLabel")}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                <span className="text-[9px] text-muted-foreground font-body">30s</span>
              </div>
              <div className="relative">
                <img src={faceHeatmap} alt="Vitals heatmap" width={128} height={128} fetchPriority="high" decoding="async" className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg ring-2 ring-primary/30" />
                <span className="absolute -bottom-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-body px-1.5 py-0.5 rounded-full shadow font-medium">{t("index.vitalsCountLabel")}</span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground font-body font-semibold tracking-wide">{t("index.scanCaption1")} <span className="text-muted-foreground font-normal">{t("index.scanCaption2")}</span></p>
          </div>

          <div className="animate-fade-in order-2" style={{ animationDelay: "0.5s" }}>
            <HeroChatPreview />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={() => navigate("/vitals-scan")}
              className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-medium font-body hover:opacity-90 active:scale-95 sm:hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
            >
              {t("index.ctaStartScan")}
            </button>
            <button
              onClick={handleAskCira}
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-border bg-card/60 backdrop-blur text-foreground text-sm sm:text-base font-medium font-body hover:bg-card active:scale-95 transition-all duration-200"
            >
              {t("index.ctaChat")}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] sm:text-[11px] text-muted-foreground font-body">
            <span>{t("index.ctaChip1")}</span>
            <span>{t("index.ctaChip2")}</span>
            <span>{t("index.ctaChip3")}</span>
            <span>{t("index.ctaChip4")}</span>
            <span>{t("index.ctaChip5")}</span>
          </div>
        </div>
      </main>

      {/* MULTI-LANGUAGE */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          {t("index.languages.title")}
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          {t("index.languages.subtitle1")}<br />
          {t("index.languages.subtitle2")}
        </p>

        <div className="scroll-fade flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto mb-8">
          {[
            { label: "English", native: "Hello" },
            { label: "Español", native: "Hola" },
            { label: "Français", native: "Bonjour" },
            { label: "Deutsch", native: "Hallo" },
            { label: "Italiano", native: "Ciao" },
            { label: "Português", native: "Olá" },
            { label: "中文", native: "你好" },
            { label: "日本語", native: "こんにちは" },
            { label: "한국어", native: "안녕하세요" },
            { label: "ภาษาไทย", native: "สวัสดี" },
            { label: "Tiếng Việt", native: "Xin chào" },
            { label: "Bahasa", native: "Halo" },
            { label: "हिन्दी", native: "नमस्ते" },
            { label: "العربية", native: "مرحبا" },
            { label: "Türkçe", native: "Merhaba" },
            { label: "Русский", native: "Привет" },
          ].map((lang) => (
            <div
              key={lang.label}
              className="px-3 py-2 rounded-full border border-border bg-card text-xs sm:text-sm font-body text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <span className="font-medium">{lang.native}</span>
              <span className="text-muted-foreground ml-2">{lang.label}</span>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground italic font-body">
          {t("index.languages.quote")}
        </p>
      </section>

      {/* INTELLIGENCE */}
      <section className="bg-card py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[40px] font-semibold text-foreground leading-tight mb-6">
            {t("index.intelligence.title1")}<br />
            {t("index.intelligence.title2")}
          </h2>

          <div className="max-w-2xl mx-auto mb-10 sm:mb-14 font-body text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4">
            <p>{t("index.intelligence.p1")}</p>
            <p>{t("index.intelligence.p2")}</p>
            <p>{t("index.intelligence.p3")}</p>
            <p>{t("index.intelligence.p4Part1")} <strong className="text-foreground">{t("index.intelligence.p4Bold")}</strong></p>
          </div>

          <div className="max-w-2xl mx-auto space-y-8 text-left mb-14">
            <div className="flex gap-4"><span className="text-2xl">📚</span><p className="text-sm text-foreground font-body leading-relaxed">{t("index.intelligence.c1")}</p></div>
            <div className="flex gap-4"><span className="text-2xl">🧠</span><p className="text-sm text-foreground font-body leading-relaxed">{t("index.intelligence.c2")}</p></div>
            <div className="flex gap-4"><span className="text-2xl">🔄</span><p className="text-sm text-foreground font-body leading-relaxed">{t("index.intelligence.c3")}</p></div>
            <div className="flex gap-4"><span className="text-2xl">📋</span><p className="text-sm text-foreground font-body leading-relaxed">{t("index.intelligence.c4")}</p></div>
          </div>

          <div className="scroll-fade border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-2xl mx-auto text-left mb-6">
            <p className="text-sm text-foreground font-body leading-relaxed italic whitespace-pre-line">
              {t("index.intelligence.exampleQuote")}
            </p>
            <p className="text-xs text-primary font-body mt-3 font-medium">{t("index.intelligence.exampleAuthor")}</p>
          </div>

          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {t("index.intelligence.disclaimer1")}<br />
            {t("index.intelligence.disclaimer2")}
          </p>
        </div>
      </section>

      {/* SHEN AI */}
      <section className="bg-background py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[40px] font-semibold text-foreground leading-tight mb-6">
            {t("index.shen.title1")}<br />
            {t("index.shen.title2")}
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 sm:mb-14 font-body">
            {t("index.shen.lead")}
          </p>

          <div className="scroll-fade grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-14">
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">7M+</p>
              <div className="border-t border-border mt-2 pt-2"><p className="text-xs text-muted-foreground font-body">{t("index.shen.stat1")}</p></div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">20%</p>
              <div className="border-t border-border mt-2 pt-2"><p className="text-xs text-muted-foreground font-body">{t("index.shen.stat2")}</p></div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">80+</p>
              <div className="border-t border-border mt-2 pt-2"><p className="text-xs text-muted-foreground font-body">{t("index.shen.stat3")}</p></div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">33</p>
              <div className="border-t border-border mt-2 pt-2"><p className="text-xs text-muted-foreground font-body">{t("index.shen.stat4")}</p></div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto space-y-8 text-left mb-14">
            <div className="flex gap-4"><span className="text-2xl">🔬</span><div><p className="text-sm font-medium text-foreground font-body mb-1">{t("index.shen.f1Title")}</p><p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.shen.f1Body")}</p></div></div>
            <div className="flex gap-4"><span className="text-2xl">🧠</span><div><p className="text-sm font-medium text-foreground font-body mb-1">{t("index.shen.f2Title")}</p><p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.shen.f2Body")}</p></div></div>
            <div className="flex gap-4"><span className="text-2xl">📊</span><div><p className="text-sm font-medium text-foreground font-body mb-1">{t("index.shen.f3Title")}</p><p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.shen.f3Body")}</p></div></div>
            <div className="flex gap-4"><span className="text-2xl">🔒</span><div><p className="text-sm font-medium text-foreground font-body mb-1">{t("index.shen.f4Title")}</p><p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.shen.f4Body")}</p></div></div>
          </div>

          <div className="text-center mb-8">
            <h3 className="font-heading text-[22px] sm:text-[28px] font-semibold text-foreground leading-tight">
              {t("index.shen.accuracyTitle")}
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-2">
              {t("index.shen.accuracySub")}
            </p>
          </div>

          <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm overflow-x-auto max-w-2xl mx-auto mb-4">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">{t("index.shen.tableMetric")}</th>
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">{t("index.shen.tableTime")}</th>
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">{t("index.shen.tableAccuracy")}</th>
                </tr>
              </thead>
              <tbody>
                {accuracyData.map((row) => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-foreground text-xs sm:text-sm">{row.metric}</td>
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-muted-foreground text-xs sm:text-sm">{row.time}</td>
                    <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-muted-foreground text-xs sm:text-sm">{row.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center font-body mb-14">
            {t("index.shen.source")}
          </p>

          <p className="text-sm text-muted-foreground text-center font-body mb-6">
            {t("index.shen.trustedBy")}
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-14">
            {["Allianz", "Deutsche Telekom", "Dr.Digital", "Heartery", "CAREMINDr"].map((logo) => (
              <span key={logo} className="text-sm text-muted-foreground font-body opacity-60">{logo}</span>
            ))}
          </div>

          <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm p-8 max-w-2xl mx-auto text-center mb-6">
            <p className="text-base text-foreground font-body leading-relaxed mb-4 italic">
              {t("index.shen.quote")}
            </p>
            <p className="text-sm text-muted-foreground font-body">
              {t("index.shen.quoteAuthor")}
            </p>
          </div>

          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            {t("index.shen.footnote")}
          </p>
        </div>
      </section>

      {/* SCAN */}
      <section id="scan" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16">
        <div className="text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6">
            {t("index.scan.title")}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-body whitespace-pre-line">
            {t("index.scan.body")}
          </p>
          <button
            onClick={() => navigate("/vitals-scan")}
            onMouseEnter={() => { try { fetch("/wasm/shenai_sdk.wasm", { priority: "high" as any, credentials: "omit" }); } catch { } }}
            onTouchStart={() => { try { fetch("/wasm/shenai_sdk.wasm", { priority: "high" as any, credentials: "omit" }); } catch { } }}
            className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3"
          >
            {t("index.scan.startBtn")}
          </button>
          <p className="text-xs text-muted-foreground mt-3 font-body">
            {t("index.scan.privacy")}
          </p>
        </div>

        <div className="border-t border-border my-14" />

        <div className="max-w-lg mx-auto mb-4">
          <img
            src={realScan}
            alt="Real scan"
            loading="lazy"
            className="w-full rounded-xl shadow-md"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center font-body mb-3">
          {t("index.scan.realCaption1")}
        </p>
        <p className="text-xs text-muted-foreground text-center font-body max-w-lg mx-auto leading-relaxed">
          {t("index.scan.realCaption2")}
        </p>

        <div className="border-t border-border my-14" />

        <div className="text-center mb-10">
          <h3 className="scroll-fade font-heading text-[24px] sm:text-[32px] font-semibold text-foreground leading-tight">
            {t("index.scan.markersTitle")}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">{t("index.scan.vitalSignsLabel")}</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">{t("index.scan.vitalSignsSub")}</p>
            <ul className="space-y-2">{markersCol1.map((m) => (<li key={m} className="text-sm text-foreground font-body">{m}</li>))}</ul>
          </div>
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">{t("index.scan.indicesLabel")}</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">{t("index.scan.indicesSub")}</p>
            <ul className="space-y-2">{markersCol2.map((m) => (<li key={m} className="text-sm text-foreground font-body">{m}</li>))}</ul>
          </div>
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">{t("index.scan.risksLabel")}</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">{t("index.scan.risksSub")}</p>
            <ul className="space-y-2">{markersCol3.map((m) => (<li key={m} className="text-sm text-foreground font-body">{m}</li>))}</ul>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center font-body">
          {t("index.scan.validated")}
        </p>
      </section>

      {/* DASHBOARD */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          {t("index.dashboardSection.title")}
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body whitespace-pre-line">
          {t("index.dashboardSection.body")}
        </p>

        <div className="scroll-fade bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-3xl mx-auto text-left relative">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-body">
                askainurse.com/dashboard
              </div>
            </div>
          </div>
          <img src={dashboardPreview} alt="Cira Dashboard" className="w-full h-auto" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>

        <p className="text-sm text-muted-foreground mt-6 italic font-body">
          {t("index.dashboardSection.caption")}
        </p>
      </section>

      {/* REPORT */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          {t("index.report.title")}
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          {t("index.report.body")}
        </p>

        <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-8 max-w-2xl mx-auto text-left font-body text-sm">
          <div className="border-t-2 border-b-2 border-foreground py-2 mb-4 text-center">
            <p className="text-foreground font-semibold tracking-widest text-xs uppercase">{t("index.report.header")}</p>
          </div>

          <div className="space-y-1 text-muted-foreground mb-4">
            <p>{t("index.report.period")}</p>
            <p>{t("index.report.scansCompleted")}</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between"><span className="text-foreground">{t("index.report.bp")}</span><span className="text-muted-foreground">121/79 <span className="text-primary">{t("index.report.rising")}</span></span></div>
            <div className="flex justify-between"><span className="text-foreground">{t("index.report.hr")}</span><span className="text-muted-foreground">68 bpm <span>{t("index.report.stable")}</span></span></div>
            <div className="flex justify-between"><span className="text-foreground">{t("index.report.hrv")}</span><span className="text-muted-foreground">38ms <span className="text-destructive">{t("index.report.declining")}</span></span></div>
            <div className="flex justify-between"><span className="text-foreground">{t("index.report.stress")}</span><span className="text-muted-foreground">{t("index.report.elevated")} <span className="text-primary">{t("index.report.sustained")}</span></span></div>
          </div>

          <div className="mb-4">
            <p className="text-foreground font-medium mb-2">{t("index.report.noticed")}</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("index.report.noticed1")}</li>
              <li>{t("index.report.noticed2")}</li>
              <li>{t("index.report.noticed3")}</li>
            </ul>
          </div>

          <div className="mb-4">
            <p className="text-foreground font-medium mb-2">{t("index.report.questions")}</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("index.report.q1")}</li>
              <li>{t("index.report.q2")}</li>
            </ul>
          </div>

          <div className="border-t-2 border-b-2 border-foreground py-2 text-center">
            <p className="text-muted-foreground text-xs">{t("index.report.powered")}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6 italic font-body">
          {t("index.report.caption")}
        </p>
      </section>

      {/* DOCTOR */}
      <section id="doctor" className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6">
          {t("index.doctor.title")}
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-body">
          {t("index.doctor.body")}
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {specialties.map((s) => (
            <span key={s} className="px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground font-body">
              {s}
            </span>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-8 font-body">
          {t("index.doctor.guarantee")}
        </p>

        <button className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3">
          {t("index.doctor.btn")}
        </button>

        <p className="text-xs text-muted-foreground mt-3 font-body">
          {t("index.doctor.footnote")}
        </p>
      </section>

      {/* FOUNDER */}
      <section className="bg-background py-12 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <img
            src={founderPhoto}
            alt="Jean-Marc, Founder"
            className="w-[60px] h-[60px] rounded-full object-cover mx-auto mb-3"
            loading="lazy"
            width={60}
            height={60}
          />
          <p className="text-sm text-muted-foreground font-body mb-4">{t("index.founder.name")}</p>

          <p className="text-base text-foreground font-body leading-relaxed italic max-w-2xl mx-auto mb-4 whitespace-pre-line">
            {t("index.founder.quote")}
          </p>

          <p className="text-sm text-muted-foreground font-body mb-6">{t("index.founder.byline")}</p>

          <button
            onClick={() => navigate("/our-story")}
            className="text-primary text-sm font-body hover:underline transition-colors"
          >
            {t("index.founder.readStory")}
          </button>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-xs text-primary font-body mb-4 tracking-wide uppercase text-center">{t("index.about.label")}</p>
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6 text-center">
          {t("index.about.title")}
        </h2>
        <p className="scroll-fade text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12 font-body text-center">
          {t("index.about.lead")}
        </p>

        <div className="scroll-fade grid sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">01</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t("index.about.step1Title")}</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.about.step1Body")}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">02</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t("index.about.step2Title")}</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.about.step2Body")}</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">03</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{t("index.about.step3Title")}</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">{t("index.about.step3Body")}</p>
          </div>
        </div>

        <div className="scroll-fade bg-muted/30 rounded-2xl p-6 sm:p-10 mb-10">
          <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-6 text-center">
            {t("index.about.howTitle")}
          </h3>
          <div className="space-y-4 max-w-2xl mx-auto text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
            <p><span className="text-foreground font-medium">{t("index.about.how1Label")}</span> {t("index.about.how1Body")}</p>
            <p><span className="text-foreground font-medium">{t("index.about.how2Label")}</span> {t("index.about.how2Body")}</p>
            <p><span className="text-foreground font-medium">{t("index.about.how3Label")}</span> {t("index.about.how3Body")}</p>
            <p><span className="text-foreground font-medium">{t("index.about.how4Label")}</span> {t("index.about.how4Body")}</p>
          </div>
        </div>

        <p className="scroll-fade text-xs text-muted-foreground text-center max-w-2xl mx-auto mb-6 font-body">
          {t("index.about.disclaimer")}
        </p>

        <div className="text-center">
          <button onClick={() => navigate("/our-story")} className="text-primary text-sm font-body hover:underline transition-colors">
            {t("index.about.readStory")}
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-xs text-primary font-body mb-4 tracking-wide uppercase text-center">{t("index.faq.label")}</p>
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-10 text-center">
          {t("index.faq.title")}
        </h2>

        <Accordion type="single" collapsible className="scroll-fade w-full">
          {faqs.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left font-body text-base text-foreground hover:no-underline">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground font-body text-[15px] leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/30 mt-10 font-body">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div className="col-span-2 md:col-span-1">
              <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-4">
                <img src={ciraLogo} alt="Cira health logo" width={28} height={28} />
                <span className="font-heading text-lg font-semibold text-foreground">Cira</span>
              </button>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                {t("footer.tagline")}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.product")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.howItWorks")}</button></li>
                <li><button onClick={() => navigate("/technology")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.technology")}</button></li>
                <li><button onClick={() => navigate("/what-cira-helps-with")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.whatCiraHelpsWith")}</button></li>
                <li><button onClick={() => navigate("/symptom-checker")} className="text-muted-foreground hover:text-primary transition-colors">Symptom checker</button></li>
                <li><button onClick={() => navigate("/pricing")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.pricing")}</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.company")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/real-doctors")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.realDoctors")}</button></li>
                <li><button onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-primary transition-colors">{t("nav.blog")}</button></li>
                <li><a href="mailto:hello@askainurse.com" className="text-muted-foreground hover:text-primary transition-colors">{t("nav.contact")}</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("footer.legal")}</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-primary transition-colors">{t("footer.security")}</button></li>
                <li><button onClick={() => navigate("/privacy-policy")} className="text-muted-foreground hover:text-primary transition-colors">{t("footer.privacyPolicy")}</button></li>
                <li><button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">{t("footer.terms")}</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <p>{t("footer.copyright")}</p>
              <LanguageSwitcher />
            </div>
            <p className="text-center md:text-right">
              {t("footer.disclaimerLine")}{" "}
              <span className="italic">{t("footer.disclaimer")}</span>
            </p>
          </div>
        </div>
      </footer>
      <ConsentBanner />
    </div>
    </>
  );
};

export default Index;
