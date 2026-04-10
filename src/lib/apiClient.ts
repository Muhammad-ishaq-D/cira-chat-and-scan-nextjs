/**
 * Centralized API client with JWT authentication
 * All API calls go through this layer
 */

import { getToken, logout } from "./auth";

const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";

function redirectToLogin() {
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const shouldPreservePath = currentPath !== "/login" && currentPath !== "/register";
  const redirectSuffix = shouldPreservePath
    ? `?redirect=${encodeURIComponent(currentPath)}`
    : "";

  window.location.href = `/login${redirectSuffix}`;
}

async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    logout();
    redirectToLogin();
    throw new Error("Session expired");
  }

  return res;
}

async function get<T = any>(endpoint: string): Promise<T> {
  const res = await authFetch(endpoint);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function post<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await authFetch(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    const err = errText ? (() => {
      try {
        return JSON.parse(errText);
      } catch {
        return { message: errText };
      }
    })() : {};
    const errorMsg = typeof err.error === 'string' ? err.error
      : typeof err.message === 'string' ? err.message
      : JSON.stringify(err) || `Request failed (${res.status})`;
    throw new Error(errorMsg);
  }

  if (res.status === 204) return {} as T;

  const text = await res.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return { message: text } as T;
  }
}

async function put<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await authFetch(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function del<T = any>(endpoint: string): Promise<T> {
  const res = await authFetch(endpoint, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed (${res.status})`);
  }
  return res.json();
}

// ─── User Profile ───────────────────────────────────────────────
export const userApi = {
  getProfile: () => get("/api/user/profile"),
  updateProfile: (data: any) => put("/api/user/profile", data),
  deleteAccount: () => del("/api/user/account"),
  uploadAvatar: async (file: File): Promise<{ avatar: string }> => {
    // Compress image to max 200x200 JPEG to avoid payload size issues
    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          const canvas = document.createElement("canvas");
          const maxSize = 200;
          let w = img.width, h = img.height;
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
        img.src = url;
      });
    };

    const base64 = await compressImage(file);
    const result = await put("/api/user/profile", { avatar: base64 });
    return { avatar: result.avatar || base64 };
  },
};

// ─── Chat Sessions ──────────────────────────────────────────────
export const chatApi = {
  /** GET /api/chat/history — all user sessions for sidebar */
  getHistory: () => get("/api/chat/history"),
  /** GET /api/chat/:chatId — load all messages for a session */
  getSession: (chatId: string) => get(`/api/chat/${chatId}`),
  /** DELETE /api/api/chat/:chatId — delete a session */
  deleteSession: (chatId: string) => del(`/api/chat/${chatId}`),
};

// ─── Vitals & Scans ─────────────────────────────────────────────
export const vitalsApi = {
  submitScan: (data: any) => post("/api/vitals/scan", data),
  getHistory: () => get("/api/vitals/history"),
  getScan: (id: string) => get(`/api/vitals/${id}`),
  getLatest: () => get("/api/vitals/latest"),
};

// ─── Reports ────────────────────────────────────────────────────
export const reportsApi = {
  getAll: () => get("/api/reports"),
  getReport: (id: string) => get(`/api/reports/${id}`),
  downloadUrl: (id: string) => `${API_BASE}/api/reports/${id}/download`,
};

// ─── Billing & Subscriptions ────────────────────────────────────
export const billingApi = {
  getSubscription: () => get("/api/billing/subscription"),
  subscribe: async (planId: string, paymentData: any) => {
    try {
      return await post("/api/billing/subscribe", { planId, ...paymentData });
    } catch (err: any) {
      // If endpoint not yet implemented (404), simulate success for demo
      if (err.message?.includes("Not Found") || err.message?.includes("404") || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        await new Promise(r => setTimeout(r, 1500));
        return { success: true, plan_id: planId, message: "Subscription activated (demo)" };
      }
      throw err;
    }
  },
  getPaymentHistory: () => get("/api/billing/payments"),
  getPlans: () => get("/api/billing/plans"),
};

// ─── Doctors ────────────────────────────────────────────────────
export const doctorApi = {
  getAll: (params?: { specialty?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.specialty && params.specialty !== "All") qs.set("specialty", params.specialty);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return get(`/api/doctors${query ? `?${query}` : ""}`);
  },
  getDoctor: (id: string) => get(`/api/doctors/${id}`),
  book: (doctorId: string, data: any) => post(`/api/doctors/${doctorId}/book`, data),
};

// ─── Admin ──────────────────────────────────────────────────────
function adminHeaders() {
  const token = localStorage.getItem("cira_admin_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function adminGet<T = any>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...adminHeaders() },
  });
  if (res.status === 401) {
    localStorage.removeItem("cira_admin");
    localStorage.removeItem("cira_admin_token");
    window.location.href = "/admin";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function adminPost<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

async function adminPut<T = any>(endpoint: string, body?: any): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const adminApi = {
  // Dashboard
  getDashboard: () => adminGet("/api/admin/dashboard"),
  getSystemHealth: () => adminGet("/api/admin/system-health"),
  getRecentActivity: () => adminGet("/api/admin/activity"),

  // Users
  getUsers: (params?: { search?: string; plan?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.plan && params.plan !== "all") qs.set("plan", params.plan);
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    const query = qs.toString();
    return adminGet(`/api/admin/users${query ? `?${query}` : ""}`);
  },
  getUser: (id: string) => adminGet(`/api/admin/users/${id}`),
  suspendUser: (id: string) => adminPost(`/api/admin/users/${id}/suspend`),
  activateUser: (id: string) => adminPost(`/api/admin/users/${id}/activate`),
  adjustCredits: (id: string, amount: number, reason: string) =>
    adminPost(`/api/admin/users/${id}/credits`, { amount, reason }),
  changeUserPlan: (id: string, plan: string) =>
    adminPut(`/api/admin/users/${id}/plan`, { plan }),

  // Billing
  getRevenue: () => adminGet("/api/admin/revenue"),
  getTransactions: (params?: { search?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    const query = qs.toString();
    return adminGet(`/api/admin/transactions${query ? `?${query}` : ""}`);
  },

  // Analytics
  getAnalytics: () => adminGet("/api/admin/analytics"),

  // Settings
  getSettings: () => adminGet("/api/admin/settings"),
  updateSettings: (settings: any) => adminPut("/api/admin/settings", settings),
  updateCreditLimits: (limits: any) => adminPut("/api/admin/settings/credits", limits),
};
