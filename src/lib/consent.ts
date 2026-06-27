/**
 * GDPR consent management.
 * Single source of truth for what categories the user has agreed to.
 *
 * Categories:
 *  - necessary  → always true (auth, security, consent record itself)
 *  - analytics  → Google Analytics gtag
 *  - functional → language pref, UI prefs persisted across sessions
 *
 * Storage: localStorage key `cira_consent_v2`. Bumping CONSENT_VERSION
 * re-prompts every user.
 */

export const CONSENT_VERSION = 2;
const STORAGE_KEY = "cira_consent_v2";
export const OPEN_CONSENT_EVENT = "cira:open-consent";
export const CONSENT_CHANGED_EVENT = "cira:consent-changed";

export interface ConsentRecord {
  version: number;
  decidedAt: number;
  necessary: true;
  analytics: boolean;
  functional: boolean;
}

export function getConsent(): ConsentRecord | null {
  try {
    const raw = globalThis?.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed?.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function hasDecided(): boolean {
  return getConsent() !== null;
}

export function setConsent(opts: { analytics: boolean; functional: boolean }) {
  const record: ConsentRecord = {
    version: CONSENT_VERSION,
    decidedAt: Date.now(),
    necessary: true,
    analytics: !!opts.analytics,
    functional: !!opts.functional,
  };
  try {
    globalThis?.localStorage?.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {}

  applyToGoogleConsentMode(record);

  // Sync consent record to backend audit log (endpoint is live)
  try {
    import("./apiClient").then(({ gdprApi }) => {
      gdprApi.recordConsent(record).catch(() => {});
    });
  } catch {}

  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: record }));
}

export function revokeConsent() {
  try { globalThis?.localStorage?.removeItem(STORAGE_KEY); } catch {}
  applyToGoogleConsentMode(null);
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: null }));
}

export function openConsentBanner() {
  window.dispatchEvent(new CustomEvent(OPEN_CONSENT_EVENT));
}

/**
 * Push Google Consent Mode v2 update so gtag respects the user's choice.
 * The default state is set in index.html to "denied" before gtag loads.
 */
function applyToGoogleConsentMode(record: ConsentRecord | null) {
  const w = window as any;
  if (typeof w.gtag !== "function") return;
  const granted = record?.analytics ? "granted" : "denied";
  try {
    w.gtag("consent", "update", {
      analytics_storage: granted,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: record?.functional ? "granted" : "denied",
      personalization_storage: record?.functional ? "granted" : "denied",
      security_storage: "granted",
    });
  } catch {}
}

/** Call once on app start to sync stored consent into Google Consent Mode. */
export function initConsentSync() {
  const record = getConsent();
  if (record) applyToGoogleConsentMode(record);
}
