"use client";

import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from "lucide-react";
import { SUPPORTED_LANGUAGES, changeLanguage } from "@/i18n";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "minimal" | "header";
}

const LanguageSwitcher = ({ className = "", variant = "default" }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const current = (i18n.language || "en").split("-")[0];

  if (variant === "header") {
    return (
      <label
        className={`relative inline-flex items-center gap-1.5 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors cursor-pointer ${className}`}
      >
        <Globe className="w-4 h-4" aria-hidden />
        <span className="sr-only">{t("language.select")}</span>
        <span className="uppercase tracking-wide">{current}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" aria-hidden />
        <select
          aria-label={t("language.select")}
          value={current}
          onChange={(e) => changeLanguage(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <label className={`inline-flex items-center gap-2 text-xs ${className}`}>
      <Globe className="w-3.5 h-3.5 opacity-70" aria-hidden />
      <span className="sr-only">{t("language.select")}</span>
      {variant === "default" && (
        <span className="text-muted-foreground">{t("footer.language")}:</span>
      )}
      <select
        aria-label={t("language.select")}
        value={current}
        onChange={(e) => changeLanguage(e.target.value)}
        className="bg-transparent border border-border/60 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        {SUPPORTED_LANGUAGES.map((l) => (
          <option key={l.code} value={l.code} className="text-foreground">
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
