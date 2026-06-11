import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  ScanFace,
  Compass,
  Stethoscope,
  Heart,
  Activity,
  Wind,
  Gauge,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Eye,
  TrendingUp,
  HelpCircle,
  Lock,
  Check,
  Minus,
} from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import talkImg from "@/assets/how-talk.jpg";
import scanImg from "@/assets/how-scan.jpg";
import nextImg from "@/assets/how-next.jpg";
import chronicImg from "@/assets/how-chronic.jpg";
import SEO from "@/components/SEO";

const steps = [
  {
    n: "1",
    icon: MessageCircle,
    title: "Talk",
    body: "Share what's going on, in your own words.",
  },
  {
    n: "2",
    icon: ScanFace,
    title: "Scan",
    body: "A short face scan reads your real-time vitals.",
  },
  {
    n: "3",
    icon: Compass,
    title: "Next step",
    body: "Clear guidance — and a doctor when needed.",
  },
];

const vitals = [
  { icon: Heart, unit: "bpm", label: "Heart rate" },
  { icon: Wind, unit: "rpm", label: "Breathing rate" },
  { icon: Activity, unit: "HRV", label: "Stress patterns" },
  { icon: Gauge, unit: "mmHg", label: "BP trends" },
];

const guidance = [
  {
    icon: Eye,
    title: "Watch at home",
    body: "Patterns look reassuring. Cira suggests what to monitor and when to check in again.",
    tone: "from-emerald-50 to-emerald-100/40 border-emerald-200/60",
  },
  {
    icon: Stethoscope,
    title: "Book a doctor visit",
    body: "Something worth a closer look. Cira helps you find a doctor and prepares your summary.",
    tone: "from-amber-50 to-amber-100/40 border-amber-200/60",
  },
  {
    icon: AlertTriangle,
    title: "Seek urgent care",
    body: "Signals suggest you shouldn't wait. Cira gives clear, calm steps to get help right now.",
    tone: "from-rose-50 to-rose-100/40 border-rose-200/60",
  },
];

const chronic = [
  {
    icon: TrendingUp,
    title: "Track patterns over time",
    body: "Repeated scans build a baseline that's truly yours.",
  },
  {
    icon: Activity,
    title: "Catch changes early",
    body: "Cira flags shifts in your vitals before they become flare-ups.",
  },
  {
    icon: HelpCircle,
    title: "Answer 'is this serious?'",
    body: "Get clear guidance the moment something feels off.",
  },
];

const privacyFlow = [
  {
    eyebrow: "During chat",
    title: "Symptoms, history, medications you choose to share.",
    body: "Encrypted in transit and at rest. Used only to inform your guidance.",
  },
  {
    eyebrow: "During scan",
    title: "Camera frames processed in real time by Shen AI.",
    body: "Vitals are calculated; raw face video is not stored. Frames deleted after processing.",
  },
  {
    eyebrow: "During guidance",
    title: "Your conversation + scan vitals.",
    body: "Combined to generate your recommendation. Not used to train models without consent.",
  },
  {
    eyebrow: "Doctor hand-off",
    title: "Your Cira report (only what's relevant).",
    body: "Shared with a doctor you choose, via Air Doctor. You decide what's included.",
  },
];

const compareRows = [
  { label: "Conversational understanding", chatbot: true, ai: true, cira: true },
  { label: "Real vitals from a face scan", chatbot: false, ai: false, cira: true },
  { label: "Guidance on 'what should I do now?'", chatbot: "partial", ai: "partial", cira: true },
  { label: "Designed for repeated chronic-condition use", chatbot: false, ai: false, cira: true },
  { label: "Privacy-first scan handling", chatbot: "n/a", ai: "varies", cira: true },
  { label: "Global doctor network (180 countries)", chatbot: false, ai: false, cira: true },
];

const Cell = ({ v }: { v: boolean | string }) => {
  if (v === true) return <Check className="w-5 h-5 text-emerald-600 mx-auto" />;
  if (v === false) return <Minus className="w-5 h-5 text-muted-foreground/40 mx-auto" />;
  return <span className="text-xs text-muted-foreground italic">{v}</span>;
};

