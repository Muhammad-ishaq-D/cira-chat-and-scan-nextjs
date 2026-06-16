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
import { SITE_URL, OG_IMAGE, prerenderRoutes as ROUTES } from "../src/config/seo.data.mjs";

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
  // display:none keeps it fully invisible to users (no flash on any route,
  // including unprerendered ones like /refund and /payment-success that fall
  // back to index.html). A <noscript> override re-shows it for non-JS crawlers.
  return (
    `<noscript><style>#seo-prerender{display:block!important;position:static!important}</style></noscript>` +
    `<div id="seo-prerender" style="display:none" aria-hidden="true">` +
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
