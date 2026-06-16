// Single source of truth for per-route SEO metadata.
// Consumed by:
//   - src/config/seo.ts          → typed re-export used by the <SEO> component
//   - scripts/prerender-plugin.mjs → build-time static HTML per route
//
// Plain .mjs (no TS) so the Vite build plugin can import it directly without
// a TypeScript loader. Keep this file the ONLY place route titles/descriptions
// live — pages should pass only `path` to <SEO> and let the config fill the rest.

export const SITE_URL = "https://askainurse.com";
export const OG_IMAGE = "https://askainurse.com/og-image.jpg";

/**
 * @typedef {Object} RouteSEOEntry
 * @property {string} title           - <title> + og:title + twitter:title (≤60 chars ideal)
 * @property {string} description     - meta description + og:description + twitter:description (≤160 chars ideal)
 * @property {boolean} [noindex]      - true → robots noindex,nofollow; excluded from prerender
 * @property {boolean} [prerender]    - true → emit dist/<path>/index.html with static h1/body
 * @property {string} [h1]            - H1 used in prerendered static content
 * @property {string[]} [body]        - Paragraphs used in prerendered static content
 */

/** @type {Record<string, RouteSEOEntry>} */
export const seoConfig = {
  "/": {
    title: "Cira — your AI health nurse, anytime",
    description:
      "Talk to Cira, your AI nurse. Ask health questions, scan vitals with your camera, and get clear next steps.",
    prerender: true,
    h1: "Your AI health nurse, anytime",
    body: [
      "Cira is an AI nurse that helps you understand symptoms and check your vital signs from any device with a camera. Chat about how you feel and get clear, clinical-grade next steps in minutes — no appointment required.",
      "Run a 30-second face scan to measure heart rate, blood pressure, HRV, breathing rate, stress and wellness score using rPPG technology. Then ask follow-up questions through the AI symptom checker, or escalate to a licensed doctor when human care is needed.",
    ],
  },
  "/free-chat": {
    title: "Free AI health chat — no signup",
    description:
      "Ask Cira your health questions for free. Get AI nurse guidance instantly with no account required.",
    prerender: true,
    h1: "Free AI nurse chat — no signup needed",
    body: [
      "Ask Cira any health question for free. Get instant guidance from an AI nurse trained on clinical guidelines — no account, no credit card.",
      "Want to go deeper? Run a 30-second vitals face scan or upgrade for unlimited consultations and detailed reports.",
    ],
  },
  "/symptom-checker": {
    title: "AI symptom checker — Cira",
    description:
      "Describe your symptoms and get instant AI-nurse guidance on possible causes and next steps.",
    prerender: true,
    h1: "AI symptom checker",
    body: [
      "Describe what you're feeling in your own words. Cira's AI nurse asks targeted clinical questions, narrows down possible causes, and explains which next steps to take — from rest at home to seeing a doctor today.",
      "Built on clinical guidelines and reviewed by licensed physicians. Free to use, no signup required for your first chat.",
    ],
  },
  "/pricing": {
    title: "Pricing — Cira AI health nurse",
    description:
      "Simple plans for AI health chat and camera-based vital scans. Start free, upgrade when you need more.",
    prerender: true,
    h1: "Pricing — free to start, simple to upgrade",
    body: [
      "Cira's Free plan includes AI nurse chat and one free vitals face scan per device. No credit card required.",
      "Premium unlocks unlimited AI nurse chat, unlimited vital scans, detailed health reports and prescription refill assistance. A Family plan covers up to 5 members under a single monthly subscription.",
    ],
  },
  "/how-it-works": {
    title: "How Cira works — chat, scan, guidance",
    description:
      "Talk to your AI nurse, scan vitals with your camera, and get clear next steps. See how Cira works.",
    prerender: true,
    h1: "How Cira works",
    body: [
      "Step 1 — Chat. Tell Cira how you feel in natural language. The AI nurse asks targeted clinical questions and builds a structured picture of your symptoms.",
      "Step 2 — Scan. Hold your phone or laptop camera up to your face for 30 seconds. Cira's rPPG technology measures heart rate, blood pressure, HRV and breathing rate — all processed on-device, no video uploaded.",
      "Step 3 — Guidance. Cira summarises findings, suggests next steps, and connects you to a licensed doctor when human care is recommended.",
    ],
  },
  "/technology": {
    title: "Cira technology — clinical-grade AI",
    description:
      "rPPG vitals, neural 3D face tracking, and peer-reviewed validation. The clinical tech powering Cira.",
    prerender: true,
    h1: "The clinical technology behind Cira",
    body: [
      "Cira combines remote photoplethysmography (rPPG) and ballistocardiography (rBCG) to extract heart rate, HRV, blood pressure and breathing rate from a 30-second face video.",
      "A neural 3D face-tracking model isolates skin pixels and removes motion artefacts. A 7-component Estimation Quality Index validates every reading. Accuracy has been peer-reviewed and validated across 33 countries.",
      "All face processing runs on-device — no video ever leaves your browser.",
    ],
  },
  "/what-cira-helps-with": {
    title: "What Cira helps with — symptoms & vitals",
    description:
      "From everyday symptoms to vital signs and chronic risks. See what your AI nurse Cira can help with.",
    prerender: true,
    h1: "What Cira can help you with",
    body: [
      "Everyday symptoms — headaches, fevers, coughs, digestive issues, sleep problems, anxiety, fatigue and more. Cira's AI nurse asks the right questions and explains likely causes.",
      "Vital signs — heart rate, blood pressure, heart rate variability (HRV), breathing rate, stress index, wellness score and vascular age, all from a 30-second face scan.",
      "Chronic risk markers — cardiovascular risk, hypertension risk and metabolic indicators, helping you spot issues early.",
    ],
  },
  "/real-doctors": {
    title: "Real doctors network — Cira",
    description:
      "Connect with licensed doctors through Cira when you need human care beyond your AI nurse.",
    prerender: true,
    h1: "Connect with real, licensed doctors",
    body: [
      "When your AI nurse consultation suggests you need human care, Cira connects you to a global network of licensed doctors for video and chat consultations.",
      "Doctors review your AI nurse summary and vital scan results before the call, so consultations start with full context.",
    ],
  },
  "/our-story": {
    title: "Our story — why we built Cira",
    description:
      "From a Bangkok blood pressure scare to a global AI health nurse. The founder story behind Cira.",
    prerender: true,
    h1: "Our story",
    body: [
      "Cira started with a 135/86 blood pressure reading on a face scan in Bangkok — a wake-up call that good health intelligence shouldn't depend on having a clinic nearby.",
      "We built Cira to give everyone, everywhere, an AI nurse they can talk to and a 30-second vital scan they can run from any phone — clinical-grade, private, and free to start.",
    ],
  },
  "/blog": {
    title: "Cira blog — AI health & wellbeing",
    description:
      "Articles on AI in healthcare, vital signs, prevention, and using Cira to understand your body better.",
  },
  "/prescription-refill": {
    title: "Prescription Refill — Cira AI Nurse",
    description:
      "Request a prescription refill with Cira. Securely share your medication and history with a licensed doctor through our network.",
  },
  "/referral-letter": {
    title: "Referral Letter — Cira AI Nurse",
    description:
      "Request a referral letter with Cira. Securely share your history and symptoms with a specialist doctor through our network.",
  },
  "/refund": {
    title: "Refund Request — Cira",
    description:
      "Request a refund for your CLINIQUE DE LA BRISEE service within 7 days of issue.",
  },
  "/privacy": {
    title: "Privacy & data protection — Cira",
    description:
      "On-device scans, encryption in transit, MFA access. How Cira keeps your health data private and secure.",
  },
  "/privacy-policy": {
    title: "Privacy policy — Cira",
    description:
      "Cira's privacy policy: what we collect, how we use it, and how we keep your health data secure.",
  },
  "/terms": {
    title: "Terms of service — Cira",
    description:
      "The terms that govern your use of Cira's AI nurse, vital scans, and related services.",
  },
  "/login": {
    title: "Sign in to Cira — your AI health nurse",
    description:
      "Log in or create your Cira account. Chat with an AI nurse, run vital scans, and track your health in one place.",
  },
  "/forgot-password": {
    title: "Forgot password — Cira",
    description:
      "Reset your Cira password. We'll email you a one-time code to securely regain access to your account.",
    noindex: true,
  },
  "/reset-password": {
    title: "Reset password — Cira",
    description:
      "Enter your one-time code and choose a new password to securely restore access to your Cira account.",
    noindex: true,
  },
  "/404": {
    title: "Page not found — Cira",
    description:
      "The page you were looking for doesn't exist. Head back to Cira to talk to your AI nurse.",
    noindex: true,
  },
};

/** Routes flagged for build-time static prerender. */
export const prerenderRoutes = Object.entries(seoConfig)
  .filter(([, v]) => v.prerender && !v.noindex)
  .map(([path, v]) => ({ path, ...v }));
