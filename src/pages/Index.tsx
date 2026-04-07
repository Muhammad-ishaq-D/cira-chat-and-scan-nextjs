import ciraLogo from "@/assets/cira-logo.svg"; 
import founderPhoto from "@/assets/founder-jeanmarc.jpg";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";
import realScan from "@/assets/real-scan.webp";
import faceNormal from "@/assets/face-normal.jpg";
import faceHeatmap from "@/assets/face-heatmap.jpg";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";



const specialties = ["GP", "Pediatrics", "Psychology", "Sexology", "Weight loss", "Cardiology"];

const markersCol1 = [
  "Blood Pressure",
  "Heart Rate",
  "Heart Rate Variability",
  "Cardiac Workload",
  "Breathing Rate",
  "Stress Index",
  "Body Mass Index",
  "Parasympathetic Activity",
];

const markersCol2 = [
  "Vascular Age",
  "Wellness Score",
  "Waist-to-Height Ratio",
  "Body Fat Percentage",
  "Basal Metabolic Rate",
  "Body Shape Index",
  "Total Daily Energy Expenditure",
];

const markersCol3 = [
  "Cardiovascular Risk Score",
  "Coronary Heart Disease Risk",
  "Stroke Risk",
  "Heart Failure Risk",
  "Diabetes Risk",
  "Fatty Liver Disease Risk",
  "Cardiovascular Event Risk",
];

const accuracyData = [
  { metric: "Heart Rate", time: "30 sec", accuracy: "0.13 MAE" },
  { metric: "Heart Rate Variability", time: "30 sec", accuracy: "3.28 MAE" },
  { metric: "Breathing Rate", time: "30 sec", accuracy: "1.12 MAE" },
  { metric: "Systolic Blood Pressure", time: "30 sec", accuracy: "9.23 MAE" },
  { metric: "Diastolic Blood Pressure", time: "30 sec", accuracy: "6.09 MAE" },
  { metric: "Body Mass Index", time: "30 sec", accuracy: "2.84 MAE" },
];

const trustLogos = ["Allianz", "Deutsche Telekom", "Dr.Digital", "Heartery", "CAREMINDr", "HealthBird"];

const visitHistory = [
  { date: "Mar 16", complaint: "Heart racing, elevated BP", result: "Cira: stress response" },
  { date: "Mar 3", complaint: "Fatigue, low HRV", result: "Cira: early viral onset" },
  { date: "Feb 14", complaint: "Chest tightness", result: "Connected to doctor" },
  { date: "Feb 2", complaint: "Headache, high BP", result: "Cira: hypertensive episode" },
];

