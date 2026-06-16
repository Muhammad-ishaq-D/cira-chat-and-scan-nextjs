// Typed re-export of the canonical SEO config.
//
// The actual data lives in `src/config/seo.data.mjs` so the Vite build plugin
// (`scripts/prerender-plugin.mjs`) can import the exact same strings without a
// TypeScript loader. Never define route titles/descriptions in two places —
// edit the .mjs file, and TS callers stay in sync automatically.

// @ts-ignore — plain ESM module without .d.ts; shared with the prerender plugin.
import { SITE_URL as _SITE_URL, OG_IMAGE as _OG_IMAGE, seoConfig as _seoConfig } from "./seo.data.mjs";

export interface RouteSEO {
  title: string;
  description: string;
  noindex?: boolean;
  prerender?: boolean;
  h1?: string;
  body?: string[];
  jsonLd?: Record<string, any> | Record<string, any>[];
}

export const SITE_URL: string = _SITE_URL;
export const OG_IMAGE: string = _OG_IMAGE;
export const seoConfig: Record<string, RouteSEO> = _seoConfig;

export const getRouteSEO = (path: string): RouteSEO | undefined =>
  seoConfig[path];
