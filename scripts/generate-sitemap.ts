import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://askainurse.com";
const API_BASE = process.env.VITE_API_URL || "https://askainurse.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/free-chat", changefreq: "weekly", priority: "0.9" },
  { path: "/symptom-checker", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/how-it-works", changefreq: "monthly", priority: "0.8" },
  { path: "/technology", changefreq: "monthly", priority: "0.7" },
  { path: "/what-cira-helps-with", changefreq: "monthly", priority: "0.7" },
  { path: "/real-doctors", changefreq: "monthly", priority: "0.7" },
  { path: "/our-story", changefreq: "monthly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/login", changefreq: "yearly", priority: "0.5" },
  { path: "/forgot-password", changefreq: "yearly", priority: "0.3" },
  { path: "/reset-password", changefreq: "yearly", priority: "0.3" },
];

async function fetchBlogPosts(): Promise<SitemapEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/api/blogs`);
    if (!res.ok) return [];
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data?.blogs || [];
    return posts
      .filter((p: any) => (p.status ?? "published") === "published")
      .map((p: any) => ({
        path: `/blog/${p.slug}`,
        changefreq: "weekly" as const,
        priority: "0.6",
        lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : undefined,
      }));
  } catch {
    return [];
  }
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const blogEntries = await fetchBlogPosts();
  const entries = [...staticEntries, ...blogEntries];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${entries.length} entries)`);
})();
