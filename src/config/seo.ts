// Centralized SEO metadata for public routes.
// The reusable <SEO /> component (src/components/SEO.tsx) reads from here
// when a page doesn't pass an explicit title/description override.

export const SITE_URL = "https://askainurse.com";

export interface RouteSEO {
  title: string;
  description: string;
}

export const seoConfig: Record<string, RouteSEO> = {
  "/": {
    title: "Cira — your AI health nurse, anytime",
    description:
      "Talk to Cira, your AI nurse. Ask health questions, scan vitals with your camera, and get clear next steps.",
  },
  "/free-chat": {
    title: "Free AI health chat — no signup",
    description:
      "Ask Cira your health questions for free. Get AI nurse guidance instantly with no account required.",
  },
  "/symptom-checker": {
    title: "AI symptom checker — Cira",
    description:
      "Describe your symptoms and get instant AI-nurse guidance on possible causes and next steps.",
  },
  "/pricing": {
    title: "Cira pricing — plans for everyone",
    description:
      "Simple, transparent pricing for Cira. Start free, upgrade for unlimited chat and vital scans.",
  },
  "/how-it-works": {
    title: "How Cira works — chat, scan, guidance",
    description:
      "Talk to your AI nurse, scan vitals with your camera, and get clear next steps. See how Cira works.",
  },
  "/technology": {
    title: "Cira technology — clinical-grade AI",
    description:
      "rPPG vitals, neural 3D face tracking, and peer-reviewed validation. The clinical tech powering Cira.",
  },
  "/what-cira-helps-with": {
    title: "What Cira helps with — symptoms & vitals",
    description:
      "From everyday symptoms to vital signs and chronic risks. See what your AI nurse Cira can help with.",
  },
  "/real-doctors": {
    title: "Real doctors network — Cira",
    description:
      "Connect with licensed doctors through Cira when you need human care beyond your AI nurse.",
  },
  "/our-story": {
    title: "Our story — why we built Cira",
    description:
      "From a Bangkok blood pressure scare to a global AI health nurse. The founder story behind Cira.",
  },
  "/blog": {
    title: "Cira blog — AI health & wellbeing",
    description:
      "Articles on AI in healthcare, vital signs, prevention, and using Cira to understand your body better.",
  },
};

export const getRouteSEO = (path: string): RouteSEO | undefined =>
  seoConfig[path];
