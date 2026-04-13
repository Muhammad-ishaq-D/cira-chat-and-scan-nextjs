/**
 * Device-based free credits system for freemium usage
 * Tracks credits and scans per device via localStorage
 */

const DEVICE_ID_KEY = "cira_device_id";
const FREE_CREDITS_KEY = "cira_free_credits";
const FREE_SCANS_KEY = "cira_free_scans";
const FREE_CHAT_HISTORY_KEY = "cira_free_chat_history";

const INITIAL_CREDITS = 1000;
const INITIAL_SCANS = 1;

function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getFreeCredits(): number {
  const val = localStorage.getItem(FREE_CREDITS_KEY);
  if (val === null) {
    localStorage.setItem(FREE_CREDITS_KEY, String(INITIAL_CREDITS));
    return INITIAL_CREDITS;
  }
  return parseInt(val, 10);
}

export function deductFreeCredits(amount = 1): number {
  const current = getFreeCredits();
  const next = Math.max(0, current - amount);
  localStorage.setItem(FREE_CREDITS_KEY, String(next));
  return next;
}

export function getFreeScans(): number {
  const val = localStorage.getItem(FREE_SCANS_KEY);
  if (val === null) {
    localStorage.setItem(FREE_SCANS_KEY, String(INITIAL_SCANS));
    return INITIAL_SCANS;
  }
  return parseInt(val, 10);
}

export function deductFreeScan(): number {
  const current = getFreeScans();
  const next = Math.max(0, current - 1);
  localStorage.setItem(FREE_SCANS_KEY, String(next));
  return next;
}

export interface FreeChatSession {
  id: string;
  title: string;
  created_at: string;
  messages: { role: string; text: string }[];
}

export function getFreeChatHistory(): FreeChatSession[] {
  try {
    const raw = localStorage.getItem(FREE_CHAT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveFreeChatSession(session: FreeChatSession) {
  const history = getFreeChatHistory();
  const idx = history.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    history[idx] = session;
  } else {
    history.unshift(session);
  }
  // Keep max 50 sessions
  localStorage.setItem(FREE_CHAT_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
}

export function deleteFreeChatSession(id: string) {
  const history = getFreeChatHistory().filter((s) => s.id !== id);
  localStorage.setItem(FREE_CHAT_HISTORY_KEY, JSON.stringify(history));
}
