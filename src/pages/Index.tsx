import ciraSpark from "@/assets/cira-spark.png";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";
import realScan from "@/assets/real-scan.webp";
import faceNormal from "@/assets/face-normal.jpg";
import faceHeatmap from "@/assets/face-heatmap.jpg";
import { useNavigate } from "react-router-dom";

const chips = [
  "My heart is racing",
  "I have pain",
  "I feel unwell",
  "I'm worried",
];

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <img src={ciraSpark} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => scrollTo("scan")} className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body">
            Scan yourself
          </button>
          <button onClick={() => scrollTo("doctor")} className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body">
            Book a doctor
          </button>
          <button onClick={() => navigate("/dashboard")} className="text-muted-foreground text-sm hover:text-foreground transition-colors font-body">
            Log in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-3xl mx-auto px-6 pt-12 pb-24">
        <div className="flex flex-col md:flex-row items-center gap-10">
          {/* Left — Chat */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start mb-10">
              <img src={doctor1} alt="Doctor" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-background" />
              <img src={ciraSpark} alt="Cira" width={44} height={44} className="w-11 h-11 -ml-2 z-10" />
              <img src={doctor2} alt="Doctor" width={40} height={40} className="w-10 h-10 rounded-full object-cover border-2 border-background -ml-2" />
            </div>

            <h1 className="font-heading text-4xl md:text-5xl font-semibold text-foreground leading-tight mb-6">
              Hi, I'm Cira.<br />
              Tell me what's wrong.
            </h1>

            <p className="text-xs text-muted-foreground leading-relaxed mb-6 font-body">
              Trained on peer-reviewed medical data worldwide.<br />
              Always discuss Cira's findings with a doctor.<br />
              Cira is an AI health nurse, not a licensed medical professional.
            </p>

            <div className="text-base text-muted-foreground leading-relaxed mb-10 space-y-1">
              <p>I'll ask you questions about what you're feeling.</p>
              <p>I'll scan your vitals through your camera if I need to.</p>
              <p>Then we decide together what to do next.</p>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-5 text-left mb-4">
              <input
                type="text"
                placeholder="Tell me how you're feeling..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none mb-4 font-body"
                readOnly
              />
              <div className="flex flex-wrap gap-2 mb-5">
                {chips.map((chip) => (
                  <button
                    key={chip}
                    className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors font-body"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button className="w-full bg-primary text-primary-foreground py-3 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body">
                Talk to Cira →
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              🔒 Private · Free · Available 24/7
            </p>
          </div>

          {/* Right — Real scan screenshot */}
          <div className="flex-shrink-0 w-64 md:w-80">
            <img
              src={realScan}
              alt="Real Shen AI scan — PULSE 102 bpm, SBP 135 mmHg, DBP 86 mmHg, measurement complete"
              className="w-full rounded-2xl shadow-lg"
            />
            <p className="text-xs text-muted-foreground text-center mt-3 font-body">
              Real scan · Real face · Real data · 30 seconds
            </p>
            {/* Cira speech bubble */}
            <div className="mt-4 bg-primary/10 border border-primary/20 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-foreground font-body leading-relaxed">
                "Your blood pressure is elevated at 135/86 and your pulse is 102. Tell me — how are you feeling right now?"
              </p>
              <p className="text-xs text-primary font-body mt-1 font-medium">— Cira</p>
            </div>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* CIRA'S INTELLIGENCE */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-card py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[40px] font-semibold text-foreground leading-tight mb-6">
            Cira doesn't guess.<br />
            She thinks.
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[520px] mx-auto mb-14 font-body whitespace-pre-line">
            {"Cira is trained on hundreds of millions of\nclinical cases, peer-reviewed medical studies,\nand real diagnostic data from around the world.\n\nWhen you describe your symptoms — she doesn't\nsearch for keywords. She thinks through every\npossible combination. Every diagnostic pathway.\nEvery risk factor. Every contraindication.\n\nThen she adds your real vitals from the scan.\n\nAnd she tells you what the combination means.\nNot a list of possibilities.\nA specific assessment. Backed by real data."}
          </p>

          {/* Four capability lines */}
          <div className="max-w-[520px] mx-auto space-y-8 text-left mb-14">
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
          <div className="border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-[560px] mx-auto text-left mb-6">
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
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-heading text-[40px] font-semibold text-foreground leading-tight mb-6">
            The scan is not an estimate.<br />
            It's clinical technology.
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[520px] mx-auto mb-14 font-body whitespace-pre-line">
            {"The face scan powering Cira is built by Shen AI —\na clinically validated health monitoring company\nfounded in Estonia in 2020.\n\nTheir technology is used by insurers, hospitals,\nand telehealth platforms across 33 countries.\n\nNot a startup experiment.\nProven clinical infrastructure trusted by the\nworld's largest healthcare organisations."}
          </p>

          {/* Four proof numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-[600px] mx-auto mb-14">
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">7M</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">Data points<br />in training</p>
              </div>
            </div>
            <div>
              <p className="font-heading text-3xl font-semibold text-foreground">500K</p>
              <div className="border-t border-border mt-2 pt-2">
                <p className="text-xs text-muted-foreground font-body">Individuals<br />in dataset</p>
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

          {/* How it works — three points */}
          <div className="max-w-[520px] mx-auto space-y-8 text-left mb-14">
            <div className="flex gap-4">
              <span className="text-2xl">👁</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                Computer vision reads subtle colour changes<br />
                in your skin caused by blood flow beneath<br />
                the surface — invisible to the human eye
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🔬</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                rPPG and rBCG algorithms extract 30+ vital<br />
                signs from any camera in any lighting<br />
                across all skin tones
              </p>
            </div>
            <div className="flex gap-4">
              <span className="text-2xl">🔒</span>
              <p className="text-sm text-foreground font-body leading-relaxed">
                100% on-device processing — your camera<br />
                feed is never recorded, transmitted,<br />
                or stored anywhere
              </p>
            </div>
          </div>

          {/* Clinical accuracy table */}
          <div className="text-center mb-8">
            <h3 className="font-heading text-[28px] font-semibold text-foreground leading-tight">
              Proven accurate in clinical studies.
            </h3>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden max-w-[560px] mx-auto mb-4">
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
            Source: Shen AI clinical validation studies
          </p>

          {/* Trust logos */}
          <p className="text-sm text-muted-foreground text-center font-body mb-6">
            Trusted by 60+ healthcare partners in 33 countries
          </p>
          <div className="flex flex-wrap justify-center gap-8 mb-14">
            {["Allianz", "Deutsche Telekom", "Dr.Digital", "Heartery", "CAREMINDr"].map((logo) => (
              <span key={logo} className="text-sm text-muted-foreground font-body opacity-60">{logo}</span>
            ))}
          </div>

          {/* Quote */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-[520px] mx-auto text-center mb-6">
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
            All processing on your device. Nothing sent to any server. Ever.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SCAN YOURSELF */}
      {/* ═══════════════════════════════════════════ */}
      <section id="scan" className="max-w-3xl mx-auto px-6 pb-20 pt-16">
        <div className="text-center">
          <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
            See what your body is actually saying.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto mb-8 font-body whitespace-pre-line">
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
        <div className="max-w-md mx-auto mb-4">
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
        <p className="text-xs text-muted-foreground text-center font-body max-w-md mx-auto leading-relaxed">
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
      <section className="max-w-3xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6">
          Every scan saved.<br />
          Your health history<br />
          built automatically.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[460px] mx-auto mb-10 font-body">
          Every time you use Cira —<br />
          the conversation, the scan, the result —<br />
          saved to your personal dashboard.<br /><br />
          Your own medical file.<br />
          Built scan by scan.<br />
          Owned entirely by you.
        </p>

        {/* Browser chrome mockup */}
        <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-[680px] mx-auto text-left relative">
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
                <img src={ciraSpark} alt="Cira" width={20} height={20} />
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
      <section className="max-w-3xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6">
          One click.<br />
          Your doctor gets everything.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[440px] mx-auto mb-10 font-body">
          Every visit. Every scan. Every result.<br />
          One page. Ready in 30 seconds.
        </p>

        {/* Report card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 max-w-[500px] mx-auto text-left font-body text-sm">
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
      <section id="doctor" className="max-w-xl mx-auto px-6 pb-20 pt-16 text-center">
        <h2 className="font-heading text-[38px] font-semibold text-foreground leading-tight mb-6">
          See a real doctor.<br />
          Today. Anywhere.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto mb-8 font-body">
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

      {/* Footer */}
      <footer className="max-w-xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
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
