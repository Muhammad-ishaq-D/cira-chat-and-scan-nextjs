import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { isAuthenticated, getUser } from "@/lib/auth";
import ConsentBanner from "@/components/ConsentBanner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import HamburgerMenu from "@/components/HamburgerMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import SEO from "@/components/SEO";
import ciraLogo from "@/assets/cira-logo.svg";
import { ShieldCheck, Stethoscope, Pill, Video, Clock, CheckCircle2, Lock, FileText, ArrowRight, Activity } from "lucide-react";

type FunnelChoice = "refill" | "consult" | null;

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pageRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [funnelChoice, setFunnelChoice] = useState<FunnelChoice>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [scansToday, setScansToday] = useState(1284);
  const [avgFulfillment, setAvgFulfillment] = useState(47);

  // Live telemetry ticker
  useEffect(() => {
    const id = setInterval(() => {
      setScansToday((n) => n + Math.floor(Math.random() * 3));
      setAvgFulfillment(() => 42 + Math.floor(Math.random() * 14));
    }, 2600);
    return () => clearInterval(id);
  }, []);

  // Scroll fade
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 },
    );
    pageRef.current?.querySelectorAll(".scroll-fade").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const openFunnel = (choice: FunnelChoice) => {
    setFunnelChoice(choice);
    setStepIndex(0);
    setDrawerOpen(true);
  };

  const doctors = [
    { name: "Dr. Camille Roux", role: "General Practitioner", reg: "ORDOMED #FR-44819", city: "Lyon, FR", years: 14, img: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=faces" },
    { name: "Dr. Léonard Vasseur", role: "Internal Medicine", reg: "ORDOMED #FR-39022", city: "Paris, FR", years: 19, img: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=faces" },
    { name: "Dr. Anaïs Mercier", role: "Family Medicine", reg: "ORDOMED #FR-52117", city: "Bordeaux, FR", years: 11, img: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop&crop=faces" },
    { name: "Dr. Hugo Lefèvre", role: "Endocrinology", reg: "ORDOMED #FR-48003", city: "Marseille, FR", years: 16, img: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=faces" },
    { name: "Dr. Sophie Bernard", role: "Cardiology", reg: "ORDOMED #FR-41560", city: "Nice, FR", years: 21, img: "https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop&crop=faces" },
    { name: "Dr. Mathieu Caron", role: "General Practitioner", reg: "ORDOMED #FR-47291", city: "Toulouse, FR", years: 9, img: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=faces" },
  ];

  const dataMatrixPrices = ["€10.00", "€39.00", "€10.00", "€19.00", "€15.00"];
  const dataMatrix = (t("home.matrix.rows", { returnObjects: true }) as Array<{
    service: string; who: string; sla: string; deliverable: string;
  }>).map((row, i) => ({ ...row, price: dataMatrixPrices[i] }));

  const faqs = t("home.faqSection.items", { returnObjects: true }) as Array<{ q: string; a: string }>;
  const ugcItems = t("home.ugc.items", { returnObjects: true }) as Array<{ name: string; city: string; quote: string }>;
  const guideItems = t("home.guides.items", { returnObjects: true }) as Array<{ label: string; title: string; snippet: string }>;
  const ugcImages = [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=1067&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=600&h=1067&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&h=1067&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=1067&fit=crop&crop=faces",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=1067&fit=crop&crop=faces",
  ];

  return (
    <>
      <SEO path="/" />
      <div ref={pageRef} className="min-h-screen bg-background">
        {/* Nav */}
        <nav className="flex items-center justify-between pl-3 pr-6 sm:pl-4 lg:pl-6 py-5 max-w-full lg:max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <HamburgerMenu />
            <div className="flex items-center gap-2 ml-4 sm:ml-6 lg:ml-8">
              <img src={ciraLogo} alt="Cira Health logo" width={28} height={28} />
              <span className="font-heading text-xl font-semibold text-foreground">Cira Health</span>
              <span className="hidden sm:inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full border border-border bg-card/60 text-[10px] font-body uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> {t("home.nav.networkBadge")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher variant="header" className="hidden sm:inline-flex" />
            {isAuthenticated() ? (
              (() => {
                const user = getUser();
                const initials = (user?.name || user?.email || "U").split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
                return (
                  <button onClick={() => navigate("/dashboard")} className="rounded-full hover:scale-105 transition-transform">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-border/60" />
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center border border-border/60">{initials}</span>
                    )}
                  </button>
                );
              })()
            ) : (
              <button onClick={() => navigate("/login")} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-all">
                {t("home.nav.patientLogin")}
              </button>
            )}
          </div>
        </nav>

        {/* HERO */}
        <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10 pb-12">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center mb-10">
            {/* LEFT: core text */}
            <div className="text-center lg:text-left">
              {/* AVATAR STACK */}
              <div className="flex justify-center lg:justify-start mb-6">
                <div className="flex items-center -space-x-3">
                  {[
                    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=200&h=200&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&h=200&fit=crop&crop=faces",
                    "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`VeryPatient doctor ${i + 1}`}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-[3px] border-background shadow-sm"
                      loading="eager"
                    />
                  ))}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur shadow-sm mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold font-body tracking-widest uppercase text-foreground">
                  {t("home.hero.live")}
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl md:text-[64px] font-semibold text-foreground leading-[1.05] tracking-tight mb-4">
                {t("home.hero.title1")}<br />
                <span className="text-primary">{t("home.hero.title2")}</span>
              </h1>
              <h2 className="font-heading text-xl sm:text-2xl md:text-[28px] font-medium text-foreground leading-snug tracking-tight mb-5">
                {t("home.hero.h2")}
              </h2>
              <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                {t("home.hero.body")}
              </p>
            </div>

            {/* RIGHT: phone mockup */}
            <div className="relative flex justify-center lg:justify-end pb-8 lg:pb-0">
              <div className="absolute -bottom-2 left-4 sm:left-12 lg:-left-8 w-40 h-52 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border border-border shadow-xl bg-card rotate-[-6deg] z-0">
                <img
                  src="/patient-phone.jpg"
                  alt="Patient smiling during a seamless consultation on her phone"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="relative z-10 w-[260px] sm:w-[300px] bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
                <div className="relative bg-background rounded-[2rem] overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-20" />
                  <img
                    src="/doctor-portrait.jpg"
                    alt="Licensed VeryPatient doctor in a white coat with a stethoscope"
                    className="w-full aspect-[9/19] object-cover"
                    loading="eager"
                  />
                </div>
              </div>

              <div className="absolute top-6 -left-2 sm:left-0 lg:-left-10 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-lg">
                <span className="text-[11px] font-semibold font-body text-foreground whitespace-nowrap">{t("home.hero.badgeDoctor")}</span>
              </div>

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <span className="text-[11px] font-bold font-body tracking-wide whitespace-nowrap">{t("home.hero.badgeApproved")}</span>
              </div>
            </div>
          </div>

          {/* DUAL CONVERSION CARDS */}
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* €10 Rapid Refill */}
            <article className="group relative bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wider uppercase">
                <Clock className="w-3 h-3" /> {t("home.cards.refill.tag")}
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Pill className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-1.5">{t("home.cards.refill.title")}</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                {t("home.cards.refill.body")}
              </p>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-semibold text-foreground">{t("home.cards.refill.price")}</span>
                    <span className="font-body text-xs text-muted-foreground">{t("home.cards.refill.priceSuffix")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{t("home.cards.refill.refunded")}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-body">
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t("home.cards.refill.checkSigned")}</div>
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t("home.cards.refill.checkPdf")}</div>
                </div>
              </div>
              <button
                onClick={() => navigate("/prescription-refill")}
                className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {t("home.cards.refill.cta")}
              </button>
            </article>

            {/* €39 Video Consult */}
            <article className="group relative bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
                <Video className="w-3 h-3" /> {t("home.cards.consult.tag")}
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-1.5">{t("home.cards.consult.title")}</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                {t("home.cards.consult.body")}
              </p>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-semibold text-foreground">{t("home.cards.consult.price")}</span>
                    <span className="font-body text-xs text-muted-foreground">{t("home.cards.consult.priceSuffix")}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">{t("home.cards.consult.duration")}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-body">
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t("home.cards.consult.checkMatch")}</div>
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t("home.cards.consult.checkPlan")}</div>
                </div>
              </div>
              <button
                onClick={() => openFunnel("consult")}
                className="w-full px-6 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold font-body hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {t("home.cards.consult.cta")}
              </button>
            </article>
          </div>

          {/* Telemetry strip */}
          <div className="mt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">
                <Activity className="w-3 h-3 text-primary" /> {t("home.telemetry.refillsToday")}
              </div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">{scansToday.toLocaleString()}</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">
                <Clock className="w-3 h-3 text-primary" /> {t("home.telemetry.avgFulfillment")}
              </div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">{avgFulfillment} {t("home.telemetry.minSuffix")}</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">{t("home.telemetry.approvalRate")}</div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">96.2%</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">{t("home.telemetry.networkMds")}</div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">312</div>
            </div>
          </div>
        </header>

        {/* 3-STEP PROCESS */}
        <section className="bg-card/40 border-y border-border/60 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">{t("home.process.eyebrow")}</p>
              <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                {t("home.process.title")}
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { n: "01", title: t("home.process.s1Title"), body: t("home.process.s1Body"), icon: FileText },
                { n: "02", title: t("home.process.s2Title"), body: t("home.process.s2Body"), icon: Stethoscope },
                { n: "03", title: t("home.process.s3Title"), body: t("home.process.s3Body"), icon: CheckCircle2 },
              ].map((s) => (
                <div key={s.n} className="scroll-fade bg-card border border-border rounded-2xl p-6 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-primary font-heading text-2xl font-semibold">{s.n}</span>
                    <s.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2 leading-snug">{s.title}</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* DOCTORS GRID */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">{t("home.doctorsGrid.eyebrow")}</p>
            <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-3">
              {t("home.doctorsGrid.title")}
            </h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              {t("home.doctorsGrid.body")}
            </p>
          </div>
          <div className="scroll-fade grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((d) => (
              <div key={d.reg} className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
                <div className="relative mx-auto mb-4">
                  <img
                    src={d.img}
                    alt={`Portrait of ${d.name}`}
                    className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-sm mx-auto"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-background" title="Active on VeryPatient network" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground leading-tight">{d.name}</h3>
                <p className="text-xs text-primary font-body mt-1">{d.role}</p>
                <p className="text-[11px] text-muted-foreground font-body mt-2 tabular-nums">{d.reg}</p>
                <p className="text-[11px] text-muted-foreground font-body">{d.city} · {t("home.doctorsGrid.yrsPractice", { years: d.years })}</p>
              </div>
            ))}
          </div>
        </section>

        {/* DATA MATRIX TABLE */}
        <section className="bg-card/40 border-y border-border/60 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">{t("home.matrix.eyebrow")}</p>
              <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                {t("home.matrix.title")}
              </h2>
            </div>
            <div className="scroll-fade bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-muted/40 text-foreground">
                    <tr className="text-left">
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">{t("home.matrix.colService")}</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">{t("home.matrix.colFulfilledBy")}</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">{t("home.matrix.colSla")}</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">{t("home.matrix.colDeliverable")}</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right">{t("home.matrix.colPrice")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dataMatrix.map((row) => (
                      <tr key={row.service} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground">{row.service}</td>
                        <td className="px-5 py-4 text-muted-foreground">{row.who}</td>
                        <td className="px-5 py-4 text-muted-foreground">{row.sla}</td>
                        <td className="px-5 py-4 text-muted-foreground">{row.deliverable}</td>
                        <td className="px-5 py-4 text-right font-heading text-base font-semibold text-primary tabular-nums">{row.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4 font-body">
              {t("home.matrix.fine")}
            </p>
          </div>
        </section>

        {/* UGC Video Testimonials */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs text-primary font-body mb-4 tracking-widest uppercase text-center">{t("home.ugc.eyebrow")}</p>
          <h2 className="scroll-fade font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-5 text-center max-w-3xl mx-auto">
            {t("home.ugc.title")}
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-body text-muted-foreground mb-10">
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> {t("home.ugc.b1")}</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> {t("home.ugc.b2")}</span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="flex items-center gap-2"><span className="text-emerald-600">✓</span> {t("home.ugc.b3")}</span>
          </div>

          {(() => {
            const testimonials = ugcItems.map((it, i) => ({ ...it, img: ugcImages[i] }));
            const scroll = (dir: number) => {
              const el = document.getElementById("ugc-scroller");
              if (el) el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: "smooth" });
            };
            return (
              <div className="scroll-fade">
                <div
                  id="ugc-scroller"
                  className="flex gap-4 sm:gap-5 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                  {testimonials.map((item, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-[220px] sm:w-[240px] md:w-[260px] aspect-[9/16] relative rounded-2xl overflow-hidden bg-muted cursor-pointer group shadow-sm hover:shadow-lg transition-shadow"
                    >
                      <img
                        src={item.img}
                        alt={`${item.name} from ${item.city}`}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center group-hover:bg-white/35 group-hover:scale-110 transition-all">
                          <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6 sm:w-7 sm:h-7 ml-1">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <p className="font-heading text-base font-semibold leading-tight">"{item.quote}"</p>
                        <p className="text-xs font-body opacity-90 mt-1">{item.name} — {item.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => scroll(-1)}
                    aria-label={t("home.ugc.prev")}
                    className="w-11 h-11 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <span className="text-foreground text-lg">←</span>
                  </button>
                  <button
                    onClick={() => scroll(1)}
                    aria-label={t("home.ugc.next")}
                    className="w-11 h-11 rounded-full border border-border bg-background hover:bg-muted flex items-center justify-center transition-colors"
                  >
                    <span className="text-foreground text-lg">→</span>
                  </button>
                </div>
              </div>
            );
          })()}
        </section>

        {/* Clinical Resource Guides */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="scroll-fade font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-4 text-left">
            {t("home.guides.title")}
          </h2>
          <p className="scroll-fade font-body text-base sm:text-lg text-muted-foreground max-w-2xl mb-10">
            {t("home.guides.subtitle")}
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {guideItems.map((guide, i) => (
              <article key={i} className="group scroll-fade bg-card border border-border/60 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all">
                <p className="text-[11px] font-bold font-body tracking-widest uppercase text-muted-foreground mb-4">
                  {guide.label}
                </p>
                <h3 className="font-heading text-xl font-semibold text-foreground leading-snug mb-3">
                  {guide.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed mb-6">
                  {guide.snippet}
                </p>
                <button className="inline-flex items-center gap-1.5 text-sm font-semibold font-body text-primary hover:opacity-80 transition-opacity">
                  {t("home.guides.cta")} <span aria-hidden="true">➔</span>
                </button>
              </article>
            ))}
          </div>
        </section>

        {/* Clinical Science & Agent Architecture */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h2 className="scroll-fade font-heading text-3xl sm:text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-4 text-left">
            {t("home.science.title")}
          </h2>
          <p className="scroll-fade font-body text-base sm:text-lg text-muted-foreground max-w-3xl mb-12">
            {t("home.science.subtitle")}
          </p>

          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-12">
            <article className="scroll-fade bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground leading-snug mb-4">
                <span className="mr-2" aria-hidden="true">🧠</span>
                {t("home.science.col1Title")}
              </h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("home.science.col1Body")}
              </p>
            </article>

            <article className="scroll-fade bg-card border border-border/60 rounded-2xl p-6 sm:p-8">
              <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground leading-snug mb-4">
                <span className="mr-2" aria-hidden="true">📸</span>
                {t("home.science.col2Title")}
              </h3>
              <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed">
                {t("home.science.col2Body")}
              </p>
            </article>
          </div>

          <div className="scroll-fade flex flex-wrap items-center justify-center gap-4">
            {[t("home.science.badge1"), t("home.science.badge2"), t("home.science.badge3")].map((text, i) => (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-background/80 text-foreground font-body text-sm font-medium"
              >
                <span aria-hidden="true" className="text-primary">✓</span>
                {text}
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs text-primary font-body mb-4 tracking-widest uppercase text-center">{t("home.faqSection.eyebrow")}</p>
          <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-10 text-center">
            {t("home.faqSection.title")}
          </h2>
          <Accordion type="single" collapsible className="scroll-fade w-full">
            {faqs.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-body text-base text-foreground hover:no-underline">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground font-body text-[15px] leading-relaxed">{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* Ethical Manifesto */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="scroll-fade bg-card/40 border border-border/60 rounded-3xl px-8 sm:px-14 py-14 sm:py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-8">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <blockquote className="font-heading text-2xl sm:text-3xl md:text-4xl font-medium text-foreground leading-snug max-w-3xl mx-auto">
              {t("home.manifesto.quote")}
            </blockquote>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-foreground text-background rounded-3xl p-10 sm:p-14 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mb-3">
              {t("home.finalCta.title")}
            </h2>
            <p className="font-body text-sm sm:text-base opacity-80 max-w-xl mx-auto mb-7">
              {t("home.finalCta.body")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate("/prescription-refill")} className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all">
                {t("home.finalCta.ctaRefill")}
              </button>
              <button onClick={() => openFunnel("consult")} className="px-8 py-3.5 rounded-full bg-background/10 border border-background/30 text-background text-sm font-semibold font-body hover:bg-background/20 transition-all">
                {t("home.finalCta.ctaConsult")}
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/60 bg-card/30 font-body">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div className="col-span-2 md:col-span-1">
                <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-4">
                  <img src={ciraLogo} alt="Cira Health logo" width={28} height={28} />
                  <span className="font-heading text-lg font-semibold text-foreground">Cira Health</span>
                </button>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                  {t("home.footerSection.tagline")}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("home.footerSection.h1")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => navigate("/prescription-refill")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.refillLink")}</button></li>
                  <li><button onClick={() => openFunnel("consult")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.consultLink")}</button></li>
                  <li><button onClick={() => navigate("/pricing")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.pricingLink")}</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("home.footerSection.h2")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => navigate("/real-doctors")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.cliniciansLink")}</button></li>
                  <li><button onClick={() => navigate("/how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.howLink")}</button></li>
                  <li><a href="mailto:hello@cirahealth.com" className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.contactLink")}</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">{t("home.footerSection.h3")}</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.securityLink")}</button></li>
                  <li><button onClick={() => navigate("/privacy-policy")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.privacyLink")}</button></li>
                  <li><button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">{t("home.footerSection.termsLink")}</button></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <p>{t("home.footerSection.copyright", { year: new Date().getFullYear() })}</p>
                <LanguageSwitcher />
              </div>
              <p className="text-center md:text-right italic">
                {t("home.footerSection.disclaimer")}
              </p>
            </div>
          </div>
        </footer>

        <ConsentBanner />
      </div>

      {/* SIDE DRAWER FUNNEL */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-background">
          <SheetHeader className="mb-5">
            <SheetTitle className="font-heading text-2xl text-foreground">
              {funnelChoice === "refill" ? t("home.funnel.titleRefill") : t("home.funnel.titleConsult")}
            </SheetTitle>
            <SheetDescription className="font-body text-xs text-muted-foreground">
              {t("home.funnel.sub")}
            </SheetDescription>
          </SheetHeader>

          {/* Funnel state */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[11px] font-body text-muted-foreground">
              {[t("home.funnel.step1"), t("home.funnel.step2"), t("home.funnel.step3")].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <span className={i === stepIndex ? "text-foreground font-medium" : ""}>{label}</span>
                  {i < 2 && <span className="w-4 h-px bg-border" />}
                </div>
              ))}
            </div>

            {stepIndex === 0 && (
              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5">
                  <p className="font-body text-sm text-foreground leading-relaxed">
                    {t("home.funnel.introIntro")} {funnelChoice === "refill" ? t("home.funnel.introRefillQ") : t("home.funnel.introConsultQ")}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblName")}</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("home.funnel.namePlaceholder")} />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">
                    {funnelChoice === "refill" ? t("home.funnel.lblMed") : t("home.funnel.lblReason")}
                  </label>
                  <textarea rows={3} className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={funnelChoice === "refill" ? t("home.funnel.medPlaceholder") : t("home.funnel.reasonPlaceholder")} />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblPharmacy")}</label>
                  <input type="email" className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("home.funnel.emailPlaceholder")} />
                </div>
                <button onClick={() => setStepIndex(1)} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  {t("home.funnel.continueReview")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {stepIndex === 1 && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 text-xs font-body text-emerald-600 dark:text-emerald-400 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> {t("home.funnel.matched")}
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={doctors[0].img} alt={doctors[0].name} className="w-12 h-12 rounded-xl object-cover border border-border/60" />
                    <div>
                      <p className="font-heading text-base font-semibold text-foreground">{doctors[0].name}</p>
                      <p className="text-[11px] text-muted-foreground font-body">{doctors[0].role} · {doctors[0].reg}</p>
                    </div>
                  </div>
                </div>
                <ul className="space-y-2 text-sm font-body text-muted-foreground">
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> {t("home.funnel.elig1")}</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> {t("home.funnel.elig2")}</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> {t("home.funnel.elig3")}</li>
                </ul>
                <button onClick={() => setStepIndex(2)} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  {t("home.funnel.proceedPay")} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {stepIndex === 2 && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-foreground font-body">{t("home.funnel.ledger")}</div>
                  <dl className="divide-y divide-border text-sm font-body">
                    <div className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">{t("home.funnel.fService")}</dt><dd className="text-foreground font-medium text-right">{funnelChoice === "refill" ? t("home.funnel.sRefill") : t("home.funnel.sConsult")}</dd></div>
                    <div className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">{t("home.funnel.fWindow")}</dt><dd className="text-foreground font-medium">{funnelChoice === "refill" ? t("home.funnel.wRefill") : t("home.funnel.wConsult")}</dd></div>
                    <div className="flex justify-between px-4 py-3 bg-primary/5"><dt className="text-foreground font-semibold">{t("home.funnel.fDue")}</dt><dd className="text-primary font-heading text-lg font-semibold">{funnelChoice === "refill" ? t("home.funnel.dueRefill") : t("home.funnel.dueConsult")}</dd></div>
                  </dl>
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblCardName")}</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={t("home.funnel.namePlaceholder")} />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblCardNum")}</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblExpiry")}</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="MM / YY" />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-semibold text-foreground mb-1.5">{t("home.funnel.lblCvc")}</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="123" />
                  </div>
                </div>
                <button className="w-full px-6 py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Lock className="w-4 h-4" /> {t("home.funnel.payBtnPrefix")} {funnelChoice === "refill" ? t("home.cards.refill.price") : t("home.cards.consult.price")}
                </button>
                <p className="text-[11px] text-center text-muted-foreground font-body flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> {t("home.funnel.secureNote")}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Index;
