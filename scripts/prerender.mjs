#!/usr/bin/env node
/**
 * Post-build prerender:
 *   - serves dist/ on a local port
 *   - launches headless Chromium
 *   - visits each route, waits for hydration, captures rendered HTML
 *   - writes dist/<route>/index.html so static hosting serves prerendered HTML
 *     that the client then hydrates.
 */
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

// Read route list from package.json -> "prerender": { "routes": [...] }
const pkg = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));
const routes = pkg.prerender?.routes ?? ["/"];

// Sanity: dist exists
try {
  await fs.access(distDir);
} catch {
  console.error("[prerender] dist/ not found — run `vite build` first.");
  process.exit(1);
}

// Start static file server with SPA fallback to index.html
const server = http.createServer((req, res) =>
  handler(req, res, {
    public: distDir,
    rewrites: [{ source: "**", destination: "/index.html" }],
  }),
);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
const origin = `http://127.0.0.1:${port}`;
console.log(`[prerender] serving ${distDir} on ${origin}`);

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const results = [];
try {
  for (const route of routes) {
    const url = origin + route;
    const page = await browser.newPage();
    // Mark that this is a prerender pass so app code can opt-out of side effects
    await page.evaluateOnNewDocument(() => {
      window.__PRERENDER__ = true;
    });
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: 45_000 });
      // Give React a tick to flush any post-mount effects
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 50))),
      );
      const html = await page.content();

      // Write to dist/<route>/index.html (root → dist/index.html)
      const cleanRoute = route.replace(/^\/+/, "").replace(/\/+$/, "");
      const outDir = cleanRoute ? path.join(distDir, cleanRoute) : distDir;
      await fs.mkdir(outDir, { recursive: true });
      const outFile = path.join(outDir, "index.html");
      await fs.writeFile(outFile, html, "utf8");

      const bodyLen = html.length;
      results.push({ route, ok: true, bytes: bodyLen, outFile });
      console.log(`[prerender] ✓ ${route}  (${bodyLen} bytes → ${path.relative(root, outFile)})`);
    } catch (err) {
      results.push({ route, ok: false, error: String(err) });
      console.error(`[prerender] ✗ ${route}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}

const failed = results.filter((r) => !r.ok);
if (failed.length) {
  console.error(`[prerender] ${failed.length} route(s) failed`);
  process.exit(1);
}
console.log(`[prerender] done — ${results.length} routes prerendered`);