const Index = () => {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity">
          Login
        </button>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 pt-12 pb-20">
        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 mb-10 text-sm font-body text-foreground">
          <span className="font-semibold">🔒 100%-Secure</span>
          <span>👥 Trusted by thousands</span>
          <span>⚡ Instant AI answers</span>
        </div>

        {/* Avatar + H1 */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src={doctor1} alt="Cira avatar" className="w-12 h-12 rounded-full object-cover" />
          <h1 className="font-heading text-4xl md:text-[48px] font-semibold text-foreground leading-tight">
            Hi, I'm <span className="text-primary">Cira</span>, your AI Nurse
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-base text-muted-foreground text-center leading-relaxed mb-2 font-body max-w-2xl mx-auto">
          I'll ask a few structured questions <span className="font-medium text-foreground">(about 3–5 minutes)</span> to help understand your symptoms and prepare your medical consultation, should you choose to see a doctor.
        </p>

        <p className="text-base text-foreground font-semibold text-center mb-6 font-body">
          Let's start with what's been bothering you.
        </p>

        {/* Symptom chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          {["Fatigue & Energy", "Weight Management", "Hair & Skin", "Hormones"].map((chip) => (
            <button
              key={chip}
              className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-body text-foreground hover:border-primary hover:bg-primary/5 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Chat input */}
        <div className="max-w-2xl mx-auto mb-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <textarea
              placeholder="Ask me anything about your health..."
              className="w-full bg-transparent text-foreground font-body text-base resize-none outline-none placeholder:text-muted-foreground min-h-[80px]"
              rows={3}
            />
            <div className="flex items-center justify-end mt-3">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                Ask Cira
              </button>
            </div>
          </div>
        </div>

        {/* Powered by face scan */}
        <p className="text-xs text-muted-foreground text-center font-body mb-2">
          📷 Powered by <button onClick={() => scrollTo("scan")} className="text-primary hover:underline font-medium">real-time face scan</button> — 30+ vitals in 30 seconds
        </p>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center font-body leading-relaxed">
          Cira is an AI nurse assistant, not a licensed medical professional, and does not provide medical diagnosis, treatment, or professional healthcare advice.
        </p>
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* CIRA'S INTELLIGENCE */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-card py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[40px] font-semibold text-foreground leading-tight mb-6">
            Cira doesn't guess.<br />
            She thinks.
          </h2>

          <div className="max-w-2xl mx-auto mb-14 font-body text-base text-muted-foreground leading-relaxed space-y-4">
            <p>Cira is trained on hundreds of millions of clinical cases, peer-reviewed medical studies, and real diagnostic data from around the world.</p>
            <p>When you describe your symptoms — she doesn't search for keywords. She thinks through every possible combination. Every diagnostic pathway. Every risk factor. Every contraindication.</p>
            <p>Then she adds your real vitals from the scan.</p>
            <p>And she tells you what the combination means. Not a list of possibilities. <strong className="text-foreground">A specific assessment. Backed by real data.</strong></p>
          </div>

          {/* Four capability lines */}
          <div className="max-w-2xl mx-auto space-y-8 text-left mb-14">
            <div className="flex gap-4">
              <span className="text-2xl">📚</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                Trained on peer-reviewed medical literature<br />
                and hundreds of millions of clinical cases
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🧠</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                Multiple diagnostic pathways evaluated<br />
                simultaneously — not sequential guessing
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🔄</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                Cross-references your symptoms with your<br />
                real clinical vitals from the face scan
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">📋</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                Produces structured health assessments<br />
                that mirror real clinical consultations
              </p>
            </div>
          </div>

          {/* Cira example — pink card */}
          <div className="border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-2xl mx-auto text-left mb-6">
            <p className="text-sm text-foreground font-body leading-relaxed italic whitespace-pre-line">
              {"\"Your blood pressure is 138/88 and your heart\nrate is 102. Combined with the chest tightness\nyou're describing and your HRV drop of 22% —\nthis pattern is consistent with acute\ncardiovascular stress.\n\nThis is not something to sleep on.\n\nGo to a clinic or emergency room within the\nnext two hours. I've prepared a complete\nsummary of everything I found for your doctor.\""}
            </p>
            <p className="text-xs text-primary font-body mt-3 font-medium">— Cira</p>
          </div>

          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            Cira does not replace professional medical advice.<br />
            All assessments should be reviewed with a qualified physician.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SHEN AI CREDIBILITY */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-background py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[40px] font-semibold text-foreground leading-tight mb-6">
            The scan is not an estimate.<br />
            It's clinical technology.
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-14 font-body whitespace-pre-line">
            {"The face scan powering Cira is built by Shen AI —\na clinically validated health monitoring company\nfounded in Estonia in 2020.\n\nTheir SDK 3.0 uses signal fusion, beat-by-beat\nblending of rPPG and rBCG signals — selecting\nthe strongest data from each source in real time.\n\nThe result: consistent accuracy across all skin tones,\nall lighting conditions, and all devices."}
          </p>

          {/* Four proof numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-14">
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">7M+</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">Real-world samples<br />in training data</p>
              </div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">20%</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">BP accuracy gain<br />in elevated range</p>
              </div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">80+</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">Healthcare<br />partners</p>
              </div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">33</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">Countries<br />worldwide</p>
              </div>
            </div>
          </div>

          {/* How it works — technical detail */}
          <div className="max-w-2xl mx-auto space-y-8 text-left mb-14">
            <div className="flex gap-4">
              <span className="text-2xl">🔬</span>
              <div>
                <p className="text-sm font-medium text-foreground font-body mb-1">Signal Fusion — beat by beat</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Two parallel signals — rPPG (skin colour changes from blood flow) and rBCG (micro-movements from heartbeats) — are processed simultaneously. The SDK selects the strongest beats from whichever source is best at any given moment.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🧠</span>
              <div>
                <p className="text-sm font-medium text-foreground font-body mb-1">Neural 3D face tracking</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  A neural network builds a 3D face mask and realigns it throughout the scan. A dual-tracker architecture keeps the measurement running even if you shift position, tilt your head, or adjust your grip.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-medium text-foreground font-body mb-1">Measurement Quality Guidance</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Before the scan: coaching on positioning and lighting. During: live quality feedback. After: results with a quality rating and tips for improvement. A 7-component Environmental Quality Index ensures clinical rigour.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <p className="text-sm font-medium text-foreground font-body mb-1">100% on-device processing</p>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">
                  Your camera feed is never recorded, transmitted, or stored. Everything runs locally on your phone. Nothing leaves your device. Ever.
                </p>
              </div>
            </div>
          </div>

          {/* Clinical accuracy table */}
          <div className="text-center mb-8">
            <h3 className="font-heading text-[28px] font-semibold text-foreground leading-tight">
              Proven accurate in clinical studies.
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-2">
              Blood pressure accuracy improved 20% in the elevated range (140–170 mmHg).<br />
              Body composition accuracy improved 45% with retrained models on millions of samples.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden max-w-2xl mx-auto mb-4">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Metric</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Time</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {accuracyData.map((row) => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{row.metric}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.time}</td>
                    <td className="px-5 py-3 text-muted-foreground">{row.accuracy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground text-center font-body mb-14">
            Source: Shen AI SDK 3.0 clinical validation studies
          </p>

          {/* Trust logos */}
          <p className="text-sm text-muted-foreground text-center font-body mb-6">
            Trusted by 80+ healthcare partners in 33 countries
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-14">
            {["Allianz", "Deutsche Telekom", "Dr.Digital", "Heartery", "CAREMINDr"].map((logo) => (
              <span key={logo} className="text-sm text-muted-foreground font-body opacity-60">{logo}</span>
            ))}
          </div>

          {/* Quote */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-2xl mx-auto text-center mb-6">
            <p className="text-base text-foreground font-body leading-relaxed mb-4 italic">
              "Integrating Shen AI helped us become the<br />
              #1 blood pressure app in the US, UK, Canada<br />
              and Australia."
            </p>
            <p className="text-sm text-muted-foreground font-body">
              — Leo Rosenbaum, Founder of Heartery
            </p>
          </div>

          <p className="text-xs text-muted-foreground font-body leading-relaxed">
            Undergoing EU Medical Device Regulation certification.<br />
            Strict precision mode suppresses results when quality falls below clinical threshold.<br />
            All processing on your device. Nothing sent to any server. Ever.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SCAN YOURSELF */}
      {/* ═══════════════════════════════════════════ */}
      <section id="scan" className="max-w-6xl mx-auto px-6 pb-20 pt-16">
        <div className="text-center">
          <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
            See what your body is actually saying.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-body whitespace-pre-line">
            {"Cira uses Shen AI — clinically validated\ncamera technology — to read 30+ vital signs\nfrom your face in 30 seconds.\n\nBlood pressure. Heart rate. HRV.\nStress index. Breathing rate.\nNo hardware. No wearables.\nJust your camera."}
          </p>
          <button className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3">
            Start your scan →
          </button>
          <p className="text-xs text-muted-foreground mt-3 font-body">
            All processing on your device.<br />
            Nothing stored without your permission.
          </p>
        </div>

        <div className="border-t border-border my-14" />

        {/* Real scan in scan section */}
        <div className="max-w-lg mx-auto mb-4">
          <img
            src={realScan}
            alt="Real Shen AI scan — PULSE 102 bpm, SBP 135 mmHg, DBP 86 mmHg"
            loading="lazy"
            className="w-full rounded-xl shadow-md"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center font-body mb-3">
          What you see vs what the AI reads beneath your skin
        </p>
        <p className="text-xs text-muted-foreground text-center font-body max-w-lg mx-auto leading-relaxed">
          rPPG analyzes subtle color changes in your skin caused by blood flow.<br />
          rBCG detects micro-movements generated by your heartbeat.<br />
          Both running simultaneously. All from your camera.
        </p>

        <div className="border-t border-border my-14" />

        {/* 30+ markers — 3 columns */}
        <div className="text-center mb-10">
          <h3 className="font-heading text-[32px] font-semibold text-foreground leading-tight">
            30+ health markers.<br />
            From your face.<br />
            In 30 seconds.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">Vital Signs</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">Measured entirely from the face scan</p>
            <ul className="space-y-2">
              {markersCol1.map((m) => (
                <li key={m} className="text-sm text-foreground font-body">{m}</li>
              ))}
            </ul>
          </div>
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">Health Indices</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">Based on scan and user data</p>
            <ul className="space-y-2">
              {markersCol2.map((m) => (
                <li key={m} className="text-sm text-foreground font-body">{m}</li>
              ))}
            </ul>
          </div>
          <div className="bg-secondary rounded-2xl p-6">
            <p className="text-xs text-muted-foreground font-body mb-4 uppercase tracking-wide">Health Risks</p>
            <p className="text-[11px] text-muted-foreground font-body mb-4 italic">Based on scan and user data</p>
            <ul className="space-y-2">
              {markersCol3.map((m) => (
                <li key={m} className="text-sm text-foreground font-body">{m}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center font-body">
          Shen AI · Clinically validated · Undergoing EU Medical Device Regulation certification
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DASHBOARD PREVIEW */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6">
          Every scan saved.<br />
          Your health history<br />
          built automatically.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          Every time you use Cira —<br />
          the conversation, the scan, the result —<br />
          saved to your personal dashboard.<br /><br />
          Your own medical file.<br />
          Built scan by scan.<br />
          Owned entirely by you.
        </p>

        {/* Browser chrome mockup */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-3xl mx-auto text-left relative">
          {/* Browser bar */}
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

          {/* Dashboard content */}
          <div className="flex min-h-[400px]">
            {/* Sidebar */}
            <div className="w-44 border-r border-border bg-secondary p-4 hidden sm:block">
              <div className="flex items-center gap-2 mb-6">
                <img src={ciraLogo} alt="Cira" width={20} height={20} />
                <span className="font-heading text-sm font-semibold text-foreground">Cira</span>
              </div>
              <ul className="space-y-3 text-sm font-body">
                <li className="text-foreground font-medium">Dashboard</li>
                <li className="text-muted-foreground">Talk to Cira</li>
                <li className="text-muted-foreground">My Scans</li>
                <li className="text-muted-foreground">History</li>
                <li className="text-muted-foreground">Doctor Report</li>
              </ul>
              <button className="mt-6 w-full bg-primary text-primary-foreground py-2 rounded-lg text-xs font-medium font-body">
                New Scan
              </button>
            </div>

            {/* Main area */}
            <div className="flex-1 p-5">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Visit History</h3>
              <table className="w-full text-xs font-body mb-6">
                <tbody>
                  {visitHistory.map((v) => (
                    <tr key={v.date} className="border-b border-border last:border-0">
                      <td className="py-2 text-muted-foreground whitespace-nowrap pr-3">{v.date}</td>
                      <td className="py-2 text-foreground pr-3">{v.complaint}</td>
                      <td className="py-2 text-muted-foreground">{v.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="font-heading text-lg font-semibold text-foreground mb-3">Last Scan</h3>
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground font-body">Heart Rate</p>
                  <p className="text-sm text-foreground font-body font-medium">89 bpm <span className="text-primary text-xs">↑ Elevated</span></p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground font-body">Blood Pressure</p>
                  <p className="text-sm text-foreground font-body font-medium">138/88 <span className="text-primary text-xs">↑ Above baseline</span></p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground font-body">HRV</p>
                  <p className="text-sm text-foreground font-body font-medium">28ms <span className="text-destructive text-xs">↓ Critically low</span></p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-[11px] text-muted-foreground font-body">Stress Index</p>
                  <p className="text-sm text-foreground font-body font-medium">High <span className="text-primary text-xs">↑</span></p>
                </div>
              </div>

              {/* Cira observation */}
              <div className="border-l-4 border-primary bg-secondary rounded-r-lg p-4">
                <p className="text-xs text-muted-foreground font-body mb-1">Cira noticed</p>
                <p className="text-sm text-foreground font-body italic leading-relaxed">
                  "I've seen this pattern before.<br />
                  Last time it led to an infection.<br />
                  Watch for fever in 48 hours."
                </p>
              </div>
            </div>
          </div>

          {/* Gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none" />
        </div>

        <p className="text-sm text-muted-foreground mt-6 italic font-body">
          "Your medical history. Built automatically. Every time you use Cira."
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DOCTOR REPORT */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6">
          One click.<br />
          Your doctor gets everything.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          Every visit. Every scan. Every result.<br />
          One page. Ready in 30 seconds.
        </p>

        {/* Report card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-2xl mx-auto text-left font-body text-sm">
          <div className="border-t-2 border-b-2 border-foreground py-2 mb-4 text-center">
            <p className="text-foreground font-semibold tracking-widest text-xs uppercase">Cira Health Summary</p>
          </div>

          <div className="space-y-1 text-muted-foreground mb-4">
            <p>Period: Oct 2025 → Mar 2026</p>
            <p>Scans completed: 24</p>
          </div>

          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span className="text-foreground">Blood Pressure</span>
              <span className="text-muted-foreground">121/79 <span className="text-primary">↑ Rising</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Heart Rate</span>
              <span className="text-muted-foreground">68 bpm <span>↔ Stable</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">HRV</span>
              <span className="text-muted-foreground">38ms <span className="text-destructive">↓ Declining</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Stress Index</span>
              <span className="text-muted-foreground">Elevated <span className="text-primary">↑ Sustained</span></span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-foreground font-medium mb-2">Cira noticed:</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>BP elevated on 6 occasions</li>
              <li>HRV declining 5 weeks straight</li>
              <li>Stress peaks every Monday</li>
            </ul>
          </div>

          <div className="mb-4">
            <p className="text-foreground font-medium mb-2">Questions for your doctor:</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Should the HRV decline concern us?</li>
              <li>Is the BP trend worth treating now?</li>
            </ul>
          </div>

          <div className="border-t-2 border-b-2 border-foreground py-2 text-center">
            <p className="text-muted-foreground text-xs">Powered by Cira · Shen AI SDK</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6 italic font-body">
          "For the first time — arrive at your doctor's with real data in your hands."
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* BOOK A DOCTOR */}
      {/* ═══════════════════════════════════════════ */}
      <section id="doctor" className="max-w-4xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
          See a real doctor.<br />
          Today. Anywhere.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-body">
          Choose the specialist you need.<br />
          A licensed doctor will take care of you.
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {specialties.map((s) => (
            <span
              key={s}
              className="px-4 py-1.5 rounded-full border border-border text-sm text-muted-foreground font-body"
            >
              {s}
            </span>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-8 font-body">
          Satisfaction guaranteed or reimbursed.
        </p>

        <button className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3">
          Book a doctor now →
        </button>

        <p className="text-xs text-muted-foreground mt-3 font-body">
          Powered by Air Doctor ·<br />
          Licensed physicians · Available globally 24/7
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOUNDER TEASER */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-background py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <img
            src={founderPhoto}
            alt="Jean-Marc, Founder"
            className="w-[60px] h-[60px] rounded-full object-cover mx-auto mb-3"
            loading="lazy"
            width={60}
            height={60}
          />
          <p className="text-sm text-muted-foreground font-body mb-4">Jean-Marc</p>

          <p className="text-base text-foreground font-body leading-relaxed italic max-w-2xl mx-auto mb-4">
            "I built Cira because I have<br />
            high blood pressure and high cholesterol.<br />
            Every time I see my doctor<br />
            I arrived with nothing.<br /><br />
            Last week my scan showed<br />
            pulse 102 and BP 135/86.<br />
            For the first time — I had something<br />
            real to show my doctor."
          </p>

          <p className="text-sm text-muted-foreground font-body mb-6">— Jean-Marc, Founder</p>

          <button
            onClick={() => navigate("/our-story")}
            className="text-primary text-sm font-body hover:underline transition-colors"
          >
            Read the full story →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>Cira does not replace professional medical advice.</p>
        <p>Vitals: Shen AI · Doctors: Air Doctor</p>
        <p>
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          {" · "}
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </p>
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
  );
};

export default Index;
