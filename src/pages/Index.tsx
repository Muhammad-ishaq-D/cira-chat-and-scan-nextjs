import ciraLogo from "@/assets/cira-logo.svg";
import dashboardPreview from "@/assets/dashboard-preview.png";
import founderPhoto from "@/assets/founder-jeanmarc.jpg";
import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";
import realScan from "@/assets/real-scan.webp";
import faceNormal from "@/assets/face-normal.jpg";
import faceHeatmap from "@/assets/face-heatmap.jpg";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { isAuthenticated, getUser } from "@/lib/auth";
import ConsentBanner from "@/components/ConsentBanner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import HamburgerMenu from "@/components/HamburgerMenu";

const faqs = [
  {
    q: "Is Cira a replacement for my doctor?",
    a: "No. Cira is an AI health nurse, trained on clinical protocols. She helps you understand your symptoms, track your vitals, and arrive prepared at your doctor's office — but she never replaces professional medical advice.",
  },
  {
    q: "How accurate is the face scan?",
    a: "Cira uses the Shen AI SDK, a clinically validated rPPG technology that measures heart rate, blood pressure, breathing rate, and 15+ other vitals from a 60-second face scan. It is used in regulated health settings worldwide.",
  },
  {
    q: "Is my data private?",
    a: "Yes. The face scan is processed 100% on-device — your video never leaves your phone. Your conversations and vitals are encrypted and stored securely. We never sell your data.",
  },
  {
    q: "How much does it cost?",
    a: "You can chat with Cira and run one face scan completely free, no signup required. Paid plans unlock unlimited scans, conversation history, and detailed clinical reports.",
  },
  {
    q: "Which languages does Cira speak?",
    a: "Cira speaks 16+ languages including English, Spanish, French, Mandarin, Arabic, Hindi, Portuguese, German, Japanese, and more.",
  },
  {
    q: "Can I see a real doctor through Cira?",
    a: "Yes. After your assessment, you can book a licensed physician across specialties including GP, Pediatrics, Psychology, Cardiology, and more — available globally, 24/7.",
  },
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

const heroChatMessages = [
  { role: "cira", text: "Hi! I'm Cira. What's bothering you? 👋" },
  { role: "user", text: "Headache and sore throat for 2 days" },
  { role: "cira", text: "Any fever or body aches? 🩺" },
  { role: "user", text: "Yeah, mild fever since last night" },
  { role: "cira", text: "Sounds like an upper respiratory infection. Let me run a quick assessment..." },
  { role: "user", text: "Should I see a doctor?" },
  { role: "cira", text: "Based on your symptoms, rest and fluids should help. I'll flag if anything needs urgent care 💙" },
];

const HeroChatPreview = () => {
  const [visibleMessages, setVisibleMessages] = useState<typeof heroChatMessages>([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgIndex >= heroChatMessages.length) {
      // Pause then restart
      const t = setTimeout(() => {
        setVisibleMessages([]);
        setMsgIndex(0);
      }, 3000);
      return () => clearTimeout(t);
    }
    const delay = heroChatMessages[msgIndex].role === "cira" ? 1200 : 800;
    const t = setTimeout(() => {
      setVisibleMessages(prev => [...prev, heroChatMessages[msgIndex]]);
      setMsgIndex(i => i + 1);
    }, msgIndex === 0 ? 600 : delay);
    return () => clearTimeout(t);
  }, [msgIndex]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleMessages]);

  return (
    <div className="rounded-xl border border-border bg-card p-2.5 shadow-md w-[220px]">
      <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border/30">
        <img src={ciraLogo} alt="Cira" className="w-5 h-5 rounded-full" />
        <span className="text-[10px] font-semibold text-foreground font-heading">Cira</span>
        <span className="ml-auto text-[8px] text-emerald-500 font-medium flex items-center gap-0.5"><span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" /> Online</span>
      </div>
      <div ref={scrollRef} className="space-y-1.5 h-[90px] overflow-hidden">
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`animate-fade-in ${msg.role === "user" ? "flex justify-end" : ""}`}>
            <div className={`px-2.5 py-1.5 text-[11px] font-body leading-relaxed max-w-[90%] rounded-lg ${msg.role === "cira" ? "bg-primary/5 rounded-tl-none text-foreground" : "bg-primary/10 rounded-tr-none text-foreground"
              }`}>
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
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement>(null);
  const [heroMessage, setHeroMessage] = useState("");

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

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={pageRef} className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between pl-3 pr-6 sm:pl-4 lg:pl-6 py-5 max-w-full lg:max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <HamburgerMenu />
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Beta</span>
        </div>
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
                aria-label="Go to dashboard"
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
            Login
          </button>
        )}
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col justify-center items-center" style={{ minHeight: "calc(100vh - 68px)" }}>
        {/* Tag + H1 */}
        <div className="text-center mb-2 sm:mb-3 animate-fade-in">
          <div className="inline-flex items-center justify-center gap-2 mb-3.5 sm:mb-4 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur shadow-sm">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-body tracking-widest uppercase bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              ✦ Face Vital Scan
            </span>
            <span className="w-px h-3 bg-border" />
            <span className="inline-flex items-center gap-1 text-[11px] font-bold font-body tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              HIPAA Compliant
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl md:text-[56px] font-semibold text-foreground leading-[1.1] tracking-tight">
            Your vitals in 30 seconds.<br /><span className="text-primary">Just your face.</span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-muted-foreground text-center leading-relaxed mb-4 sm:mb-6 font-body max-w-md mx-auto animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Heart rate, blood pressure, HRV and 30+ clinical vitals — measured from a 30-second face scan. Then chat with Cira about the results.
        </p>

        {/* Two columns: Face Scan (primary) + Chat (secondary) */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 mb-4 sm:mb-6 w-full max-w-3xl">
          {/* Face scan — primary, larger */}
          <div className="flex flex-col items-center gap-2 animate-fade-in order-1" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={faceNormal} alt="Face scan" className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg" />
                <span className="absolute -bottom-1.5 -right-1.5 bg-card border border-border text-[9px] sm:text-[10px] font-body text-muted-foreground px-1.5 py-0.5 rounded-full shadow">You</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                <span className="text-[9px] text-muted-foreground font-body">30s</span>
              </div>
              <div className="relative">
                <img src={faceHeatmap} alt="Vitals heatmap" className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover shadow-lg ring-2 ring-primary/30" />
                <span className="absolute -bottom-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] sm:text-[10px] font-body px-1.5 py-0.5 rounded-full shadow font-medium">30+ vitals</span>
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-foreground font-body font-semibold tracking-wide">Face Vital Scan <span className="text-muted-foreground font-normal">— real clinical vitals in 30s</span></p>
          </div>

          {/* Chat preview — secondary, smaller */}
          <div className="animate-fade-in order-2" style={{ animationDelay: "0.5s" }}>
            <HeroChatPreview />
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 animate-slide-up" style={{ animationDelay: "0.6s" }}>
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={() => navigate("/vitals-scan")}
              className="px-8 sm:px-10 py-3 sm:py-3.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm sm:text-base font-medium font-body hover:opacity-90 active:scale-95 sm:hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
            >
              <span>📸</span> Start Free Face Scan →
            </button>
            <button
              onClick={handleAskCira}
              className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-full border border-border bg-card/60 backdrop-blur text-foreground text-sm sm:text-base font-medium font-body hover:bg-card active:scale-95 transition-all duration-200"
            >
              Or chat with Cira
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] sm:text-[11px] text-muted-foreground font-body">
            <span>⏱ 30 seconds</span>
            <span>🩺 Clinical-grade</span>
            <span>🔒 HIPAA compliant</span>
            <span>⚡ No signup</span>
            <span>🆓 Free</span>
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════════════════ */}
      {/* MULTI-LANGUAGE */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          Talk to Cira in your language.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          Cira understands and replies in 30+ languages —<br />
          so you can describe how you feel in the words that come naturally.
        </p>

        {/* Language chips */}
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
          "Health is personal. Cira meets you in your own words."
        </p>
      </section>


      {/* ═══════════════════════════════════════════ */}
      {/* CIRA'S INTELLIGENCE */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-card py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[40px] font-semibold text-foreground leading-tight mb-6">
            Cira doesn't guess.<br />
            She thinks.
          </h2>

          <div className="max-w-2xl mx-auto mb-10 sm:mb-14 font-body text-sm sm:text-base text-muted-foreground leading-relaxed space-y-4">
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
          <div className="scroll-fade border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-2xl mx-auto text-left mb-6">
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
      <section className="bg-background py-12 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[40px] font-semibold text-foreground leading-tight mb-6">
            The scan is not an estimate.<br />
            It's clinical technology.
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 sm:mb-14 font-body">
            The face scan powering Cira uses clinically validated health monitoring technology with signal fusion — beat-by-beat blending of rPPG and rBCG signals, selecting the strongest data from each source in real time. The result: consistent accuracy across all skin tones, all lighting conditions, and all devices.
          </p>

          {/* Four proof numbers */}
          <div className="scroll-fade grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto mb-14">
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
            <h3 className="font-heading text-[22px] sm:text-[28px] font-semibold text-foreground leading-tight">
              Proven accurate in clinical studies.
            </h3>
            <p className="text-sm text-muted-foreground font-body mt-2">
              Blood pressure accuracy improved 20% in the elevated range (140–170 mmHg).<br />
              Body composition accuracy improved 45% with retrained models on millions of samples.
            </p>
          </div>

          <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm overflow-x-auto max-w-2xl mx-auto mb-4">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">Metric</th>
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">Time</th>
                  <th className="text-left px-3 sm:px-5 py-3 text-muted-foreground font-medium text-xs sm:text-sm">Accuracy</th>
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
            Source: SDK 3.0 clinical validation studies
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
          <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm p-8 max-w-2xl mx-auto text-center mb-6">
            <p className="text-base text-foreground font-body leading-relaxed mb-4 italic">
              "This technology helped us become the<br />
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
      <section id="scan" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16">
        <div className="text-center">
          <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6">
            See what your body is actually saying.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8 font-body whitespace-pre-line">
            {"Cira uses clinically validated camera technology\nto read 30+ vital signs from your face in 30 seconds.\n\nBlood pressure. Heart rate. HRV.\nStress index. Breathing rate.\nNo hardware. No wearables.\nJust your camera."}
          </p>
          <button
            onClick={() => navigate("/vitals-scan")}
            onMouseEnter={() => { try { fetch("/wasm/shenai_sdk.wasm", { priority: "high" as any, credentials: "omit" }); } catch { } }}
            onTouchStart={() => { try { fetch("/wasm/shenai_sdk.wasm", { priority: "high" as any, credentials: "omit" }); } catch { } }}
            className="bg-primary text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body mb-3"
          >
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
            alt="Real scan — PULSE 102 bpm, SBP 135 mmHg, DBP 86 mmHg"
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
          <h3 className="scroll-fade font-heading text-[24px] sm:text-[32px] font-semibold text-foreground leading-tight">
            30+ health markers. From your face. In 30 seconds.
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
          Clinically validated · Undergoing EU Medical Device Regulation certification
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* DASHBOARD PREVIEW */}
      {/* ═══════════════════════════════════════════ */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          Every scan saved. Your health history built automatically.
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
        <div className="scroll-fade bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-3xl mx-auto text-left relative">
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

          {/* Dashboard screenshot */}
          <img src={dashboardPreview} alt="Cira Dashboard showing vital signs, health indices, and scan history" className="w-full h-auto" />

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
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[26px] sm:text-[36px] font-semibold text-foreground leading-tight mb-6">
          One click. Your doctor gets everything.
        </h2>

        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-10 font-body">
          Every visit. Every scan. Every result.<br />
          One page. Ready in 30 seconds.
        </p>

        {/* Report card */}
        <div className="scroll-fade bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-8 max-w-2xl mx-auto text-left font-body text-sm">
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
            <p className="text-muted-foreground text-xs">Powered by Cira</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-6 italic font-body">
          "For the first time — arrive at your doctor's with real data in your hands."
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* BOOK A DOCTOR */}
      {/* ═══════════════════════════════════════════ */}
      <section id="doctor" className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 pt-12 sm:pt-16 text-center">
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6">
          See a real doctor. Today. Anywhere.
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
          Licensed physicians · Available globally 24/7
        </p>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FOUNDER TEASER */}
      {/* ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* ABOUT US */}
      {/* ═══════════════════════════════════════════ */}
      <section id="about" className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-xs text-primary font-body mb-4 tracking-wide uppercase text-center">About us</p>
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-6 text-center">
          Your AI health nurse — anytime, anywhere.
        </h2>
        <p className="scroll-fade text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12 font-body text-center">
          askainurse.com is a clinical-grade AI health platform that combines a
          conversational AI nurse with a 60-second face scan. We help you
          understand your vitals, document symptoms, and walk into every
          doctor's appointment prepared — all from your phone.
        </p>

        {/* What we do */}
        <div className="scroll-fade grid sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">01</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Talk to Cira</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Chat with our AI nurse 24/7 in 16+ languages. Describe your
              symptoms, ask health questions, get clinically grounded guidance.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">02</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Scan your vitals</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              A 60-second face scan measures heart rate, blood pressure, HRV,
              stress, breathing, and 10+ other vitals — using your camera only.
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="text-primary font-heading text-xl font-semibold mb-2">03</div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-2">Get a real report</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              Receive a downloadable clinical PDF with your vitals, AI
              assessment, and recommendations — ready to share with your doctor.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="scroll-fade bg-muted/30 rounded-2xl p-6 sm:p-10 mb-10">
          <h3 className="font-heading text-xl sm:text-2xl font-semibold text-foreground mb-6 text-center">
            How it works
          </h3>
          <div className="space-y-4 max-w-2xl mx-auto text-sm sm:text-base font-body text-muted-foreground leading-relaxed">
            <p>
              <span className="text-foreground font-medium">1. Open Cira</span> — no app
              download. Works in your browser on any phone or laptop.
            </p>
            <p>
              <span className="text-foreground font-medium">2. Face scan</span> — our
              clinically validated rPPG technology (the same signal-fusion approach used in
              hospital studies) reads your vitals from subtle skin-color changes captured by
              your camera. 100% on-device — no video leaves your phone.
            </p>
            <p>
              <span className="text-foreground font-medium">3. AI consultation</span> —
              Cira analyzes your vitals alongside your symptoms, asks the right follow-up
              questions, and provides a structured clinical assessment.
            </p>
            <p>
              <span className="text-foreground font-medium">4. Doctor-ready report</span> —
              every consultation generates a PDF report you can save, track over time, or
              share with a licensed physician through our doctor network.
            </p>
          </div>
        </div>

        <p className="scroll-fade text-xs text-muted-foreground text-center max-w-2xl mx-auto mb-6 font-body">
          Cira is an AI health nurse — not a replacement for a licensed doctor.
          For emergencies, always call your local emergency services.
        </p>

        <div className="text-center">
          <button
            onClick={() => navigate("/our-story")}
            className="text-primary text-sm font-body hover:underline transition-colors"
          >
            Read our founder's story →
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* FAQ */}
      {/* ═══════════════════════════════════════════ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-xs text-primary font-body mb-4 tracking-wide uppercase text-center">FAQ</p>
        <h2 className="scroll-fade font-heading text-[28px] sm:text-[38px] font-semibold text-foreground leading-tight mb-10 text-center">
          Frequently asked questions.
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
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <button onClick={() => navigate("/")} className="flex items-center gap-2 mb-4">
                <img src={ciraLogo} alt="Cira" width={28} height={28} />
                <span className="font-heading text-lg font-semibold text-foreground">Cira</span>
              </button>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                Your AI health nurse — clinically validated vitals, available anytime.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">How it works</button></li>
                <li><button onClick={() => navigate("/technology")} className="text-muted-foreground hover:text-primary transition-colors">Technology</button></li>
                <li><button onClick={() => navigate("/what-cira-helps-with")} className="text-muted-foreground hover:text-primary transition-colors">What Cira helps with</button></li>
                <li><button onClick={() => navigate("/pricing")} className="text-muted-foreground hover:text-primary transition-colors">Pricing</button></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/real-doctors")} className="text-muted-foreground hover:text-primary transition-colors">Real doctors</button></li>
                <li><button onClick={() => navigate("/blog")} className="text-muted-foreground hover:text-primary transition-colors">Blog</button></li>
                <li><a href="mailto:hello@askainurse.com" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm">
                <li><button onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-primary transition-colors">Security &amp; Privacy</button></li>
                <li><button onClick={() => navigate("/privacy-policy")} className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">Terms</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>© 2026 Cira · askainurse.com</p>
            <p className="text-center md:text-right">
              Clinically validated vitals · Licensed physicians ·{" "}
              <span className="italic">Cira does not replace professional medical advice.</span>
            </p>
          </div>
        </div>
      </footer>
      <ConsentBanner />
    </div>
  );
};

export default Index;
