import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ciraLogo from "@/assets/cira-logo.svg";
import helpDecide from "@/assets/help-decide.jpg";
import helpRealLife from "@/assets/help-reallife.jpg";
import helpClarity from "@/assets/help-clarity.jpg";
import SEO from "@/components/SEO";
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

const situationIcons = [Stethoscope, AlertCircle, Thermometer, Siren, Pill, HeartHandshake];
const stepIcons = [MessageSquare, Camera, Compass];
const audienceIcons = [Clock, Users, MapPin, Lock, ShieldCheck];

const WhatCiraHelpsWith = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const situations = t("pages.whatCiraHelpsWith.situations", { returnObjects: true }) as { title: string; text: string }[];
  const steps = t("pages.whatCiraHelpsWith.steps", { returnObjects: true }) as { title: string; text: string }[];
  const outcomes = t("pages.whatCiraHelpsWith.outcomes", { returnObjects: true }) as string[];
  const audience = t("pages.whatCiraHelpsWith.audience", { returnObjects: true }) as string[];

  return (
    <>
      <SEO title="What Cira helps with — symptoms & vitals" description="From everyday symptoms to vital signs and chronic risks. See what your AI nurse Cira can help with." path="/what-cira-helps-with" />
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <button onClick={() => navigate("/")} className="flex items-center gap-3">
          <img src={ciraLogo} alt="Cira health logo" width={28} height={28} />
          <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
        </button>
        <button
          onClick={() => navigate("/free-chat")}
          className="text-sm font-body text-foreground hover:text-primary transition-colors"
        >
          {t("pages.whatCiraHelpsWith.navStartFree")}
        </button>
      </nav>

      <header className="max-w-4xl mx-auto px-6 pt-12 pb-20 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-6">{t("pages.whatCiraHelpsWith.heroEyebrow")}</p>
        <h1 className="font-heading text-[44px] md:text-[64px] font-semibold text-foreground leading-[1.05] mb-6">
          {t("pages.whatCiraHelpsWith.heroTitleA")}<br />
          {t("pages.whatCiraHelpsWith.heroTitleB")}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-body leading-relaxed mb-10">
          {t("pages.whatCiraHelpsWith.heroSubtitle")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            onClick={() => navigate("/free-chat")}
            className="bg-foreground text-background py-3.5 px-8 rounded-full text-base font-medium hover:opacity-90 transition-opacity font-body"
          >
            {t("pages.whatCiraHelpsWith.heroCta")}
          </button>
          <p className="text-sm text-muted-foreground font-body">{t("pages.whatCiraHelpsWith.heroCtaSub")}</p>
        </div>

        <div className="mt-16 rounded-3xl overflow-hidden border border-border">
          <img src={helpDecide} alt="Person checking symptoms on their phone while deciding whether to see a doctor" loading="lazy" width={1280} height={800} className="w-full h-auto" />
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">{t("pages.whatCiraHelpsWith.situationsEyebrow")}</p>
          <h2 className="font-heading text-[36px] md:text-[44px] font-semibold text-foreground leading-tight">
            {t("pages.whatCiraHelpsWith.situationsTitleA")}<br />{t("pages.whatCiraHelpsWith.situationsTitleB")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {situations.map((s, i) => {
            const Icon = situationIcons[i];
            return (
              <div
                key={s.title}
                className="border border-border rounded-2xl p-7 bg-card hover:border-primary/40 transition-colors"
              >
                <Icon className="w-6 h-6 text-primary mb-5" />
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">{t("pages.whatCiraHelpsWith.stepsEyebrow")}</p>
            <h2 className="font-heading text-[36px] md:text-[44px] font-semibold text-foreground leading-tight">
              {t("pages.whatCiraHelpsWith.stepsTitleA")}<br />{t("pages.whatCiraHelpsWith.stepsTitleB")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-14">
            {steps.map((s, i) => {
              const Icon = stepIcons[i];
              const n = String(i + 1).padStart(2, "0");
              return (
                <div key={s.title} className="text-left">
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-heading text-4xl font-semibold text-primary/40">{n}</span>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-10 text-center">
            <p className="text-sm text-muted-foreground font-body mb-5">{t("pages.whatCiraHelpsWith.outcomesLabel")}</p>
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

      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div className="rounded-3xl overflow-hidden border border-border">
            <img src={helpRealLife} alt="Parent comforting a sick child at home while consulting an AI health nurse" loading="lazy" width={1280} height={800} className="w-full h-auto" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-4">{t("pages.whatCiraHelpsWith.audienceEyebrow")}</p>
            <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-5">
              {t("pages.whatCiraHelpsWith.audienceTitle")}
            </h2>
            <ul className="space-y-3 mt-8">
              {audience.map((text, i) => {
                const Icon = audienceIcons[i];
                return (
                  <li key={text} className="flex items-start gap-3">
                    <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-base text-foreground font-body">{text}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground font-body italic">
          {t("pages.whatCiraHelpsWith.disclaimer")}
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="rounded-3xl overflow-hidden border border-border mb-10">
          <img src={helpClarity} alt="Calm person reading a clear AI-generated health summary on a laptop" loading="lazy" width={1280} height={800} className="w-full h-auto" />
        </div>
        <h2 className="font-heading text-[40px] md:text-[52px] font-semibold text-foreground leading-tight mb-5">
          {t("pages.whatCiraHelpsWith.ctaTitle")}
        </h2>
        <p className="text-lg text-muted-foreground font-body mb-8">
          {t("pages.whatCiraHelpsWith.ctaSubtitle")}
        </p>
        <button
          onClick={() => navigate("/free-chat")}
          className="bg-foreground text-background py-3.5 px-8 rounded-full text-base font-medium hover:opacity-90 transition-opacity font-body"
        >
          {t("pages.whatCiraHelpsWith.ctaButton")}
        </button>
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>{t("pages.whatCiraHelpsWith.footer1")}</p>
        <p>{t("pages.whatCiraHelpsWith.footer2")}</p>
      </footer>
    </div>
    </>
  );
};

export default WhatCiraHelpsWith;
