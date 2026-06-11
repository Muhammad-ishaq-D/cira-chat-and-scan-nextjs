import { useEffect, useState } from "react";
import { X, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  getConsent,
  hasDecided,
  setConsent,
  OPEN_CONSENT_EVENT,
} from "@/lib/consent";

const ConsentBanner = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [functional, setFunctional] = useState(false);

  useEffect(() => {
    const existing = getConsent();
    if (existing) {
      setAnalytics(existing.analytics);
      setFunctional(existing.functional);
    }
    if (!hasDecided()) setVisible(true);

    const openHandler = () => {
      const cur = getConsent();
      if (cur) {
        setAnalytics(cur.analytics);
        setFunctional(cur.functional);
      }
      setShowDetails(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, openHandler);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, openHandler);
  }, []);

  const acceptAll = () => {
    setConsent({ analytics: true, functional: true });
    setVisible(false);
  };
  const rejectAll = () => {
    setConsent({ analytics: false, functional: false });
    setVisible(false);
  };
  const saveChoices = () => {
    setConsent({ analytics, functional });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("consent.bannerLabel", "Cookie & privacy preferences")}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50"
    >
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur p-4 shadow-xl">
        <div className="flex items-start gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">
              {t("consent.title", "Your privacy")}
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-1">
              {t(
                "consent.message",
                "We use strictly necessary cookies to run Cira, and optional cookies for analytics and saved preferences. You can change your choice anytime from the footer."
              )}{" "}
              <Link to="/privacy-policy" className="underline hover:text-foreground">
                {t("consent.privacyPolicy", "Privacy Policy")}
              </Link>
              .
            </p>
          </div>
          <button
            onClick={rejectAll}
            aria-label={t("common.close", "Close")}
            className="text-muted-foreground hover:text-foreground -mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
        >
          {showDetails
            ? t("consent.hideDetails", "Hide categories")
            : t("consent.customize", "Customize")}
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="mt-3 space-y-2.5 border-t border-border pt-3">
            <CategoryRow
              title={t("consent.cat.necessary.title", "Strictly necessary")}
              desc={t(
                "consent.cat.necessary.desc",
                "Required for login, security and remembering your consent choice. Always on."
              )}
              checked={true}
              disabled
              onChange={() => {}}
            />
            <CategoryRow
              title={t("consent.cat.analytics.title", "Analytics")}
              desc={t(
                "consent.cat.analytics.desc",
                "Anonymous usage stats (Google Analytics) so we can improve the product."
              )}
              checked={analytics}
              onChange={setAnalytics}
            />
            <CategoryRow
              title={t("consent.cat.functional.title", "Functional preferences")}
              desc={t(
                "consent.cat.functional.desc",
                "Remembers your language and UI choices between visits."
              )}
              checked={functional}
              onChange={setFunctional}
            />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={rejectAll}
            className="h-8 px-3 text-xs"
          >
            {t("consent.rejectAll", "Reject all")}
          </Button>
          {showDetails && (
            <Button
              size="sm"
              variant="outline"
              onClick={saveChoices}
              className="h-8 px-3 text-xs"
            >
              {t("consent.savePrefs", "Save choices")}
            </Button>
          )}
          <Button size="sm" onClick={acceptAll} className="h-8 px-3 text-xs">
            {t("consent.acceptAll", "Accept all")}
          </Button>
        </div>
      </div>
    </div>
  );
};

function CategoryRow({
  title,
  desc,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-2 ${disabled ? "opacity-80" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        className="mt-1 accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex-1">
        <span className="block text-[11px] font-semibold text-foreground">{title}</span>
        <span className="block text-[10px] leading-snug text-muted-foreground">{desc}</span>
      </span>
    </label>
  );
}

export default ConsentBanner;
