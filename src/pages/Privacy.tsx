import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Lock, EyeOff, Cpu, KeyRound, Users, Mail, FileText, Stethoscope, Trash2, CheckCircle2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ciraLogo from "@/assets/cira-logo.svg";
import LandingMenu from "@/components/LandingMenu";
import talkImg from "@/assets/privacy-talk.jpg";
import scanImg from "@/assets/privacy-scan.jpg";
import nextImg from "@/assets/privacy-next.jpg";

const principles = [
  { icon: EyeOff, label: "No raw face video storage" },
  { icon: Trash2, label: "Face images deleted after processing" },
  { icon: Cpu, label: "On-device scan processing where possible" },
  { icon: Lock, label: "Encrypted in transit and at rest" },
  { icon: KeyRound, label: "Access limited by MFA and roles" },
];

const protections = [
  { icon: Cpu, title: "On-device processing", body: "Shen AI runs on your device where possible to extract vitals, so raw camera frames don't need to leave your phone." },
  { icon: Lock, title: "Encryption in transit", body: "Your data is protected while it travels between your device and our servers using modern transport encryption." },
  { icon: ShieldCheck, title: "Encryption at rest", body: "Information stored on our infrastructure is encrypted, so it isn't readable in raw form." },
  { icon: KeyRound, title: "MFA & role-based access", body: "Internal access requires multi-factor authentication and is limited to specific roles that need it." },
  { icon: Users, title: "Least-privilege philosophy", body: "We design access so people and systems only see what they need, and we review this regularly." },
];

const collectCards = [
  { img: talkImg, eyebrow: "Conversation", title: "What you tell us in chat", body: "Health questions, symptoms, and the context you choose to share so Cira can give relevant guidance." },
  { img: scanImg, eyebrow: "Face scan", title: "Vitals from your face scan", body: "Metrics like heart rate signals estimated from a short Shen AI face scan, used to build a clearer picture of your health." },
  { img: nextImg, eyebrow: "Next step", title: "Only what's needed", body: "We follow a minimum-necessary principle: we collect what helps you decide what to do next — nothing more." },
];

const dontKeep = [
  { title: "No raw face video stored", body: "The video from your camera is never written to our storage." },
  { title: "Image data deleted after processing", body: "Once vitals are computed, the underlying image data is discarded." },
  { title: "No facial recognition profile", body: "We do not build a facial template, and we do not use your face to identify you." },
];

const useFor = [
  "Run your conversation and the face-scan experience",
  "Generate personalized health insights and next-step guidance",
  "Connect you, when you ask, to Air Doctor's network of licensed physicians",
];

const dontDo = [
  "We do not sell your health data.",
  "We do not use your data to train generic, public AI models.",
  "We do not reuse your data for new purposes without clear notice and consent.",
];

