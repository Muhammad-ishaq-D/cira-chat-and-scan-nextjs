/**
 * Async user activity tracker.
 * Captures session start, page views, clicks, scrolls (throttled),
 * input focus, visibility changes. Batches & flushes via sendBeacon/fetch.
 *
 * NOTE: Does nothing when an admin is logged in (we don't track admin data).
 */

const API_BASE = (import.meta as any).env?.VITE_API_URL || "https://askainurse.com";
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
  try {
    return localStorage.getItem("cira_admin") === "true";
  } catch {
    return false;
  }
};

const getOrCreate = (key: string) => {
  try {
    let v = localStorage.getItem(key);
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

const getSessionId = () => {
  try {
    let v = sessionStorage.getItem("cira_session_id");
    if (!v) {
      v = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("cira_session_id", v);
    }
    return v;
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

const getUser = () => {
  try {
    const token = localStorage.getItem("cira_token") || null;
    const userRaw = localStorage.getItem("cira_user");
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
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // re-queue on failure (cap to avoid runaway memory)
        if (queue.length < 200) queue.unshift(...batch);
      });
    }
  } catch {
    if (queue.length < 200) queue.unshift(...batch);
  }
};

const scheduleFlush = () => {
  if (flushTimer != null) return;
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    flush(false);
  }, FLUSH_MS);
};

const enqueue = (e: TrackedEvent) => {
  if (isAdmin()) return;
  queue.push(e);
  if (queue.length >= 25) flush(false);
  else scheduleFlush();
};

export const trackEvent = (event_type: string, data?: Record<string, any>) => {
  enqueue({
    event_type,
    page: location.pathname + location.search,
    data,
    ts: Date.now(),
  });
};

export const trackPageView = (page: string) => {
  enqueue({ event_type: "page_view", page, ts: Date.now() });
};

export const initActivityTracker = () => {
  if (started) return;
  started = true;

  deviceId = getOrCreate("cira_device_id");
  sessionId = getSessionId();

  if (isAdmin()) return; // do not bind listeners for admins

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

  // clicks
  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const el = (t.closest("a, button, [role='button'], [data-track]") as HTMLElement) || t;
      const tag = el.tagName?.toLowerCase();
      const text = (el.innerText || (el as HTMLInputElement).value || "").trim().slice(0, 80);
      const href = (el as HTMLAnchorElement).href || null;
      const id = el.id || null;
      const cls = typeof el.className === "string" ? el.className.slice(0, 120) : null;
      trackEvent("click", { tag, text, href, id, cls });
    },
    { capture: true, passive: true }
  );

  // input focus (no values)
  document.addEventListener(
    "focusin",
    (e) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      const tag = el.tagName?.toLowerCase();
      if (tag !== "input" && tag !== "textarea" && tag !== "select") return;
      trackEvent("input_focus", {
        tag,
        name: (el as HTMLInputElement).name || null,
        type: (el as HTMLInputElement).type || null,
        id: el.id || null,
      });
    },
    { capture: true, passive: true }
  );

  // throttled scroll depth
  window.addEventListener(
    "scroll",
    () => {
      const now = Date.now();
      if (now - lastScrollAt < SCROLL_THROTTLE_MS) return;
      lastScrollAt = now;
      const doc = document.documentElement;
      const max = (doc.scrollHeight - innerHeight) || 1;
      const pct = Math.max(0, Math.min(100, Math.round((scrollY / max) * 100)));
      trackEvent("scroll", { pct });
    },
    { passive: true }
  );

  // visibility
  document.addEventListener("visibilitychange", () => {
    trackEvent("visibility", { state: document.visibilityState });
    if (document.visibilityState === "hidden") flush(true);
  });

  // unload
  window.addEventListener("pagehide", () => {
    enqueue({ event_type: "session_end", ts: Date.now() });
    flush(true);
  });
};
