import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

const STORAGE_KEY = "cira_lang";
const SUPPORTED = ["en", "es", "de", "fr"];

// Map IANA timezone region -> language code. Used as a fallback when the
// browser language alone doesn't tell us enough (e.g. user has English OS
// but lives in Spain).
const TIMEZONE_LANG_MAP = {
  // Spanish-speaking regions
  "Europe/Madrid": "es",
  "America/Mexico_City": "es",
  "America/Argentina/Buenos_Aires": "es",
  "America/Bogota": "es",
  "America/Lima": "es",
  "America/Santiago": "es",
  "America/Caracas": "es",
  "America/Montevideo": "es",
  "America/Asuncion": "es",
  "America/La_Paz": "es",
  "America/Guayaquil": "es",
  "America/Costa_Rica": "es",
  "America/Panama": "es",
  "America/El_Salvador": "es",
  "America/Guatemala": "es",
  "America/Tegucigalpa": "es",
  "America/Managua": "es",
  "America/Havana": "es",
  "America/Santo_Domingo": "es",
  // German-speaking regions
  "Europe/Berlin": "de",
  "Europe/Vienna": "de",
  "Europe/Zurich": "de",
  "Europe/Luxembourg": "de",
  // French-speaking regions
  "Europe/Paris": "fr",
  "Europe/Brussels": "fr",
  "Europe/Monaco": "fr",
  "Africa/Abidjan": "fr",
  "Africa/Dakar": "fr",
  "Africa/Algiers": "fr",
  "Africa/Tunis": "fr",
  "Africa/Casablanca": "fr",
  "America/Montreal": "fr",
};

const detectRegionLang = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_LANG_MAP[tz] || null;
  } catch {
    return null;
  }
};

// Custom detector: localStorage -> navigator language -> timezone region -> en
const customDetector = {
  name: "ciraAutoDetect",
  lookup() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved.split("-")[0])) {
        return saved.split("-")[0];
      }
    } catch {}

    if (typeof navigator !== "undefined") {
      const langs = [
        ...(navigator.languages || []),
        navigator.language,
      ].filter(Boolean);
      for (const l of langs) {
        const base = l.split("-")[0].toLowerCase();
        if (SUPPORTED.includes(base)) return base;
      }
    }

    const region = detectRegionLang();
    if (region) return region;

    return "en";
  },
  cacheUserLanguage(lng) {
    try {
      localStorage.setItem(STORAGE_KEY, lng);
    } catch {}
  },
};

const detector = new LanguageDetector();
detector.addDetector(customDetector);

i18n
  .use(detector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED,
    interpolation: { escapeValue: false },
    detection: {
      order: ["ciraAutoDetect"],
      caches: ["ciraAutoDetect"],
    },
  });

// Keep <html lang="..."> in sync.
const applyHtmlLang = (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = (lng || "en").split("-")[0];
  }
};
applyHtmlLang(i18n.language);
i18n.on("languageChanged", applyHtmlLang);

export const changeLanguage = (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {}
  return i18n.changeLanguage(lng);
};

export default i18n;
