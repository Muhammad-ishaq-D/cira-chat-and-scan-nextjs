import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Activity,
  Heart,
  Wind,
  Gauge,
  Brain,
  Award,
  Globe,
  Lock,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Microscope,
  FileText,
} from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import scanImg from "@/assets/tech-scan.webp";
import rppgImg from "@/assets/tech-rppg.webp";
import researchImg from "@/assets/tech-research.webp";
import privacyImg from "@/assets/tech-privacy.webp";
import SEO from "@/components/SEO";

const heroBadges = [
  { icon: Microscope, label: "Peer-reviewed" },
  { icon: Globe, label: "60+ partners, 33 countries" },
  { icon: Cpu, label: "On-device processing" },
];

const summary = [
  {
    icon: Activity,
    title: "How it works",
    body: "A 30-second face scan reads micro-changes in skin color (rPPG) and tiny head movements from your heartbeat (rBCG). AI analyzes both signals to extract clinical vitals — no contact, no wearable, no hardware required.",
  },
  {
    icon: Award,
    title: "How accurate it is",
    body: "Heart rate accuracy of 0.13 bpm mean error (peer-reviewed, Frontiers in Physiology, 2025). A clinical ECG and a Cira scan typically agree within 1 beat per minute, 100% of the time.",
  },
  {
    icon: Lock,
    title: "How private it is",
    body: "All processing happens on your device. Your video is never uploaded, never stored, never sent to a server. We only receive the final vitals — not your face.",
  },
];

const partners = [
  "Allianz",
  "Deutsche Telekom",
  "Aster DM Healthcare",
  "Heartery",
  "Dr.Digital",
  "Healthbird",
  "Caremind",
];

const accuracy = [
  { vital: "Heart Rate", range: "40–120 bpm", error: "0.13 bpm" },
  { vital: "Heart Rate Variability (SDNN)", range: "0–150 ms", error: "3.28 ms" },
  { vital: "Breathing Rate", range: "10–30 bpm", error: "1.12 bpm" },
  { vital: "Systolic Blood Pressure", range: "90–170 mmHg", error: "9.23 mmHg" },
  { vital: "Diastolic Blood Pressure", range: "60–100 mmHg", error: "6.09 mmHg" },
  { vital: "Body Mass Index", range: "15–53", error: "2.84" },
];

const measuresGroups = [
  {
    title: "Vital Signs",
    sub: "Measured directly from the face scan",
    items: [
      "Heart Rate",
      "Heart Rate Variability (HRV)",
      "Blood Pressure (Systolic + Diastolic)",
      "Cardiac Workload",
      "Breathing Rate",
      "Stress Index",
      "Parasympathetic Activity",
      "Body Mass Index",
      "SpO₂ (under research)",
      "HbA1c (under research)",
      "Hemoglobin (under research)",
    ],
  },
  {
    title: "Health Indices",
    sub: "Face scan + your basic info",
    items: [
      "Vascular Age",
      "Wellness Score",
      "Waist-to-Height Ratio",
      "Body Fat Percentage",
      "Basal Metabolic Rate",
      "Body Shape Index",
      "Conicity Index",
      "Body Roundness Index",
      "Total Daily Energy Expenditure",
    ],
  },
  {
    title: "Cardiovascular & Metabolic Risks",
    sub: "Face scan + your basic info",
    items: [
      "Cardiovascular Risk Score",
      "ASCVD Risk",
      "Coronary Heart Disease Risk",
      "Stroke Risk",
      "Heart Failure Risk",
      "Peripheral Vascular Disease Risk",
      "Coronary Death Risk",
      "Cardiovascular Event Risk",
      "Diabetes Risk",
      "Hypertension Risk",
      "Fatty Liver Disease Risk",
    ],
  },
];

const guidance = [
  { n: "1", t: "Self-care at home", b: "With clear notes on what to watch for." },
  { n: "2", t: "Monitor and recheck", b: "Re-scan in a few hours and compare." },
  { n: "3", t: "See a doctor", b: "Book one in 30 seconds via Air Doctor." },
  { n: "4", t: "Seek urgent care", b: "Calm, immediate steps to get help now." },
];

