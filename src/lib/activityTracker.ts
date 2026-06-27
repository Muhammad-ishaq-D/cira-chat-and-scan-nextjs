/**
 * Activity tracker.
 * - Guest users: all events tracked automatically (session_start, page_view, click, scroll, input_focus, visibility).
 * - Logged-in users: only explicit trackEvent() calls (vitals_scan, chat_message, report_view).
 * - Admin users: nothing tracked.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://askainurse.com";
const ENDPOINT = `${API_BASE}/api/track`;
const FLUSH_MS = 5000;
const SCROLL_THROTTLE_MS = 1500;

type TrackedEvent = {
  event_type: string;
  page?: string;
  data?: Record<string, any>;
  ts: number;
};

let sessionId = "";
let deviceId = "";
let queue: TrackedEvent[] = [];
let flushTimer: number | null = null;
let started = false;
let lastScrollAt = 0;

const isAdmin = () => {
  try { return globalThis?.localStorage?.getItem("cira_admin") === "true"; } catch { return false; }
};

const isAuthenticated = () => {
  try { return !!globalThis?.localStorage?.getItem("cira_token"); } catch { return false; }
};

const getOrCreate = (key: string) => {
  try {
    let v = globalThis?.localStorage?.getItem(key);
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      globalThis?.localStorage?.setItem(key, v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

const getSessionId = () => {
  try {
    let v = globalThis?.sessionStorage?.getItem("cira_session_id");
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      globalThis?.sessionStorage?.setItem("cira_session_id", v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

const getUser = () => {
  try {
    const token = globalThis?.localStorage?.getItem("cira_token") || null;
    const userRaw = globalThis?.localStorage?.getItem("cira_user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return {
      user_id: user?.id || user?.user_id || null,
      user_email: user?.email || null,
      authenticated: !!token,
    };
  } catch {
    return { user_id: null, user_email: null, authenticated: false };
  }
};

const flush = (sync = false) => {
  if (queue.length === 0) return;
  if (isAdmin()) { queue = []; return; }

  const batch = queue.splice(0, queue.length);
  const payload = {
    session_id: sessionId,
    device_id: deviceId,
    ...getUser(),
    ua: navigator.userAgent,
    events: batch,
    sent_at: Date.now(),
  };

  try {
    const body = JSON.stringify(payload);
    if (sync && "sendBeacon" in navigator) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    } else {
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
        .catch(() => { if (queue.length < 200) queue.unshift(...batch); });
    }
  } catch {
    if (queue.length < 200) queue.unshift(...batch);
  }
};

const scheduleFlush = () => {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => { flushTimer = null; flush(false); }, FLUSH_MS);
};

const enqueue = (e: TrackedEvent) => {
  if (isAdmin()) return;
  queue.push(e);
  if (queue.length >= 25) flush(false);
  else scheduleFlush();
};

/** Always allowed — used for manual meaningful events (scan, chat, report). */
export const trackEvent = (event_type: string, data?: Record<string, any>) => {
  if (isAdmin()) return;
  enqueue({ event_type, page: location.pathname, data, ts: Date.now() });
};

export const trackPageView = (page: string) => {
  enqueue({ event_type: "page_view", page, ts: Date.now() });
};

export const initActivityTracker = () => {
  if (started) return;
  started = true;

  deviceId = getOrCreate("cira_device_id");
  sessionId = getSessionId();

  if (isAdmin()) return;

  // session_start
  enqueue({
    event_type: "session_start",
    page: location.pathname + location.search,
    data: {
      referrer: document.referrer || null,
      lang: navigator.language,
      screen: { w: screen.width, h: screen.height },
      viewport: { w: innerWidth, h: innerHeight },
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    ts: Date.now(),
  });

  // initial page view
  trackPageView(location.pathname + location.search);

  // --- Auto-listeners: GUESTS ONLY ---
  // Logged-in users only generate explicit trackEvent() calls (scan/chat/report).

  document.addEventListener("click", (e) => {
    if (isAuthenticated()) return;
    const t = e.target as HTMLElement | null;
    if (!t) return;
    const el = (t.closest("a, button, [role='button'], [data-track]") as HTMLElement) || t;
    const tag = el.tagName?.toLowerCase();
    const text = (el.innerText || (el as HTMLInputElement).value || "").trim().slice(0, 80);
    const href = (el as HTMLAnchorElement).href || null;
    const id = el.id || null;
    const cls = typeof el.className === "string" ? el.className.slice(0, 120) : null;
    enqueue({ event_type: "click", page: location.pathname, data: { tag, text, href, id, cls }, ts: Date.now() });
  }, { capture: true, passive: true });

  document.addEventListener("focusin", (e) => {
    if (isAuthenticated()) return;
    const el = e.target as HTMLElement | null;
    if (!el) return;
    const tag = el.tagName?.toLowerCase();
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return;
    enqueue({ event_type: "input_focus", page: location.pathname, data: { tag, name: (el as HTMLInputElement).name || null, type: (el as HTMLInputElement).type || null, id: el.id || null }, ts: Date.now() });
  }, { capture: true, passive: true });

  window.addEventListener("scroll", () => {
    if (isAuthenticated()) return;
    const now = Date.now();
    if (now - lastScrollAt < SCROLL_THROTTLE_MS) return;
    lastScrollAt = now;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - innerHeight) || 1;
    const pct = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
    enqueue({ event_type: "scroll", page: location.pathname, data: { pct }, ts: Date.now() });
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (isAuthenticated()) return;
    enqueue({ event_type: "visibility", page: location.pathname, data: { state: document.visibilityState }, ts: Date.now() });
    if (document.visibilityState === "hidden") flush(true);
  });

  window.addEventListener("pagehide", () => {
    enqueue({ event_type: "session_end", ts: Date.now() });
    flush(true);
  });
};
