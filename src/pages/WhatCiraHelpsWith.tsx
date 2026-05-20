import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";
import LandingMenu from "@/components/LandingMenu";
import helpDecide from "@/assets/help-decide.jpg";
import helpRealLife from "@/assets/help-reallife.jpg";
import helpClarity from "@/assets/help-clarity.jpg";
import {
  Stethoscope,
  AlertCircle,
  Thermometer,
  Siren,
  Pill,
  HeartHandshake,
  ShieldCheck,
  Clock,
  MapPin,
  Lock,
  Users,
  MessageSquare,
  Camera,
  Compass,
} from "lucide-react";

const situations = [
  { icon: Stethoscope, title: "Should I see a doctor?", text: "Not every symptom needs a visit. Cira helps you decide." },
  { icon: AlertCircle, title: "Something feels off", text: "You don't know what it is — but you know it's not normal." },
  { icon: Thermometer, title: "I feel sick", text: "Cold, fever, fatigue — understand what's happening." },
  { icon: Siren, title: "Is this urgent?", text: "Know when to act immediately — and when you can wait." },
  { icon: Pill, title: "Medication questions", text: "Side effects, interactions, or uncertainty — get clarity." },
  { icon: HeartHandshake, title: "I just want reassurance", text: "Sometimes you just need to know you're okay." },
];

const steps = [
  { n: "01", icon: MessageSquare, title: "Tell Cira what's going on", text: "Describe how you feel, in your own words." },
  { n: "02", icon: Camera, title: "Optional: scan your vitals", text: "A 30-second face scan adds context." },
  { n: "03", icon: Compass, title: "Get a clear direction", text: "Know exactly what to do next." },
];

const outcomes = ["Self-care", "Monitor", "See a doctor", "Urgent care"];

const audiences = [
  { icon: Clock, text: "Busy people who don't have time to wait" },
  { icon: Users, text: "Parents who need quick guidance" },
  { icon: MapPin, text: "People without easy access to healthcare" },
  { icon: Lock, text: "People who prefer privacy" },
  { icon: ShieldCheck, text: "Anyone who wants clarity before acting" },
];

const WhatCiraHelpsWith = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-1">
          <LandingMenu />
          <button onClick={() => navigate("/")} className="flex items-center gap-3">
            <img src={ciraLogo} alt="Cira" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          </button>
        </div>
        <button
          onClick={() => navigate("/free-chat")}
          className="text-sm font-body text-foreground hover:text-primary transition-colors"
        >
          Start free →
        </button>
      </nav>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-12 pb-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-6">What Cira helps with</p>
        <h1 className="font-heading text-[44px] md:text-[64px] font-semibold text-foreground leading-[1.05] mb-6">
          When something feels off,<br />
          Cira helps you decide what to do next.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed mb-10">
          Not sure if it's serious? Wondering if you should see a doctor? Cira helps you understand your situation in
          minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => navigate("/free-chat")}
            className="bg-foreground text-background py-3.5 px-8 rounded-full text-base font-medium hover:opacity-90 transition-opacity font-body"
          >
            Start your check
          </button>
          <p className="text-sm text-muted-foreground font-body">No signup · Free · Private</p>
        </div>

        <div className="mt-16 rounded-3xl overflow-hidden border border-border">
          <img src={helpDecide} alt="" loading="lazy" width={1280} height={800} className="w-full h-auto" />
        </div>
      </header>

      {/* Situations */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">Real situations, real answers</p>
          <h2 className="font-heading text-[36px] md:text-[44px] font-semibold text-foreground leading-tight">
            Whatever is on your mind,<br />Cira meets you there.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {situations.map((s) => (
            <div
              key={s.title}
              className="border border-border rounded-2xl p-7 bg-card hover:border-primary/40 transition-colors"
            >
              <s.icon className="w-6 h-6 text-primary mb-5" />
              <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">Simple. Fast. Clear.</p>
            <h2 className="font-heading text-[36px] md:text-[44px] font-semibold text-foreground leading-tight">
              Three steps. A few minutes.<br />Real direction.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {steps.map((s) => (
              <div key={s.n} className="text-left">
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="font-heading text-4xl font-semibold text-primary/40">{s.n}</span>
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-10 text-center">
            <p className="text-sm text-muted-foreground font-body mb-5">Every check ends with one of these</p>
            <div className="flex flex-wrap justify-center gap-3">
              {outcomes.map((o) => (
                <span
                  key={o}
                  className="px-5 py-2 rounded-full bg-background border border-border text-sm font-body text-foreground"
                >
                  {o}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Made for real life */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="rounded-3xl overflow-hidden border border-border">
            <img src={helpRealLife} alt="" loading="lazy" width={1280} height={800} className="w-full h-auto" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">Made for real life</p>
            <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-5">
              Cira fits the moments when you can't drop everything to figure things out.
            </h2>
            <ul className="space-y-3 mt-8">
              {audiences.map((a) => (
                <li key={a.text} className="flex items-start gap-3">
                  <a.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-base text-foreground font-body">{a.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground font-body italic">
          Cira doesn't replace doctors. It helps you decide when you actually need one.
        </p>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="rounded-3xl overflow-hidden border border-border mb-10">
          <img src={helpClarity} alt="" loading="lazy" width={1280} height={800} className="w-full h-auto" />
        </div>
        <h2 className="font-heading text-[40px] md:text-[52px] font-semibold text-foreground leading-tight mb-5">
          Ready when you are.
        </h2>
        <p className="text-lg text-muted-foreground font-body mb-8">
          A few minutes today can save hours of worry.
        </p>
        <button
          onClick={() => navigate("/free-chat")}
          className="bg-foreground text-background py-3.5 px-8 rounded-full text-base font-medium hover:opacity-90 transition-opacity font-body"
        >
          Start your check
        </button>
      </section>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>Cira does not replace professional medical advice.</p>
        <p>© 2026 Cira — askainurse.com</p>
      </footer>
    </div>
  );
};

export default WhatCiraHelpsWith;
