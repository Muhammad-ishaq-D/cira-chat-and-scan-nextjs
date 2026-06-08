# Internationalization (i18n)

This project uses **react-i18next** for static UI translations. Languages supported: English (default + fallback), Spanish, German, French.

## File layout

```
src/i18n/index.js              # i18next config + changeLanguage helper
src/i18n/locales/en.json       # source of truth (English)
src/i18n/locales/es.json
src/i18n/locales/de.json
src/i18n/locales/fr.json
src/components/LanguageSwitcher.tsx
```

The selected language is persisted in `localStorage` under the key `cira_lang`
and synced to `<html lang="...">` automatically.

## Strict rule for new UI text

**Never hardcode visible UI text inside React components.** Every new visible
string (buttons, labels, placeholders, menus, toasts, modals, errors, empty
states, page titles, tooltips, footer/header copy, validation messages, etc.)
MUST:

1. Be added as a key to **all four** locale files (`en/es/de/fr`).
2. Use the same key path in every file.
3. Be rendered via `useTranslation`:

```tsx
import { useTranslation } from "react-i18next";

const MyComponent = () => {
  const { t } = useTranslation();
  return <button>{t("common.submit")}</button>;
};
```

English is always the fallback — if a key is missing in `es/de/fr`, the
English value will be shown automatically.

## Chat / AI replies

The user-selected chat language is handled **separately** and is not affected
by this i18n setup. Do not couple the two systems.

## Adding a new language

1. Create `src/i18n/locales/<code>.json` mirroring `en.json` keys.
2. Add it to `resources`, `supportedLngs`, and `SUPPORTED_LANGUAGES` in
   `src/i18n/index.js`.
