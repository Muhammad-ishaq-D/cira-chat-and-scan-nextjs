import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import {
  MessageSquare,
  Stethoscope,
  ShieldCheck,
  Clock,
  HeartPulse,
  Brain,
  Thermometer,
  Activity,
  AlertCircle,
  Pill,
} from "lucide-react";

const commonSymptoms = [
  { icon: Thermometer, label: "Fever & chills" },
  { icon: Brain, label: "Headache & migraine" },
  { icon: Activity, label: "Chest pain or palpitations" },
  { icon: HeartPulse, label: "Shortness of breath" },
  { icon: AlertCircle, label: "Abdominal pain" },
  { icon: Pill, label: "Medication side effects" },
];

const steps = [
  {
    icon: MessageSquare,
    title: "Describe what you feel",
    text: "Type your symptoms in plain language — no medical jargon needed. Cira asks clarifying questions like a nurse would.",
  },
  {
    icon: Stethoscope,
    title: "Get a structured assessment",
    text: "Cira reviews onset, severity, history and risk factors, then summarizes the likely causes and red flags to watch for.",
  },
  {
    icon: ShieldCheck,
    title: "Know your next step",
    text: "Self-care at home, see a primary care doctor, or seek urgent care. Clear guidance, no guessing.",
  },
];

const faqs = [
  {
    q: "Is the AI symptom checker really free?",
    a: "Yes. You can start a free symptom assessment with Cira without signing up. Free chats include guided triage and clear next-step guidance.",
  },
  {
    q: "How accurate is an AI symptom checker?",
    a: "Cira uses a clinically structured intake (onset, severity, associated symptoms, history, red flags) modeled on nurse triage protocols. It is not a diagnosis — it is decision support to help you decide whether to self-care, see a doctor, or seek urgent care.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Conversations are encrypted in transit and never sold. You can use Cira anonymously without an account.",
  },
  {
    q: "When should I go to the ER instead of using a symptom checker?",
    a: "If you have chest pain, sudden severe headache, trouble breathing, weakness on one side, fainting, severe bleeding, or any life-threatening symptom — call your local emergency number immediately. Cira will also flag these red flags during triage.",
  },
];

const SymptomChecker = () => {
  const navigate = useNavigate();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Cira Free AI Symptom Checker",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: "https://askainurse.com/symptom-checker",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      description:
        "Free AI symptom checker. Describe your symptoms and get nurse-style triage with clear next-step guidance.",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <SEO
        title="Free AI Symptom Checker — Cira AI Nurse"
        description="Free AI symptom checker. Describe your symptoms and get nurse-style triage, likely causes, and clear next-step guidance in minutes."
        path="/symptom-checker"
        jsonLd={jsonLd}
      />
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
            Start free chat
          </button>
        </nav>

        <header className="max-w-4xl mx-auto px-6 pt-12 pb-16 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-body mb-6">
            Free AI Symptom Checker
          </p>
          <h1 className="font-heading text-[44px] md:text-[64px] font-semibold text-foreground leading-[1.05] mb-6">
            Check your symptoms with an AI nurse — free.
          </h1>
          <p className="font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Describe what you're feeling in plain language. Cira asks the right
            follow-up questions, summarizes likely causes, and tells you whether
            to self-care, see a doctor, or seek urgent care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/free-chat")}
              className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-body text-sm hover:opacity-90 transition-opacity"
            >
              Start free symptom check
            </button>
            <button
              onClick={() => navigate("/how-it-works")}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors px-4 py-3"
            >
              How it works →
            </button>
          </div>
          <p className="text-xs text-muted-foreground/80 mt-6 italic max-w-xl mx-auto">
            Cira is an AI nurse for decision support, not a substitute for
            professional medical diagnosis. In an emergency, call your local
            emergency number.
          </p>
        </header>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-3 text-center">
            What you can check
          </h2>
          <p className="font-body text-muted-foreground text-center max-w-2xl mx-auto mb-12">
            Common symptoms people bring to Cira — from everyday concerns to
            warning signs that need a doctor.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {commonSymptoms.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-3 p-5 rounded-2xl border border-border/60 bg-card/40"
              >
                <Icon className="w-5 h-5 text-primary shrink-0" />
                <span className="font-body text-sm text-foreground">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-12 text-center">
            How the symptom checker works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="p-6 rounded-2xl border border-border/60 bg-card/40">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-body text-muted-foreground">
                    Step {i + 1}
                  </span>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-16 border-t border-border/60">
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-10 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.q} className="p-6 rounded-2xl border border-border/60 bg-card/40">
                <h3 className="font-heading text-base font-semibold text-foreground mb-2">
                  {f.q}
                </h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {f.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-border/60">
          <Clock className="w-6 h-6 text-primary mx-auto mb-4" />
          <h2 className="font-heading text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Ready when you are.
          </h2>
          <p className="font-body text-muted-foreground mb-8 max-w-xl mx-auto">
            Anonymous, free, available 24/7. Get a clear next step in minutes.
          </p>
          <button
            onClick={() => navigate("/free-chat")}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-full font-body text-sm hover:opacity-90 transition-opacity"
          >
            Start free symptom check
          </button>
        </section>
      </div>
    </>
  );
};

export default SymptomChecker;
