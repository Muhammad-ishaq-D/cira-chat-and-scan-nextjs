## The problem

The language switcher itself works — it persists the choice and updates `i18n.language`. The issue is that the new landing-page sections we added recently (hero, mockup, pricing matrix, UGC testimonials, Clinical Resource Guides, Clinical Science & Agent Architecture, Ethical Manifesto, footer CTA, FAQ) were written with hardcoded English strings instead of `t("...")` calls. So changing language updates the "EN/ES/DE/FR" indicator and the menu/footer that already use `t()`, but the main landing copy stays English.

`src/pages/Index.tsx` is ~780 lines; the four locale files already total ~1.9k lines each. Translating every new block across EN/ES/DE/FR in one pass is large and risks introducing JSON typos. I'll do it in focused phases.

## Plan

### Phase 1 — Wire Index.tsx to i18n (this turn)

1. Extract every visible hardcoded string in `src/pages/Index.tsx` into a new namespace `home.*` inside `src/i18n/locales/en.json` (hero headlines, sub-headline, description, primary/secondary CTAs, trust strip, phone-mockup badges, pricing matrix rows + fine print, "Powered by" line, UGC section, Informed Care cards, Clinical Science block + trust badges, Ethical Manifesto quote/attribution, dark conversion footer with €10 / €39 buttons, FAQ Q&A).
2. Replace those literals in `Index.tsx` with `t("home.…")` using the existing `useTranslation()` hook (already imported elsewhere on the page — confirm and add if missing).
3. Keep markup, classes, icons, ordering unchanged — text-only swap.

### Phase 2 — Translate to ES / DE / FR (next turn after you confirm Phase 1 looks right in English)

1. Mirror the new `home.*` keys into `es.json`, `de.json`, `fr.json` with native translations matching tone (clinical, minimal, no marketing fluff per project memory).
2. Spot-check by toggling the switcher on `/` and verifying hero + pricing + manifesto render correctly in each language without layout breakage (longer German strings are the main risk; we'll tighten any wraps).

### Out of scope

- Other pages (Pricing, PrescriptionRefill, HowItWorks, etc.) — they already largely use `t()`. If you spot specific untranslated strings there, call them out and I'll fold them in.
- No visual / structural changes to the landing page.

## Technical notes

- New keys live under a single `home` object in each locale to keep diffs reviewable.
- Use interpolation (`{{price}}`) for the €10 / €39 figures so the pricing source of truth stays one place.
- After Phase 1 the page will display correctly in English (identical output) and will show English fallback in ES/DE/FR until Phase 2 lands — `fallbackLng: "en"` is already configured, so nothing breaks.