const Technology = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <SEO path="/technology" />
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
          <img src={ciraLogo} alt="Cira health logo" width={24} height={24} />
          <span className="font-heading text-lg">Cira</span>
        </button>
        <button
          onClick={() => navigate("/free-chat")}
          className="text-sm font-medium text-foreground hover:text-primary transition-colors"
        >
          {t("pages.technology.navTry")}
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">{t("pages.technology.heroEyebrow")}</p>
          <h1 className="font-heading text-4xl md:text-5xl leading-[1.05] text-foreground mb-6">
            {t("pages.technology.heroTitle")}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            {t("pages.technology.heroSubtitle")}
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => navigate("/free-chat")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:bg-foreground/90 transition"
            >
              {t("pages.technology.ctaScan")} <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/how-it-works")}
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary transition"
            >
              {t("pages.technology.seeHow")}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {heroBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5">
                <b.icon className="w-3.5 h-3.5 text-primary" />
                {b.label}
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <img
            src={scanImg}
            alt="Phone camera reading vitals from a face"
            width={1280}
            height={896}
            className="rounded-3xl w-full h-auto object-cover shadow-lg"
          />
          <div className="absolute -bottom-6 -right-2 md:-right-6 bg-card border rounded-2xl shadow-xl p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">HR mean error vs ECG</p>
            <p className="font-heading text-3xl text-foreground">0.13 bpm</p>
            <p className="text-[10px] text-muted-foreground mt-1">Frontiers in Physiology, 2025</p>
          </div>
        </div>
      </section>

      {/* Short version */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.summaryEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl">{t("pages.technology.summaryTitle")}</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {summary.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6">
              <s.icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-heading text-xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Shen AI partnership */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.partnerEyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-5">
              {t("pages.technology.partnerTitle")}
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Building clinical-grade face scan technology takes years of computer vision research, terabytes of
              training data, and rigorous medical validation. That's not what Cira is for. Cira is for helping you
              decide what to do when you don't feel right.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              So we partnered with Shen AI — the company that does build that technology, and is one of the global
              leaders in camera-based health monitoring.
            </p>
          </div>
          <img
            src={researchImg}
            alt="Researchers reviewing health data in a lab"
            loading="lazy"
            width={1280}
            height={896}
            className="rounded-3xl w-full h-auto object-cover shadow-lg"
          />
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-20 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Brain,
              t: "Founded by serial entrepreneurs",
              b: "Estonian company founded in 2020 by Remi Koscielny (CEO, took Vivid Games public) and Przemek Jaworski (CTO, founded Zmorph). The team includes researchers, computer vision engineers, and medical scientists.",
            },
            {
              icon: Globe,
              t: "Trusted by global leaders",
              b: "In production with 60+ partners across 33 countries — including Allianz, Deutsche Telekom, Aster DM Healthcare, and Heartery, the #1 BP app on the Apple App Store in US, UK, Canada and Australia.",
            },
            {
              icon: Microscope,
              t: "Peer-reviewed by independent scientists",
              b: "Validated in Frontiers in Physiology (Sept 2025) by the Polish Academy of Sciences and Wroclaw Medical University — mean absolute error of just 0.1 bpm vs clinical ECG.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border bg-card p-6">
              <c.icon className="w-6 h-6 text-primary mb-4" />
              <h3 className="font-heading text-lg mb-2">{c.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-20">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 text-center">{t("pages.technology.trustedBy")}</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-foreground/70">
            {partners.map((p) => (
              <span key={p} className="font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Science */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.scienceEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl mb-4">{t("pages.technology.scienceTitle")}</h2>
          <p className="text-muted-foreground leading-relaxed">
            Most face-based health AI uses one signal. Shen AI combines two — which is why it works reliably across all
            skin tones and even in less-than-ideal lighting.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="rounded-3xl border bg-card overflow-hidden">
            <img src={rppgImg} alt="rPPG pulse waves" loading="lazy" width={1280} height={896} className="w-full h-48 object-cover" />
            <div className="p-6">
              <p className="text-xs uppercase tracking-wide text-primary mb-2">Signal 1</p>
              <h3 className="font-heading text-2xl mb-3">rPPG: Reading blood flow from skin color</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Every heartbeat pushes a wave of blood through vessels just under your skin. That changes the way your
                skin reflects light — by tiny amounts the human eye can't see, but a camera can.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is remote photoplethysmography (rPPG) — the same physics behind hospital pulse oximeters, applied
                through a regular phone camera.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border bg-card overflow-hidden">
            <div className="w-full h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center">
              <Heart className="w-16 h-16 text-primary/60" strokeWidth={1.2} />
            </div>
            <div className="p-6">
              <p className="text-xs uppercase tracking-wide text-primary mb-2">Signal 2</p>
              <h3 className="font-heading text-2xl mb-3">rBCG: Reading micro-movements from your heartbeat</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Each time your heart contracts, it produces a tiny mechanical movement in your head — far too small to
                see, but visible to a camera tracking your face frame by frame.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Combining rBCG with rPPG gives a more reliable signal — especially in low light or for darker skin
                tones, where rPPG alone can be less accurate.
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto mt-10">
          Together, the two signals are processed by Shen AI's <span className="text-foreground font-medium">Multisensing Engine</span> — the AI that turns raw camera data into clinical vitals.
        </p>
      </section>

      {/* Accuracy */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.accuracyEyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl">{t("pages.technology.accuracyTitle")}</h2>
          </div>

          <div className="rounded-2xl border bg-card overflow-hidden">
            <div className="grid grid-cols-3 px-6 py-4 border-b bg-secondary/40 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Vital</span>
              <span>Range</span>
              <span className="text-right">Mean Absolute Error</span>
            </div>
            {accuracy.map((row) => (
              <div key={row.vital} className="grid grid-cols-3 px-6 py-4 border-b last:border-0 text-sm">
                <span className="font-medium text-foreground">{row.vital}</span>
                <span className="text-muted-foreground">{row.range}</span>
                <span className="text-right font-medium text-primary">{row.error}</span>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mt-8">
            For context: in the 2025 Frontiers in Physiology study, Shen AI's heart rate measurements differed from
            clinical ECG by 1 bpm or less in 100% of cases when averaged over 60 seconds, and in 99.8% of cases when
            averaged over 10 seconds. The correlation with ECG was r &gt; 0.99 — essentially perfect agreement.
          </p>

          <a
            href="https://www.frontiersin.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-6 text-sm text-primary hover:underline"
          >
            Read the full peer-reviewed study <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="mt-10 rounded-2xl border bg-card p-6 flex gap-4">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">Important.</span> Cira presents these vitals as triage
              signals to inform our recommendations — not as medical diagnoses. The technology is currently undergoing
              EU Medical Device Regulation (MDR) conformity assessment. For more on what Cira is and isn't, see our{" "}
              <button onClick={() => navigate("/how-it-works")} className="text-primary hover:underline">
                How It Works page
              </button>
              .
            </p>
          </div>
        </div>
      </section>

      {/* What Cira measures */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.measuresEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl">{t("pages.technology.measuresTitle")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {measuresGroups.map((g) => (
            <div key={g.title} className="rounded-2xl border bg-card p-6">
              <h3 className="font-heading text-xl mb-1">{g.title}</h3>
              <p className="text-xs text-muted-foreground mb-5">{g.sub}</p>
              <ul className="space-y-2">
                {g.items.map((i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary mt-1 shrink-0" />
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed text-center max-w-3xl mx-auto mt-8">
          All risk indices are calculated using established clinical models, including the Framingham Heart Study and
          2024 European Society of Cardiology guidelines. Risk scores are population-based estimates, not individual
          diagnoses.
        </p>
      </section>

      {/* Privacy */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <img
            src={privacyImg}
            alt="On-device processing on a smartphone"
            loading="lazy"
            width={1280}
            height={896}
            className="rounded-3xl w-full h-auto object-cover shadow-lg"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.privacyEyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-5">{t("pages.technology.privacyTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Most face-based AI sends your video to a server, runs analysis there, and stores the data. Shen AI
              doesn't.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              The entire scan runs on your device — in your browser or your phone — in real time. Your video is never
              uploaded, never stored, never sent anywhere. Cira only receives the final vitals data, not the raw video.
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              {[
                { icon: Cpu, t: "On-device", b: "Your video stays on your phone." },
                { icon: Lock, t: "No cloud, no storage", b: "Nothing sent or kept." },
                { icon: ShieldCheck, t: "GDPR compliant", b: "Built for EU privacy." },
              ].map((p) => (
                <div key={p.t} className="rounded-xl border bg-card p-4">
                  <p.icon className="w-4 h-4 text-primary mb-2" />
                  <p className="text-sm font-medium">{p.t}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.b}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate("/privacy")}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              Read our full Security &amp; Privacy Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Case studies */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.caseEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl">{t("pages.technology.caseTitle")}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-card p-7">
            <p className="text-xs uppercase tracking-wide text-primary mb-3">Case study · Heartery</p>
            <h3 className="font-heading text-2xl mb-3">#1 blood pressure app in 4 countries</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Heartery is a hypertension management app. After integrating Shen AI's face scan technology, they became
              the #1 blood pressure app on the Apple App Store in the US, UK, Canada, and Australia. They report a
              350% increase in user retention, and an average blood pressure reduction of 2.5–3 mmHg among users.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-7">
            <p className="text-xs uppercase tracking-wide text-primary mb-3">Case study · Dr.Digital</p>
            <h3 className="font-heading text-2xl mb-3">A virtual clinic without the hardware</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Dr.Digital used to ship physical blood pressure cuffs and other devices to its patients. After
              integrating Shen AI, they removed the logistics of distributing hardware and scaled preventive care
              across their entire patient base — using only the phones their patients already had.
            </p>
            <blockquote className="border-l-2 border-primary pl-4 text-sm italic text-foreground/80">
              "Integrating Shen AI into our platform helped us scale preventive care without the operational burden of
              distributing and managing medical devices. That's a game-changer for a virtual clinic like ours."
              <footer className="not-italic text-xs text-muted-foreground mt-2">
                — Ondrej Svoboda, CEO &amp; Founder, Dr.Digital
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* From vitals to answer */}
      <section className="bg-secondary/40 border-y">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.fromVitalsEyebrow")}</p>
            <h2 className="font-heading text-3xl md:text-4xl mb-4">
              {t("pages.technology.fromVitalsTitle")}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Most camera-based health technologies stop at giving you a number. Cira goes further. Once Shen AI delivers
              your vitals, our AI assistant — powered by Anthropic's Claude — combines that objective data with your
              answers to a few targeted questions about how you're feeling.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {guidance.map((g) => (
              <div key={g.n} className="rounded-2xl border bg-card p-5">
                <span className="font-heading text-3xl text-primary/80">{g.n}</span>
                <h4 className="font-medium mt-3 mb-1">{g.t}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{g.b}</p>
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground text-center mb-8">
            Plus a structured visit summary you can email to any doctor, anywhere.
          </p>

          <div className="text-center">
            <button
              onClick={() => navigate("/free-chat")}
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition"
            >
              {t("pages.technology.ctaScan")} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Technically curious */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">{t("pages.technology.techCuriousEyebrow")}</p>
          <h2 className="font-heading text-3xl md:text-4xl">{t("pages.technology.techCuriousTitle")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: FileText,
              t: "Read the peer-reviewed validation study",
              b: "Pstras et al., Frontiers in Physiology, September 2025.",
            },
            {
              icon: Brain,
              t: "See Shen AI's technology page",
              b: "Detailed technical documentation on rPPG, rBCG, and the Multisensing Engine.",
            },
            {
              icon: Activity,
              t: "Try Shen AI's own demo",
              b: "Test the underlying scan technology directly on Shen AI's site.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
              <c.icon className="w-5 h-5 text-primary mb-4" />
              <h4 className="font-medium mb-2">{c.t}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pt-4 pb-24 text-center">
        <h2 className="font-heading text-3xl md:text-4xl mb-4">
          {t("pages.technology.finalTitle")}
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8">
          {t("pages.technology.finalSubtitle")}
        </p>
        <button
          onClick={() => navigate("/free-chat")}
          className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-7 py-3 text-base font-medium hover:bg-foreground/90 transition"
        >
          {t("pages.technology.finalCta")} <ArrowRight className="w-4 h-4" />
        </button>
      </section>
    </div>
    </>
  );
};

export default Technology;
