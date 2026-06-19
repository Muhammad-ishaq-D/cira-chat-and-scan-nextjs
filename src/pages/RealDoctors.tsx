import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ArrowRight, Check, Shield, Stethoscope, Globe, Video, MapPin, Sparkles, MessageCircle, Activity } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import handoffImg from "@/assets/doctors-handoff.webp";
import telehealthImg from "@/assets/doctors-telehealth.webp";
import globalImg from "@/assets/doctors-global.webp";
import SEO from "@/components/SEO";

const AIR_DOCTOR_URL = "https://www.air-dr.com/";

const RealDoctors = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const trustChips = t("pages.realDoctors.trustChips", { returnObjects: true }) as string[];

  const flow = [
    { n: "1", title: "Cira chat + face scan", desc: "AI nurse intake + 30s vitals." },
    { n: "2", title: "Structured assessment", desc: "Cira summarises what's going on." },
    { n: "3", title: "\"See a doctor\" recommendation", desc: "Only when human care is appropriate." },
    { n: "4", title: "Air Doctor — tele or in-person", desc: "~20,000 doctors · ~180 countries." },
  ];

  const sampleDoctors = [
    { name: "Dr. Amélie Laurent", spec: "General Practice", mode: "Video", time: "today 18:30", icon: Video },
    { name: "Dr. Tomás Rivera", spec: "Internal Medicine", mode: "In-person", time: "tomorrow 09:00", icon: MapPin },
    { name: "Dr. Hana Okafor", spec: "Family Medicine", mode: "Video", time: "today 21:15", icon: Video },
  ];

  return (
    <>
      <SEO path="/real-doctors" />
    <div className="min-h-screen bg-[#fdfaf3] text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={32} height={32} />
          <span className="text-2xl font-semibold tracking-tight text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>Cira</span>
        </button>
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
          <ArrowLeft size={14} /> {t("pages.back")}
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-5">{t("pages.realDoctors.heroEyebrow")}</p>
            <h1 className="text-4xl md:text-5xl font-light leading-[1.1] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pages.realDoctors.heroTitleA")}<br />
              <span className="italic">{t("pages.realDoctors.heroTitleB")}</span> {t("pages.realDoctors.heroTitleC")}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-lg">
              {t("pages.realDoctors.heroSubtitle")}
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <button onClick={() => document.getElementById("handoff")?.scrollIntoView({ behavior: "smooth" })} className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition">
                {t("pages.realDoctors.heroCta1")} <ArrowRight size={16} />
              </button>
              <a href={AIR_DOCTOR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 h-12 rounded-full border border-stone-300 text-sm font-medium hover:bg-stone-100 transition">
                {t("pages.realDoctors.heroCta2")}
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Shield size={12} /> {trustChips[0]}</span>
              <span className="flex items-center gap-1.5"><Stethoscope size={12} /> {trustChips[1]}</span>
              <span className="flex items-center gap-1.5"><Globe size={12} /> {trustChips[2]}</span>
            </div>
          </div>
          <div className="relative">
            <img src={handoffImg} alt="Licensed clinician" loading="lazy" width={1280} height={896} className="rounded-3xl w-full h-auto object-cover shadow-xl" />
          </div>
        </div>
      </section>

      {/* Flow strip */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-4 gap-4">
          {flow.map((f, i) => (
            <div key={i} className="bg-white border border-stone-200 rounded-2xl p-5 relative">
              <div className="text-xs font-mono text-emerald-600 mb-2">{f.n}.</div>
              <h3 className="font-medium text-sm mb-1.5">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              {i < flow.length - 1 && (
                <ArrowRight size={14} className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 text-stone-300 bg-[#fdfaf3]" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Why this page */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">{t("pages.realDoctors.whyEyebrow")}</p>
          <h2 className="text-3xl md:text-4xl font-light mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t("pages.realDoctors.whyTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("pages.realDoctors.whySubtitle")}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Sparkles, title: "AI nurse first", desc: "Talk to Cira about symptoms, history and goals. Get a structured, clinical-grade view in minutes." },
            { icon: Stethoscope, title: "Real doctors behind it", desc: "When the assessment calls for it, Cira hands you off to licensed doctors via Air Doctor." },
            { icon: Globe, title: "Global access to care", desc: "~20,000 doctors. ~180 countries. Telehealth or in-person, on Air Doctor's platform." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-stone-200 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
                <Icon size={18} />
              </div>
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Step 1 */}
      <section id="handoff" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-emerald-700" /></div>
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                  <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Cira</div>
                  Hi! I'm Cira. What's bothering you today?
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-foreground text-background rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%]">
                  I've had a tight chest and headaches for 3 days.
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Sparkles size={14} className="text-emerald-700" /></div>
                <div className="bg-stone-50 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">
                  <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Cira</div>
                  Thanks for sharing. Let's complete a quick face scan to add objective vitals to your assessment.
                </div>
              </div>
            </div>
            <div className="border border-stone-200 rounded-2xl p-4 flex items-center gap-3 bg-gradient-to-br from-stone-50 to-white">
              <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center"><Activity size={18} /></div>
              <div className="flex-1">
                <div className="text-sm font-medium">Face Vital Scan</div>
                <div className="text-xs text-muted-foreground">30 seconds · 30+ vitals</div>
              </div>
              <span className="text-[10px] text-muted-foreground">Powered by Shen.AI</span>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-3">{t("pages.realDoctors.step1Eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-light mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pages.realDoctors.step1Title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Cira asks about your symptoms, medical history, medications and goals. You can run the Shen.AI face scan to add vitals and objective signals. Together, this builds a structured view of what's going on.
            </p>
            <ul className="space-y-2.5 mb-6">
              {["Conversational nurse-style intake", "30-second face scan for vitals", "Structured clinical summary you can keep"].map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm"><Check size={16} className="text-emerald-600 mt-0.5 shrink-0" /><span>{t}</span></li>
              ))}
            </ul>
            <div className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-xl p-3">
              <strong className="text-amber-900">Important:</strong> Doctor recommendations appear only after you complete the full assessment (chat + scan) — not randomly.
            </div>
          </div>
        </div>
      </section>

      {/* Step 2 */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="md:order-2">
            <img src={telehealthImg} alt="Telehealth consultation" loading="lazy" width={1280} height={896} className="rounded-3xl w-full h-auto object-cover shadow-xl" />
          </div>
          <div className="md:order-1">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-3">{t("pages.realDoctors.step2Eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-light mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pages.realDoctors.step2Title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              If your assessment suggests human care is appropriate, Cira clearly flags it. Cira does not diagnose or prescribe — it tells you when it's safer to involve a real clinician.
            </p>
            <div className="space-y-4 mb-6">
              {[
                { title: "Concerning symptom patterns", desc: "Signals in your chat or scan that warrant professional evaluation rather than self-care." },
                { title: "Chronic condition flare-up", desc: "Changes in a long-term condition that benefit from a clinician's eye and a proper exam." },
                { title: "Medication needs review", desc: "Situations where a prescription, dose change, or safety check requires a licensed doctor." },
              ].map(({ title, desc }) => (
                <div key={title} className="border-l-2 border-emerald-500 pl-4">
                  <div className="text-sm font-medium mb-1">{title}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              This recommendation is not for everyone. It appears only when the AI assessment suggests human care is appropriate — many users simply receive guidance and self-care steps.
            </p>
          </div>
        </div>
      </section>

      {/* Step 3 */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700 mb-3">{t("pages.realDoctors.step3Eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-light mb-5" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pages.realDoctors.step3Title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              When you're ready, Cira sends you to Air Doctor's own platform to book care. You choose telehealth or in-person, in the language and location you need.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { v: "~20,000", l: "Licensed doctors" },
                { v: "~180", l: "Countries covered" },
                { v: "Telehealth", l: "Video consultations", small: true },
                { v: "In-person", l: "Local clinic visits", small: true },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-stone-200 rounded-2xl p-4">
                  <div className={s.small ? "text-base font-medium" : "text-2xl font-bold"} style={!s.small ? { fontFamily: "'Playfair Display', serif" } : {}}>{s.v}</div>
                  <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
                </div>
              ))}
            </div>
            <a href={AIR_DOCTOR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 h-12 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition">
              {t("pages.realDoctors.step3Cta")} <ArrowRight size={16} />
            </a>
          </div>
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-stone-100">
              <div className="text-sm font-medium">{t("pages.realDoctors.availableTitle")}</div>
              <span className="text-[10px] text-muted-foreground">via Air Doctor</span>
            </div>
            <div className="space-y-3">
              {sampleDoctors.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl hover:bg-stone-50 transition">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-medium">
                      {d.name.split(" ")[1][0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{d.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        {d.spec} · <Icon size={11} /> {d.mode} · {d.time}
                      </div>
                    </div>
                    <a href={AIR_DOCTOR_URL} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded-full border border-stone-300 hover:bg-stone-100 transition">{t("pages.realDoctors.bookBtn")}</a>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground italic mt-4 text-center">{t("pages.realDoctors.availableNote")}</p>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Shield, title: "Private by design", desc: "Your conversation with Cira stays yours. No noisy waiting room, no judgment. Designed with privacy-sensitive users in mind." },
            { icon: MessageCircle, title: "Built for chronic & recovery journeys", desc: "Whether you live with a chronic condition or you're navigating recovery, Cira gives discreet guidance and a real escalation path." },
            { icon: Stethoscope, title: "Real, independent clinicians", desc: "Air Doctor's clinicians are independent licensed professionals — not Cira employees. They deliver the medical care." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-stone-200 rounded-2xl p-6">
              <Icon size={20} className="text-emerald-700 mb-4" />
              <h3 className="font-medium mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="rounded-3xl overflow-hidden bg-foreground text-background grid md:grid-cols-2 items-center">
          <img src={globalImg} alt="Global doctor network" loading="lazy" width={1280} height={896} className="w-full h-full object-cover" />
          <div className="p-10 md:p-12">
            <h2 className="text-3xl md:text-4xl font-light mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              {t("pages.realDoctors.finalTitle")}
            </h2>
            <p className="text-sm text-background/70 mb-7 leading-relaxed">
              {t("pages.realDoctors.finalSubtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => navigate("/free-chat")} className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-white text-foreground text-sm font-medium hover:bg-stone-100 transition">
                {t("pages.realDoctors.talkToCira")}
              </button>
              <a href={AIR_DOCTOR_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 h-11 rounded-full border border-white/20 text-sm font-medium hover:bg-white/10 transition">
                {t("pages.realDoctors.bookAir")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2">
        <p className="leading-relaxed">
          {t("pages.realDoctors.footerLegal")}
        </p>
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
    </>
  );
};

export default RealDoctors;
