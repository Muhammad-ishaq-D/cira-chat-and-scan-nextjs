// Build-time prerender for public marketing routes.
// After Vite builds dist/index.html, this plugin emits dist/<route>/index.html
// for each public route with route-specific <title>, meta, canonical, og:*
// and a static SEO content block injected INSIDE <div id="root">.
//
// Why: this is a CSR React SPA. Non-JS crawlers (LinkedIn, Slack, Facebook,
// Bing first pass, many AI bots) only see the static HTML and would otherwise
// find an empty <div id="root">. With this plugin they see real HTML; React
// replaces the static block on hydration for normal users.

import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://askainurse.com";
const OG_IMAGE = "https://askainurse.com/og-image.jpg";

/**
 * Per-route static SEO content. Keep concise — this is the fallback HTML for
 * non-JS crawlers. React replaces it on mount, so styling is irrelevant.
 */
const ROUTES = [
  {
    path: "/",
    title: "Cira — your AI health nurse, anytime",
    description:
      "Talk to Cira, your AI nurse. Ask health questions, scan vitals with your camera, and get clear next steps.",
    h1: "Your AI health nurse, anytime",
    body: [
      "Cira is an AI nurse that helps you understand symptoms and check your vital signs from any device with a camera. Chat about how you feel and get clear, clinical-grade next steps in minutes — no appointment required.",
      "Run a 30-second face scan to measure heart rate, blood pressure, HRV, breathing rate, stress and wellness score using rPPG technology. Then ask follow-up questions through the AI symptom checker, or escalate to a licensed doctor when human care is needed.",
    ],
  },
  {
    path: "/pricing",
    title: "Cira pricing — plans for everyone",
    description:
      "Simple, transparent pricing for Cira. Start free, upgrade for unlimited chat and vital scans.",
    h1: "Pricing — free to start, simple to upgrade",
    body: [
      "Cira's Free plan includes AI nurse chat and one free vitals face scan per device. No credit card required.",
      "Premium unlocks unlimited AI nurse chat, unlimited vital scans, detailed health reports and prescription refill assistance. A Family plan covers up to 5 members under a single monthly subscription.",
    ],
  },
  {
    path: "/how-it-works",
    title: "How Cira works — chat, scan, guidance",
    description:
      "Talk to your AI nurse, scan vitals with your camera, and get clear next steps. See how Cira works.",
    h1: "How Cira works",
    body: [
      "Step 1 — Chat. Tell Cira how you feel in natural language. The AI nurse asks targeted clinical questions and builds a structured picture of your symptoms.",
      "Step 2 — Scan. Hold your phone or laptop camera up to your face for 30 seconds. Cira's rPPG technology measures heart rate, blood pressure, HRV and breathing rate — all processed on-device, no video uploaded.",
      "Step 3 — Guidance. Cira summarises findings, suggests next steps, and connects you to a licensed doctor when human care is recommended.",
    ],
  },
  {
    path: "/technology",
    title: "Cira technology — clinical-grade AI",
    description:
      "rPPG vitals, neural 3D face tracking, and peer-reviewed validation. The clinical tech powering Cira.",
    h1: "The clinical technology behind Cira",
    body: [
      "Cira combines remote photoplethysmography (rPPG) and ballistocardiography (rBCG) to extract heart rate, HRV, blood pressure and breathing rate from a 30-second face video.",
      "A neural 3D face-tracking model isolates skin pixels and removes motion artefacts. A 7-component Estimation Quality Index validates every reading. Accuracy has been peer-reviewed and validated across 33 countries.",
      "All face processing runs on-device — no video ever leaves your browser.",
    ],
  },
  {
    path: "/symptom-checker",
    title: "AI symptom checker — Cira",
    description:
      "Describe your symptoms and get instant AI-nurse guidance on possible causes and next steps.",
    h1: "AI symptom checker",
    body: [
      "Describe what you're feeling in your own words. Cira's AI nurse asks targeted clinical questions, narrows down possible causes, and explains which next steps to take — from rest at home to seeing a doctor today.",
      "Built on clinical guidelines and reviewed by licensed physicians. Free to use, no signup required for your first chat.",
    ],
  },
  {
    path: "/what-cira-helps-with",
    title: "What Cira helps with — symptoms & vitals",
    description:
      "From everyday symptoms to vital signs and chronic risks. See what your AI nurse Cira can help with.",
    h1: "What Cira can help you with",
    body: [
      "Everyday symptoms — headaches, fevers, coughs, digestive issues, sleep problems, anxiety, fatigue and more. Cira's AI nurse asks the right questions and explains likely causes.",
      "Vital signs — heart rate, blood pressure, heart rate variability (HRV), breathing rate, stress index, wellness score and vascular age, all from a 30-second face scan.",
      "Chronic risk markers — cardiovascular risk, hypertension risk and metabolic indicators, helping you spot issues early.",
    ],
  },
  {
    path: "/real-doctors",
    title: "Real doctors network — Cira",
    description:
      "Connect with licensed doctors through Cira when you need human care beyond your AI nurse.",
    h1: "Connect with real, licensed doctors",
    body: [
      "When your AI nurse consultation suggests you need human care, Cira connects you to a global network of licensed doctors for video and chat consultations.",
      "Doctors review your AI nurse summary and vital scan results before the call, so consultations start with full context.",
    ],
  },
  {
    path: "/our-story",
    title: "Our story — why we built Cira",
    description:
      "From a Bangkok blood pressure scare to a global AI health nurse. The founder story behind Cira.",
    h1: "Our story",
    body: [
      "Cira started with a 135/86 blood pressure reading on a face scan in Bangkok — a wake-up call that good health intelligence shouldn't depend on having a clinic nearby.",
      "We built Cira to give everyone, everywhere, an AI nurse they can talk to and a 30-second vital scan they can run from any phone — clinical-grade, private, and free to start.",
    ],
  },
  {
    path: "/free-chat",
    title: "Free AI health chat — no signup",
    description:
      "Ask Cira your health questions for free. Get AI nurse guidance instantly with no account required.",
    h1: "Free AI nurse chat — no signup needed",
    body: [
      "Ask Cira any health question for free. Get instant guidance from an AI nurse trained on clinical guidelines — no account, no credit card.",
      "Want to go deeper? Run a 30-second vitals face scan or upgrade for unlimited consultations and detailed reports.",
    ],
  },
];