const faqs = [
  { q: "Do you store my face or scan video?", a: "No. The video stream from your camera is processed to compute vitals and is never written to our storage." },
  { q: "What happens to my scan after I'm done?", a: "Vitals are computed on-device where possible, then the underlying image data is discarded. Only the resulting metrics are kept with your account." },
  { q: "What exactly do you collect when I use Cira?", a: "The chat content you share, the vitals derived from your face scan, and basic account information needed to operate the service." },
  { q: "Do you sell my data?", a: "No. We do not sell your health data to advertisers, brokers, or any third parties." },
  { q: "Do you use my data to train AI?", a: "We do not use your data to train generic, public AI models. Any improvements to Cira's reasoning happen under strict internal controls." },
  { q: "Can I use Cira without creating an account?", a: "Yes — guest mode lets you try a limited experience without an account. Saving reports and history requires sign-up." },
  { q: "Can I delete my data?", a: "Yes. You can request deletion of your data and account at any time by contacting our privacy team." },
  { q: "Who can access my information?", a: "A small number of authorized staff with multi-factor authentication and role-based access, only when necessary to operate or support the service." },
  { q: "How does Air Doctor fit into my privacy?", a: "Air Doctor is the licensed physician network used when you choose to see a real doctor. We share only the information necessary for that visit, under appropriate safeguards." },
  { q: "Are you HIPAA, GDPR, or SOC 2 certified?", a: "Specific certifications and frameworks will be listed here once confirmed. We'd rather wait than overclaim." },
];

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-1">
          <LandingMenu />
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <img src={ciraLogo} alt="Cira" width={24} height={24} />
          <span className="font-heading text-base font-semibold text-foreground">Cira</span>
        </button>
      </nav>

      <header className="max-w-4xl mx-auto px-6 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[11px] tracking-wide uppercase text-muted-foreground mb-6">
          <ShieldCheck className="w-3.5 h-3.5" /> Security & Privacy Hub
        </div>
        <h1 className="font-heading text-4xl md:text-6xl font-semibold text-foreground leading-[1.05] mb-5">
          Your health data, <em className="italic text-primary">protected by design.</em>
        </h1>
        <p className="font-body text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Cira combines advanced medical reasoning with camera-based vitals from a short face scan.
          The whole system is built so your information stays yours — private, secured, and under your control.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#use" className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition">
            How we use your data
          </a>
          <a href="#contact" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition">
            Contact our privacy team
          </a>
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
          {principles.map(({ icon: Icon, label }) => (
            <li key={label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80">
              <Icon className="w-3.5 h-3.5 text-primary" />
              {label}
            </li>
          ))}
        </ul>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">What we collect</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Only what helps you decide what to do next.
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-[15px] leading-relaxed">
            To give you useful guidance, Cira needs a small, focused set of information. Here's exactly what that looks like.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {collectCards.map((c) => (
            <article key={c.title} className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
              <div className="aspect-[4/3] overflow-hidden bg-secondary">
                <img
                  src={c.img}
                  alt={c.title}
                  width={768}
                  height={512}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                />
              </div>
              <div className="p-6 flex-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary mb-2">{c.eyebrow}</p>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">{c.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">What we don't keep</p>
            <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4">
              We don't keep <em className="italic text-primary">your face.</em>
            </h2>
            <p className="text-muted-foreground font-body text-[15px] leading-relaxed">
              The face scan is a measurement tool, not an identity record. Frames are processed to compute your vitals
              and then discarded. Nothing is added to a facial database or identity profile.
            </p>
          </div>
          <ul className="space-y-4">
            {dontKeep.map((d) => (
              <li key={d.title} className="rounded-xl border border-border bg-card p-5 flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <EyeOff className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">{d.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{d.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">How Cira protects your data</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Layered protection, in plain language.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {protections.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="use" className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">How your information is used</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Used to help you. <em className="italic text-primary">Not sold. Not hidden.</em>
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-[15px] leading-relaxed">
            Your information powers Cira's guidance in the moment, and — only when you choose — the connection to a
            real doctor through Air Doctor's global network.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">We use your data to:</h3>
            <ul className="space-y-3">
              {useFor.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-foreground/90">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/40 p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">What we don't do:</h3>
            <ul className="space-y-3">
              {dontDo.map((line) => (
                <li key={line} className="flex gap-3 text-sm text-foreground/90">
                  <span className="w-4 h-4 rounded-full border border-foreground/40 shrink-0 mt-0.5 flex items-center justify-center text-foreground/60 text-[10px]">×</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Retention & deletion</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Honest about what we're <em className="italic text-primary">still finalizing.</em>
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-[15px] leading-relaxed">
            We are finalizing our detailed retention and deletion schedule and will publish it here, rather than over-promising.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { title: "Retention period", tag: "[To be confirmed]", body: "How long different types of data are kept will be published here." },
            { title: "Deletion process", tag: "[To be confirmed]", body: "The exact steps and timeline for deleting your data on request." },
            { title: "Your rights", tag: "Request access, correction, or deletion", body: "You will be able to ask us to access, correct, or delete the data you've shared." },
          ].map((r) => (
            <div key={r.title} className="rounded-2xl border border-dashed border-border bg-card p-6">
              <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{r.title}</h3>
              <p className="text-xs uppercase tracking-wide text-primary mb-3">{r.tag}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Compliance & partners</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Built with <em className="italic text-primary">trusted partners.</em>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-dashed border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Compliance status</h3>
            <p className="text-xs uppercase tracking-wide text-primary mb-3">[To be confirmed]</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Specific frameworks and certifications will be listed here once confirmed. We'd rather wait than overclaim.
            </p>
          </div>
          <div className="rounded-2xl border border-dashed border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold text-foreground mb-1">Infrastructure & subprocessors</h3>
            <p className="text-xs uppercase tracking-wide text-primary mb-3">[To be confirmed]</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A full list of vendors and subprocessors that help operate Cira will be published here.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-gradient-to-br from-secondary/60 to-card p-6 md:p-8 flex gap-5 items-start">
          <span className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Stethoscope className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-heading text-xl font-semibold text-foreground">Air Doctor — 20,000+ doctors in 180 countries</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Air Doctor operates the licensed physician network used when you choose to see a real doctor. Cira shares
              only the information necessary for that visit, under appropriate safeguards. Your medical conversation in
              Cira stays separate from advertising or third-party resale.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">FAQ — Privacy first</p>
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Straight answers to <em className="italic text-primary">the questions that matter.</em>
          </h2>
        </div>
        <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`} className="border-0 px-5">
              <AccordionTrigger className="text-left font-heading text-base text-foreground hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed font-body">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section id="contact" className="max-w-6xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
            Talk to us. <em className="italic text-primary">We'll respond.</em>
          </h2>
          <p className="mt-4 text-muted-foreground font-body text-[15px] leading-relaxed">
            Privacy is a relationship, not a checkbox. Reach out anytime — we welcome questions and feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="font-heading text-lg font-semibold text-foreground">Security contact</h3>
            <p className="text-sm text-primary mt-1">[security@ — to be confirmed]</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">For responsible disclosure of security issues.</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Mail className="w-5 h-5" />
            </span>
            <h3 className="font-heading text-lg font-semibold text-foreground">Privacy contact</h3>
            <p className="text-sm text-primary mt-1">[privacy@ — to be confirmed]</p>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">For data, retention, or deletion questions.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          <button onClick={() => navigate("/privacy-policy")} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FileText className="w-3.5 h-3.5" /> Privacy Policy [TBC]
          </button>
          <button onClick={() => navigate("/terms")} className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors">
            <FileText className="w-3.5 h-3.5" /> Terms of Service [TBC]
          </button>
        </div>
      </section>

      <footer className="max-w-4xl mx-auto px-6 pb-12 pt-6 text-center text-xs text-muted-foreground">
        © 2026 Cira — askainurse.com
      </footer>
    </div>
  );
};

export default Privacy;
