const RELOAD_AT_SUFFIX = ":at";
const RELOAD_PATH_SUFFIX = ":path";
const COI_SERVICE_WORKER_NAME = "coi-serviceworker";

export function getCurrentDocumentPath(): string {
  if (typeof window === "undefined") return "";

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function isDocumentCrossOriginIsolated(): boolean {
  return typeof window !== "undefined" && window.crossOriginIsolated === true;
}

export function hasCoiServiceWorkerController(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  return navigator.serviceWorker.controller?.scriptURL.includes(COI_SERVICE_WORKER_NAME) ?? false;
}

export async function unregisterCoiServiceWorkers(): Promise<boolean> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  const coiRegistrations = registrations.filter((registration) =>
    [registration.active?.scriptURL, registration.waiting?.scriptURL, registration.installing?.scriptURL].some(
      (scriptUrl) => scriptUrl?.includes(COI_SERVICE_WORKER_NAME),
    ),
  );

  if (!coiRegistrations.length) {
    return false;
  }

  await Promise.all(coiRegistrations.map((registration) => registration.unregister()));
  return true;
}

export function markDocumentReload(key: string, path = getCurrentDocumentPath()) {
  if (typeof window === "undefined") return;

  sessionStorage.setItem(`${key}${RELOAD_AT_SUFFIX}`, String(Date.now()));
  sessionStorage.setItem(`${key}${RELOAD_PATH_SUFFIX}`, path);
}

export function hasRecentDocumentReload(key: string, maxAgeMs = 4000, path = getCurrentDocumentPath()): boolean {
  if (typeof window === "undefined") return false;

  const lastReloadAt = Number(sessionStorage.getItem(`${key}${RELOAD_AT_SUFFIX}`) || "0");
  const lastReloadPath = sessionStorage.getItem(`${key}${RELOAD_PATH_SUFFIX}`) || "";

  return lastReloadPath === path && Date.now() - lastReloadAt <= maxAgeMs;
}

export function clearDocumentReload(key: string) {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(`${key}${RELOAD_AT_SUFFIX}`);
  sessionStorage.removeItem(`${key}${RELOAD_PATH_SUFFIX}`);
}