/** Replace or insert a meta tag in the head HTML by attribute selector. */
function setMeta(html, attr, value, content) {
  const re = new RegExp(
    `<meta\\s+${attr}=["']${value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}["'][^>]*>`,
    "i",
  );
  const newTag = `<meta ${attr}="${value}" content="${escapeAttr(content)}">`;
  if (re.test(html)) return html.replace(re, newTag);
  return html.replace(/<\/head>/i, `    ${newTag}\n  </head>`);
}

function setTitle(html, title) {
  if (/<title>[^<]*<\/title>/i.test(html)) {
    return html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeText(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `    <title>${escapeText(title)}</title>\n  </head>`);
}

function setCanonical(html, url) {
  const tag = `<link rel="canonical" href="${escapeAttr(url)}">`;
  if (/<link\s+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link\s+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`);
}

function injectRootContent(html, contentHtml) {
  return html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${contentHtml}</div>`,
  );
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function escapeText(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildSeoBlock(route) {
  const paragraphs = route.body.map((p) => `<p>${escapeText(p)}</p>`).join("");
  const nav = ROUTES.filter((r) => r.path !== route.path)
    .map((r) => `<a href="${r.path}">${escapeText(r.title)}</a>`)
    .join(" · ");
  // Wrapped in a comment-flagged container so React's mount cleanly replaces it.
  // No inline styling — visible briefly before hydration on slow connections.
  return (
    `<div id="seo-prerender">` +
    `<h1>${escapeText(route.h1)}</h1>` +
    paragraphs +
    `<nav aria-label="Site links">${nav}</nav>` +
    `</div>`
  );
}

function buildRouteHtml(baseHtml, route) {
  const url = `${SITE_URL}${route.path}`;
  let html = baseHtml;
  html = setTitle(html, route.title);
  html = setMeta(html, "name", "description", route.description);
  html = setCanonical(html, url);
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", OG_IMAGE);
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  html = setMeta(html, "name", "twitter:image", OG_IMAGE);
  html = injectRootContent(html, buildSeoBlock(route));
  return html;
}

export default function prerenderPlugin() {
  return {
    name: "lovable-prerender",
    apply: "build",
    async closeBundle() {
      const outDir = path.resolve(process.cwd(), "dist");
      const indexPath = path.join(outDir, "index.html");
      let baseHtml;
      try {
        baseHtml = await fs.readFile(indexPath, "utf8");
      } catch {
        // No dist/index.html — nothing to prerender (e.g. lib build).
        return;
      }

      for (const route of ROUTES) {
        const html = buildRouteHtml(baseHtml, route);
        if (route.path === "/") {
          // Overwrite the root index.html with the homepage prerender.
          await fs.writeFile(indexPath, html, "utf8");
        } else {
          const dir = path.join(outDir, route.path.replace(/^\//, ""));
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
        }
      }

      // eslint-disable-next-line no-console
      console.log(
        `[prerender] wrote ${ROUTES.length} route HTML files into dist/`,
      );
    },
  };
}