const HowItWorks = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const shortTitles = t("pages.howItWorks.stepShortTitles", { returnObjects: true }) as string[];
  const shortBodies = t("pages.howItWorks.stepShortBodies", { returnObjects: true }) as string[];
  const stepsLocalized = steps.map((s, i) => ({ ...s, title: shortTitles[i] ?? s.title, body: shortBodies[i] ?? s.body }));

  return (
    <>
      <SEO title="How Cira works — chat, scan, guidance" description="Talk to your AI nurse, scan vitals with your camera, and get clear next steps. See how Cira works." path="/how-it-works" />
    <div className="min-h-screen bg-background">
      {/* Top nav */}
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
          onClick={() => navigate("/free-chat")}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {t("pages.howItWorks.navTry")}
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-10 pb-16 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{t("pages.howItWorks.heroEyebrow")}</p>
        <h1 className="font-heading text-4xl md:text-6xl leading-[1.05] text-foreground mb-6">
          {t("pages.howItWorks.heroTitleA")} <br className="hidden md:block" /> {t("pages.howItWorks.heroTitleB")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          {t("pages.howItWorks.heroSubtitle")}
        </p>

        <div className="grid sm:grid-cols-3 gap-4 mt-14">
          {stepsLocalized.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border bg-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-heading text-3xl text-primary/80">{s.n}</span>
                <s.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-heading text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 — Talk */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.step1Eyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-5">{t("pages.howItWorks.step1Title")}</h2>
          <p className="text-muted-foreground leading-relaxed mb-6">
            You just talk. Symptoms, history, medications, worries, the goals you care about. No strange forms or
            rigid checklists — Cira asks the right follow-ups, the way a calm, patient nurse would.
          </p>
          <ul className="space-y-3 text-sm">
            {[
              "Speak in your own words, at your own pace.",
              "No account needed to begin a conversation.",
              "Cira listens for nuance, not keywords.",
              "Built on Claude-class medical reasoning, trained over billions of clinical data points.",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <img
            src={talkImg}
            alt="Person having a calm conversation with Cira"
            loading="lazy"
            width={1024}
            height={768}
            className="rounded-3xl w-full h-auto object-cover shadow-lg"
          />
          <div className="absolute -bottom-6 -left-2 md:-left-6 max-w-[280px] bg-card border rounded-2xl shadow-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <img src={ciraLogo} alt="" width={18} height={18} />
              </div>
              <div>
                <p className="text-xs font-medium">Cira</p>
                <p className="text-[10px] text-muted-foreground">Listening</p>
              </div>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed mb-2">
              Hi — I'm Cira. Tell me what's been going on today, in your own words.
            </p>
            <div className="rounded-lg bg-secondary/60 p-2 text-xs text-foreground/80 mb-2">
              I've been feeling more short of breath this week, especially climbing stairs.
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              Thank you for sharing. Is this new, or has it been changing slowly?
            </p>
          </div>
        </div>
      </section>

      {/* Step 2 — Scan */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img
              src={scanImg}
              alt="Face scan reading real-time vitals"
              loading="lazy"
              width={1024}
              height={768}
              className="rounded-3xl w-full h-auto object-cover shadow-lg"
            />
            <div className="grid grid-cols-2 gap-3 mt-6">
              {vitals.map((v) => (
                <div key={v.label} className="rounded-xl bg-card border p-4">
                  <v.icon className="w-4 h-4 text-primary mb-2" />
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{v.unit}</p>
                  <p className="text-sm font-medium">{v.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 md:order-2">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.step2Eyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-5">{t("pages.howItWorks.step2Title")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Powered by Shen AI, your device camera reads subtle changes in skin tone to estimate vital signs — in
              about 30 seconds, with nothing to wear or attach.
            </p>
            <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/80">
                <span className="font-medium">Private by design.</span> Cira uses the scan to calculate vitals. Raw
                face video is not stored — image frames are deleted after processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3 — Understanding */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.step3Eyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-4">
            {t("pages.howItWorks.step3Title")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Cira combines what you said with what the scan measured, checks the patterns against medical knowledge,
            and gently explains what it likely means — and what to do next.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {guidance.map((g) => (
            <div
              key={g.title}
              className={`rounded-2xl border bg-gradient-to-br ${g.tone} p-6`}
            >
              <g.icon className="w-6 h-6 text-foreground mb-4" />
              <h3 className="font-heading text-xl mb-2">{g.title}</h3>
              <p className="text-sm text-foreground/70 leading-relaxed">{g.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step 4 — Real doctors */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.step4Eyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-5">
              {t("pages.howItWorks.step4Title")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Through our partnership with Air Doctor, Cira connects you to a network of 20,000 doctors across 180
              countries. Your Cira summary travels with you as a hand-off to whichever doctor you choose.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <Check className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span>Cira is not the doctor — Air Doctor handles the visit and the network.</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span>Use your Cira report to skip repeating the basics.</span>
              </li>
              <li className="flex gap-3">
                <Check className="w-4 h-4 text-primary mt-1 shrink-0" />
                <span>Find local, in-language care wherever you are.</span>
              </li>
            </ul>
          </div>
          <div>
            <img
              src={nextImg}
              alt="Doctor and patient in a clinic"
              loading="lazy"
              width={1024}
              height={768}
              className="rounded-3xl w-full h-auto object-cover shadow-lg mb-6"
            />
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Cira report</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                  Ready to share
                </span>
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0">Concern</dt><dd>Shortness of breath, 4 days</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0">History</dt><dd>Hypertension, lisinopril 10mg</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0">Vitals</dt><dd>HR 72 · BP trend ↑ · HRV 48ms</dd></div>
                <div className="flex gap-2"><dt className="text-muted-foreground w-24 shrink-0">Cira's read</dt><dd>Likely worth in-person review</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Chronic conditions */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
        <img
          src={chronicImg}
          alt="Person managing a chronic condition with Cira"
          loading="lazy"
          width={1280}
          height={768}
          className="rounded-3xl w-full h-auto object-cover shadow-lg"
        />
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.chronicEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-5">
            {t("pages.howItWorks.chronicTitle")}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            If you live with diabetes, hypertension, COPD or another long-term condition, Cira is designed to be
            there often — without making you feel like you're bothering anyone.
          </p>
          <div className="space-y-5">
            {chronic.map((c) => (
              <div key={c.title} className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">{c.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy in flow */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.privacyEyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">{t("pages.howItWorks.privacyTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">
              No surprises. Here's what we collect, when we use it, and what we never keep.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {privacyFlow.map((p) => (
              <div key={p.eyebrow} className="rounded-2xl border bg-card p-6">
                <p className="text-xs uppercase tracking-wide text-primary mb-2">{p.eyebrow}</p>
                <h4 className="font-medium mb-2">{p.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate("/privacy")}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t("pages.readPrivacyHub")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.comparisonEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-4">
            {t("pages.howItWorks.comparisonTitle")}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Cira isn't trying to replace your doctor — and it isn't a generic chatbot either. It sits in the gap
            between the two.
          </p>
        </div>
        <div className="rounded-2xl border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-4 font-medium"> </th>
                <th className="p-4 font-medium text-muted-foreground">Generic chatbots</th>
                <th className="p-4 font-medium text-muted-foreground">AI doctor platforms</th>
                <th className="p-4 font-medium text-primary">Cira AI nurse</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((r, i) => (
                <tr key={r.label} className={i % 2 ? "bg-secondary/20" : ""}>
                  <td className="p-4 text-foreground/80">{r.label}</td>
                  <td className="p-4 text-center"><Cell v={r.chatbot} /></td>
                  <td className="p-4 text-center"><Cell v={r.ai} /></td>
                  <td className="p-4 text-center bg-primary/5"><Cell v={r.cira} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.howItWorks.ctaEyebrow")}</p>
        <h2 className="font-heading text-3xl md:text-5xl mb-5">
          {t("pages.howItWorks.ctaTitle")}
        </h2>
        <p className="text-muted-foreground leading-relaxed max-w-xl mx-auto mb-8">
          {t("pages.howItWorks.ctaSubtitle")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/free-chat")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            {t("pages.howItWorks.ctaStart")} <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/vitals-scan")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-foreground/20 text-foreground font-medium hover:bg-secondary/60 transition-colors"
          >
            {t("pages.howItWorks.ctaScan")}
          </button>
        </div>
        <div className="mt-10">
          <button
            onClick={() => navigate("/privacy")}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {t("pages.readPrivacyHub")}
          </button>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground">
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
    </>
  );
};

export default HowItWorks;
