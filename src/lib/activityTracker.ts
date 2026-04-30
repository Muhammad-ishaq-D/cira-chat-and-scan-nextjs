/**
 * Activity Tracker — captures full session activity asynchronously.
 *
 * - Generates/persists an anonymous device ID + per-tab session ID
 * - Captures: page views, route changes, clicks, scrolls (throttled),
 *   input focus, visibility changes, session start/end, key custom events
 * - Batches events and flushes every 5s, on visibilitychange (hidden),
 *   on pagehide/beforeunload (using sendBeacon when available)
 * - Fully fire-and-forget — never throws, never blocks UI
 *
 * Backend contract (to implement on askainurse.com):
 *   POST /api/track  body: { events: TrackEvent[] }
 *   GET  /api/admin/activity/sessions?search=&from=&to=
 *   GET  /api/admin/activity/sessions/:sessionId
 *   GET  /api/admin/activity/aggregate
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
const ENDPOINT = `${API_BASE}/api/track`;

const DEVICE_KEY = "cira_device_id";
const SESSION_KEY = "cira_activity_session";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min idle = new session

type TrackEvent = {
  event_type: string;
  page?: string;
  data?: Record<string, any>;
  ts: number; // ms epoch
  session_id: string;
  device_id: string;
  user_id?: string | null;
  referrer?: string;
};

let queue: TrackEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let initialized = false;
let lastScrollTrack = 0;
let sessionId = "";
let deviceId = "";

function uuid(): string {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getDeviceId(): string {
  try {
    let d = localStorage.getItem(DEVICE_KEY);
    if (!d) {
      d = uuid();
      localStorage.setItem(DEVICE_KEY, d);
    }
    return d;
  } catch {
    return uuid();
  }
}

function getSessionId(): string {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id && Date.now() - parsed.last < SESSION_TTL_MS) {
        parsed.last = Date.now();
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
        return parsed.id;
      }
    }
    const id = uuid();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id, last: Date.now() }));
    return id;
  } catch {
    return uuid();
  }
}

function touchSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.last = Date.now();
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(parsed));
    }
  } catch {}
}

function getUserId(): string | null {
  try {
    const raw = localStorage.getItem("cira_user");
    if (!raw || raw === "undefined" || raw === "null") return null;
    const u = JSON.parse(raw);
    return u?.id || null;
  } catch {
    return null;
  }
}

function getDeviceMeta() {
  if (typeof window === "undefined") return {};
  return {
    ua: navigator.userAgent,
    lang: navigator.language,
    screen: `${window.screen?.width}x${window.screen?.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function trackEvent(event_type: string, data?: Record<string, any>) {
  if (!initialized) return;
  try {
    touchSession();
    queue.push({
      event_type,
      page: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
      data,
      ts: Date.now(),
      session_id: sessionId,
      device_id: deviceId,
      user_id: getUserId(),
    });
    if (queue.length >= 25) flush();
  } catch {}
}

function flush(useBeacon = false) {
  if (queue.length === 0) return;
  const batch = queue;
  queue = [];
  const payload = JSON.stringify({ events: batch });
  try {
    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
      return;
    }
    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Re-queue on failure (only if reasonable size)
      if (queue.length < 200) queue = batch.concat(queue);
    });
  } catch {
    if (queue.length < 200) queue = batch.concat(queue);
  }
}

function onClick(e: MouseEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return;
  const el = t.closest("button, a, [role='button'], [data-track]") as HTMLElement | null;
  if (!el) return;
  const text = (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 80);
  trackEvent("click", {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    cls: el.className?.toString().slice(0, 120) || undefined,
    href: (el as HTMLAnchorElement).href || undefined,
    text,
    track: el.getAttribute("data-track") || undefined,
  });
}

function onScroll() {
  const now = Date.now();
  if (now - lastScrollTrack < 2000) return;
  lastScrollTrack = now;
  const pct = Math.round(
    ((window.scrollY + window.innerHeight) / (document.documentElement.scrollHeight || 1)) * 100,
  );
  trackEvent("scroll", { pct });
}

function onFocusIn(e: FocusEvent) {
  const t = e.target as HTMLElement | null;
  if (!t) return;
  if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") {
    trackEvent("input_focus", {
      name: (t as HTMLInputElement).name || undefined,
      id: t.id || undefined,
      type: (t as HTMLInputElement).type || undefined,
    });
  }
}

function onVisibility() {
  if (document.visibilityState === "hidden") {
    trackEvent("visibility", { state: "hidden" });
    flush(true);
  } else {
    trackEvent("visibility", { state: "visible" });
  }
}

function onPageHide() {
  trackEvent("session_end", {});
  flush(true);
}

let lastPath = "";
export function trackPageView(path?: string) {
  const p = path || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "");
  if (p === lastPath) return;
  lastPath = p;
  trackEvent("page_view", { path: p, title: typeof document !== "undefined" ? document.title : undefined });
}

export function initActivityTracker() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  deviceId = getDeviceId();
  sessionId = getSessionId();

  trackEvent("session_start", {
    referrer: document.referrer || undefined,
    landing: window.location.pathname + window.location.search,
    ...getDeviceMeta(),
  });

  trackPageView();

  // Listeners (passive where possible)
  window.addEventListener("click", onClick, { capture: true, passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("focusin", onFocusIn, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("beforeunload", onPageHide);

  // Periodic flush
  flushTimer = setInterval(() => flush(false), 5000);
}

export function setTrackedUser(userId: string | null) {
  if (!initialized) return;
  trackEvent("identify", { user_id: userId });
}
