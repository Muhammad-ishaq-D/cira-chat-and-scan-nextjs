import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
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

  const dataMatrix = [
    { service: "Rapid Prescription Refill", who: "Licensed VeryPatient GP", sla: "Under 2 hours", deliverable: "Signed e-prescription (PDF)", price: "€10.00" },
    { service: "Video Doctor Consultation", who: "VeryPatient Specialist", sla: "Same day · 20 min slot", deliverable: "HD video + treatment plan", price: "€39.00" },
    { service: "Sick Leave Certificate", who: "Licensed VeryPatient GP", sla: "Under 3 hours", deliverable: "Signed work certificate", price: "€10.00" },
    { service: "Lab Result Interpretation", who: "VeryPatient Specialist", sla: "Same day", deliverable: "Written clinical report", price: "€19.00" },
    { service: "Specialist Referral Letter", who: "Licensed VeryPatient GP", sla: "Under 4 hours", deliverable: "Signed referral letter", price: "€15.00" },
  ];

  const faqs = [
    { q: "Are the doctors real and licensed?", a: "Yes. Every clinician fulfilling on Cira Health is a registered medical doctor within the VeryPatient private network, verifiable by ORDOMED registration number listed on their profile." },
    { q: "Is the €10 prescription refill price final?", a: "Yes. €10.00 fixed, all-inclusive. No subscription, no consultation surcharge, no pharmacy markup. You pay only if a clinician approves and signs your refill." },
    { q: "What happens if a doctor cannot approve my refill?", a: "You are refunded 100% within minutes. We never charge for an unfulfilled clinical decision." },
    { q: "How fast is the 2-hour window enforced?", a: "Internal SLA. 96.2% of refills are signed in under 90 minutes during European working hours, with overnight queue picked up at 06:30 CET." },
    { q: "Is my data sold or shared?", a: "Never. Clinical records are encrypted at rest, stored within EU jurisdiction, and accessible only to the assigned VeryPatient clinician for the duration of your case." },
    { q: "Can I use this instead of my regular GP?", a: "Cira Health is a complement, not a replacement, for ongoing primary care. It is built for acute, time-sensitive, transactional medical needs." },
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
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> VeryPatient Network
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
                Patient Login
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
                  Live · Doctors signing prescriptions now
                </span>
              </div>
              <h1 className="font-heading text-4xl sm:text-6xl md:text-[64px] font-semibold text-foreground leading-[1.05] tracking-tight mb-5">
                Real Medical Care.<br />
                <span className="text-primary">In Under 2 Hours.</span>
              </h1>
              <p className="font-body text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto lg:mx-0">
                A digital medical clinic clinically fulfilled by the <strong className="text-foreground">VeryPatient</strong> private network of registered European physicians.
                Signed prescriptions, video consultations, and clinical documents — delivered with a fixed price and a 2-hour SLA.
              </p>
            </div>

            {/* RIGHT: phone mockup */}
            <div className="relative flex justify-center lg:justify-end pb-8 lg:pb-0">
              {/* Patient lifestyle card layered behind */}
              <div className="absolute -bottom-2 left-4 sm:left-12 lg:-left-8 w-40 h-52 sm:w-44 sm:h-56 rounded-2xl overflow-hidden border border-border shadow-xl bg-card rotate-[-6deg] z-0">
                <img
                  src="/patient-phone.jpg"
                  alt="Patient smiling during a seamless consultation on her phone"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Smartphone frame */}
              <div className="relative z-10 w-[260px] sm:w-[300px] bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
                <div className="relative bg-background rounded-[2rem] overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-foreground rounded-b-2xl z-20" />
                  <img
                    src="/doctor-portrait.jpg"
                    alt="Licensed VeryPatient doctor in a white coat with a stethoscope"
                    className="w-full aspect-[9/19] object-cover"
                    loading="eager"
                  />
                </div>
              </div>

              {/* Badge 1: active doctor status */}
              <div className="absolute top-6 -left-2 sm:left-0 lg:-left-10 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border shadow-lg">
                <span className="text-[11px] font-semibold font-body text-foreground whitespace-nowrap">🟢 Dr. Jean-Marc, MD — Active Now</span>
              </div>

              {/* Badge 2: SLA refill verified */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground shadow-lg">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold font-body tracking-wide whitespace-nowrap">⏰ 2-Hour SLA Refill Verified</span>
              </div>
            </div>
          </div>

          {/* DUAL CONVERSION CARDS */}
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {/* €10 Rapid Refill */}
            <article className="group relative bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold tracking-wider uppercase">
                <Clock className="w-3 h-3" /> 2hr SLA
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Pill className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-1.5">Rapid Prescription Refill</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                Out of your medication? A VeryPatient GP reviews your case and dispatches a signed e-prescription to your pharmacy. Fixed price, no surprises.
              </p>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-semibold text-foreground">€10</span>
                    <span className="font-body text-xs text-muted-foreground">.00 fixed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">Refunded if not approved</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-body">
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Signed by MD</div>
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> PDF + pharmacy</div>
                </div>
              </div>
              <button
                onClick={() => openFunnel("refill")}
                className="w-full px-6 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Request €10 Refill Now ➔
              </button>
            </article>

            {/* €39 Video Consult */}
            <article className="group relative bg-card border border-border rounded-2xl p-7 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold tracking-wider uppercase">
                <Video className="w-3 h-3" /> Same Day
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-2xl font-semibold text-foreground mb-1.5">Video Doctor Consultation</h2>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
                Face-to-face 20-minute video appointment with a licensed VeryPatient specialist. Diagnosis, treatment plan, and follow-up document included.
              </p>
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-heading text-4xl font-semibold text-foreground">€39</span>
                    <span className="font-body text-xs text-muted-foreground">.00 fixed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body mt-0.5">20-minute HD session</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground font-body">
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Specialist match</div>
                  <div className="flex items-center gap-1 justify-end"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Treatment plan</div>
                </div>
              </div>
              <button
                onClick={() => openFunnel("consult")}
                className="w-full px-6 py-3.5 rounded-full bg-foreground text-background text-sm font-semibold font-body hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Book €39 Video Consult ➔
              </button>
            </article>
          </div>

          {/* Telemetry strip */}
          <div className="mt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">
                <Activity className="w-3 h-3 text-primary" /> Refills today
              </div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">{scansToday.toLocaleString()}</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">
                <Clock className="w-3 h-3 text-primary" /> Avg fulfillment
              </div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">{avgFulfillment} min</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Approval rate</div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">96.2%</div>
            </div>
            <div className="bg-card/60 border border-border rounded-xl px-4 py-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-body mb-1">Network MDs</div>
              <div className="font-heading text-xl font-semibold text-foreground tabular-nums">312</div>
            </div>
          </div>
        </header>

        {/* 3-STEP PROCESS */}
        <section className="bg-card/40 border-y border-border/60 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 max-w-2xl mx-auto">
              <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">The Clinical Workflow</p>
              <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                Three steps. One signed document. Zero waiting rooms.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { n: "01", title: "Submit your case in 90 seconds", body: "Pick your service, describe your symptoms or prescription, and upload any prior medical document. The intake is structured for clinical review.", icon: FileText },
                { n: "02", title: "A VeryPatient MD reviews your file", body: "A real licensed European physician — not an AI — reviews, validates, and signs your prescription or treatment plan. Average review window: under 90 minutes.", icon: Stethoscope },
                { n: "03", title: "Signed document arrives in your inbox", body: "PDF e-prescription delivered to you and forwarded directly to your chosen pharmacy. Fully traceable, legally valid across the EU.", icon: CheckCircle2 },
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
            <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">The VeryPatient Clinical Roster</p>
            <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-3">
              Every case is signed by a registered European physician.
            </h2>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              No anonymous AI signatures, no offshore call centers. Each clinician below holds an active ORDOMED registration, verifiable on request.
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
                <p className="text-[11px] text-muted-foreground font-body">{d.city} · {d.years} yrs practice</p>
              </div>
            ))}
          </div>
        </section>

        {/* DATA MATRIX TABLE */}
        <section className="bg-card/40 border-y border-border/60 py-16 sm:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <p className="text-xs text-primary font-body tracking-widest uppercase mb-3">Service · SLA · Price Matrix</p>
              <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight">
                Fixed pricing. Documented SLAs. No subscriptions.
              </h2>
            </div>
            <div className="scroll-fade bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-body">
                  <thead className="bg-muted/40 text-foreground">
                    <tr className="text-left">
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Service</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Fulfilled by</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">SLA</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider">Deliverable</th>
                      <th className="px-5 py-4 font-semibold text-xs uppercase tracking-wider text-right">Fixed Price</th>
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
              All prices in EUR, VAT inclusive. Charged only upon clinical approval. Refunded automatically if a clinician declines.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-xs text-primary font-body mb-4 tracking-widest uppercase text-center">Patient FAQ</p>
          <h2 className="scroll-fade font-heading text-3xl sm:text-4xl font-semibold text-foreground leading-tight mb-10 text-center">
            Clear answers, no clinical jargon.
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

        {/* FINAL CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="bg-foreground text-background rounded-3xl p-10 sm:p-14 text-center">
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold leading-tight mb-3">
              A real doctor. A signed prescription. Under 2 hours.
            </h2>
            <p className="font-body text-sm sm:text-base opacity-80 max-w-xl mx-auto mb-7">
              Skip the waiting room. Pay one fixed price. Get a clinically valid document delivered to your inbox today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => openFunnel("refill")} className="px-8 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all">
                Get €10 Prescription Refill
              </button>
              <button onClick={() => openFunnel("consult")} className="px-8 py-3.5 rounded-full bg-background/10 border border-background/30 text-background text-sm font-semibold font-body hover:bg-background/20 transition-all">
                Book €39 Video Consult
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
                  A digital clinic clinically fulfilled by the VeryPatient registered medical network.
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Clinical Services</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => openFunnel("refill")} className="text-muted-foreground hover:text-primary transition-colors">Prescription Refill — €10</button></li>
                  <li><button onClick={() => openFunnel("consult")} className="text-muted-foreground hover:text-primary transition-colors">Video Consultation — €39</button></li>
                  <li><button onClick={() => navigate("/pricing")} className="text-muted-foreground hover:text-primary transition-colors">Full Pricing Matrix</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Network</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => navigate("/real-doctors")} className="text-muted-foreground hover:text-primary transition-colors">VeryPatient Clinicians</button></li>
                  <li><button onClick={() => navigate("/how-it-works")} className="text-muted-foreground hover:text-primary transition-colors">How it works</button></li>
                  <li><a href="mailto:hello@cirahealth.com" className="text-muted-foreground hover:text-primary transition-colors">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h4>
                <ul className="space-y-2.5 text-sm">
                  <li><button onClick={() => navigate("/privacy")} className="text-muted-foreground hover:text-primary transition-colors">Security</button></li>
                  <li><button onClick={() => navigate("/privacy-policy")} className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</button></li>
                  <li><button onClick={() => navigate("/terms")} className="text-muted-foreground hover:text-primary transition-colors">Terms</button></li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <p>© {new Date().getFullYear()} Cira Health · Fulfilled by VeryPatient SAS</p>
                <LanguageSwitcher />
              </div>
              <p className="text-center md:text-right italic">
                Cira Health is a digital intake clinic. All clinical decisions are made by registered VeryPatient physicians.
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
              {funnelChoice === "refill" ? "Rapid Prescription Refill" : "Video Doctor Consultation"}
            </SheetTitle>
            <SheetDescription className="font-body text-xs text-muted-foreground">
              Fulfilled by a registered VeryPatient physician · Fixed price · Refund if not approved
            </SheetDescription>
          </SheetHeader>

          {/* Funnel state */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[11px] font-body text-muted-foreground">
              {["Intake", "Clinical Review", "Payment"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</span>
                  <span className={i === stepIndex ? "text-foreground font-medium" : ""}>{label}</span>
                  {i < 2 && <span className="w-4 h-px bg-border" />}
                </div>
              ))}
            </div>

            {stepIndex === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">Full legal name</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">
                    {funnelChoice === "refill" ? "Medication name & dosage" : "Reason for consultation"}
                  </label>
                  <textarea rows={3} className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder={funnelChoice === "refill" ? "e.g. Levothyroxine 50mcg, 1 daily" : "e.g. Persistent migraine, 6 days"} />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">Pharmacy / delivery email</label>
                  <input type="email" className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="you@email.com" />
                </div>
                <button onClick={() => setStepIndex(1)} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  Continue to Clinical Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {stepIndex === 1 && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 text-xs font-body text-emerald-600 dark:text-emerald-400 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Matched with a VeryPatient clinician
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
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> Case eligible for clinical review</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> Estimated fulfillment: under 2 hours</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" /> 100% refund if not approved</li>
                </ul>
                <button onClick={() => setStepIndex(2)} className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  Proceed to Secure Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {stepIndex === 2 && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-foreground font-body">Ledger</div>
                  <dl className="divide-y divide-border text-sm font-body">
                    <div className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">Service</dt><dd className="text-foreground font-medium text-right">{funnelChoice === "refill" ? "Rapid Human Doctor Prescription Review" : "Video Doctor Consultation"}</dd></div>
                    <div className="flex justify-between px-4 py-2.5"><dt className="text-muted-foreground">Fulfillment window</dt><dd className="text-foreground font-medium">{funnelChoice === "refill" ? "Under 2 hours" : "Same day · 20 min"}</dd></div>
                    <div className="flex justify-between px-4 py-3 bg-primary/5"><dt className="text-foreground font-semibold">Due now</dt><dd className="text-primary font-heading text-lg font-semibold">{funnelChoice === "refill" ? "€10.00 FIXED" : "€39.00 FIXED"}</dd></div>
                  </dl>
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">Cardholder Name</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="block text-xs font-body font-semibold text-foreground mb-1.5">Credit Card Number</label>
                  <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="4242 4242 4242 4242" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-body font-semibold text-foreground mb-1.5">Expiry</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="MM / YY" />
                  </div>
                  <div>
                    <label className="block text-xs font-body font-semibold text-foreground mb-1.5">CVC</label>
                    <input className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-body tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/40" placeholder="123" />
                  </div>
                </div>
                <button className="w-full px-6 py-4 rounded-full bg-primary text-primary-foreground text-base font-semibold font-body hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Lock className="w-4 h-4" /> Complete Secure Clinical Payment — {funnelChoice === "refill" ? "€10" : "€39"}
                </button>
                <p className="text-[11px] text-center text-muted-foreground font-body flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" /> Encrypted · PCI-DSS · Refund automatic if declined
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
