// Build-time prerender for public marketing routes.
// After Vite builds dist/index.html, this plugin emits dist/<route>/index.html
// for each public route with route-specific <title>, meta, canonical, og:*
// and a static SEO content block injected next to <div id="root">.
//
// Why: this is a CSR React SPA. Non-JS crawlers (LinkedIn, Slack, Facebook,
// Bing first pass, many AI bots) only see the static HTML and would otherwise
// find an empty <div id="root">. With this plugin they see real HTML; React
// replaces the static block on hydration for normal users.

import fs from "node:fs/promises";
import path from "node:path";
import { SITE_URL, OG_IMAGE, sitewideJsonLd, prerenderRoutes as ROUTES } from "../src/config/seo.data.mjs";

const ADMIN_ROUTES = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/activity",
  "/admin/analytics",
  "/admin/billing",
  "/admin/prescription-refills",
  "/admin/referral-letters",
  "/admin/blogs",
  "/admin/settings",
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
  // Inject the SEO block as a SIBLING of #root (not inside it).
  // This guarantees zero visual flash on client-side routes that fall back to
  // this HTML (e.g. /admin/*, /payment-success, /refund): #root starts empty,
  // React mounts instantly, and the SEO block stays display:none for users.
  // Non-JS crawlers still see the content via the <noscript> override inside
  // the block itself.
  return html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root"></div>\n    ${contentHtml}`,
  );
}

function injectJsonLd(html, jsonLd) {
  if (!jsonLd) return html;
  const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const scripts = schemas
    .map(
      (schema) =>
        `    <script type="application/ld+json">${JSON.stringify(schema).replace(/<\//g, "<\\/")}</script>`,
    )
    .join("\n");
  return html.replace(/<\/head>/i, `${scripts}\n  </head>`);
}

function buildAdminShellHtml(baseHtml, routePath) {
  let html = baseHtml;
  html = setTitle(html, "Cira Admin");
  html = setMeta(html, "name", "description", "Cira admin dashboard.");
  html = setCanonical(html, `${SITE_URL}${routePath}`);
  html = setMeta(html, "name", "robots", "noindex,nofollow,noarchive");
  html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>\s*/gi, "");
  html = html.replace(/<div id="seo-prerender"[\s\S]*?<\/div>/gi, "");
  html = html.replace(/<noscript><style>#seo-prerender[\s\S]*?<\/noscript>/gi, "");
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root"></div>');
  return html;
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

  const fallbackScript = `
    <script>
      (function() {
        if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('ReactSnap') > -1) return;
        var currentPath = window.location.pathname;
        if (currentPath.length > 1 && currentPath.endsWith('/')) {
          currentPath = currentPath.slice(0, -1);
        }
        var expectedPath = "${route.path}";
        if (currentPath !== expectedPath) {
          document.write('<style id="spa-fallback-hide">#root { display: none !important; }</style>');
        }
      })();
    </script>
  `;
  if (html.includes('<head>')) {
    html = html.replace('<head>', '<head>' + fallbackScript);
  }

  html = setMeta(html, "name", "description", route.description);
  html = setCanonical(html, url);
  html = setMeta(html, "property", "og:title", route.title);
  html = setMeta(html, "property", "og:description", route.description);
  html = setMeta(html, "property", "og:url", url);
  html = setMeta(html, "property", "og:image", OG_IMAGE);
  html = setMeta(html, "name", "twitter:title", route.title);
  html = setMeta(html, "name", "twitter:description", route.description);
  html = setMeta(html, "name", "twitter:image", OG_IMAGE);
  html = injectJsonLd(html, [...sitewideJsonLd, ...(route.jsonLd ? (Array.isArray(route.jsonLd) ? route.jsonLd : [route.jsonLd]) : [])]);
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

      for (const adminPath of ADMIN_ROUTES) {
        const html = buildAdminShellHtml(baseHtml, adminPath);
        const dir = path.join(outDir, adminPath.replace(/^\//, ""));
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
      }

      // eslint-disable-next-line no-console
      console.log(
        `[prerender] wrote ${ROUTES.length} public route HTML files and ${ADMIN_ROUTES.length} admin shell files into dist/`,
      );
    },
  };
}
