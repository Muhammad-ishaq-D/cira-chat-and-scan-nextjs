/**
 * Doctor portal API client (separate JWT space from user/admin).
 * Token stored under `cira_doctor_token`.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://askainurse.com";

export interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty?: string;
  license_number?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  status?: "active" | "suspended";
  created_at?: string;
}

export interface DoctorRefill {
  id: number;
  reference_code: string;
  created_at: string;
  delivery_email: string;
  medications: { drug_name_inn: string; drug_strength: string; drug_form: string }[];
  payment_status: string;
  review_status: "pending" | "approved" | "rejected";
  reviewed_by_doctor_id?: number | null;
  reviewed_by_doctor_name?: string | null;
  reviewed_at?: string | null;
  doctor_note?: string | null;
  amount_charged: number;
  stripe_payment_intent_id?: string | null;
  patient_name?: string | null;
}

function doctorHeaders() {
  const token = globalThis?.localStorage?.getItem("cira_doctor_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T = any>(endpoint: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...doctorHeaders(),
      ...(opts.headers as Record<string, string> | undefined),
    },
  });
  if (res.status === 401) {
    globalThis?.localStorage?.removeItem("cira_doctor");
    globalThis?.localStorage?.removeItem("cira_doctor_token");
    if (typeof window !== "undefined") window.location.href = "/doctor/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Request failed (${res.status})`);
  }
  if (res.status === 204) return {} as T;
  const text = await res.text();
  if (!text) return {} as T;
  try { return JSON.parse(text) as T; } catch { return { message: text } as T; }
}

export const doctorAuth = {
  login: async (email: string, password: string): Promise<{ token: string; doctor: Doctor }> => {
    const res = await fetch(`${API_BASE}/api/doctor/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || "Invalid credentials");
    }
    const data = await res.json();
    globalThis?.localStorage?.setItem("cira_doctor_token", data.token);
    globalThis?.localStorage?.setItem("cira_doctor", JSON.stringify(data.doctor));
    return data;
  },
  logout: () => {
    globalThis?.localStorage?.removeItem("cira_doctor_token");
    globalThis?.localStorage?.removeItem("cira_doctor");
  },
  current: (): Doctor | null => {
    try {
      const raw = globalThis?.localStorage?.getItem("cira_doctor");
      return raw ? (JSON.parse(raw) as Doctor) : null;
    } catch { return null; }
  },
  isAuthenticated: () => !!globalThis?.localStorage?.getItem("cira_doctor_token"),
};

export const doctorApi = {
  getProfile: () => request<Doctor>("/api/doctor/profile"),
  updateProfile: (data: Partial<Doctor>) =>
    request<Doctor>("/api/doctor/profile", { method: "PUT", body: JSON.stringify(data) }),
  changePassword: (current_password: string, new_password: string) =>
    request<{ ok: true }>("/api/doctor/change-password", {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }),

  getPendingRefills: async () => {
    try {
      const res = await request<any>("/api/doctor/refills/pending");
      const refills = Array.isArray(res) ? res : (res?.refills || res?.data || []);
      return { refills: refills as DoctorRefill[] };
    } catch (e: any) {
      if (/404|not found/i.test(e?.message || "")) return { refills: [] };
      throw e;
    }
  },
  getReviewedRefills: async (status: "approved" | "rejected" | "all" = "all") => {
    try {
      const res = await request<any>(`/api/doctor/refills/reviewed?status=${status}`);
      const refills = Array.isArray(res) ? res : (res?.refills || res?.data || []);
      return { refills: refills as DoctorRefill[] };
    } catch (e: any) {
      if (/404|not found/i.test(e?.message || "")) return { refills: [] };
      throw e;
    }
  },
  getRefill: (id: number | string) => request<DoctorRefill>(`/api/doctor/refills/${id}`),
  approveRefill: (id: number | string, note?: string) =>
    request<DoctorRefill>(`/api/doctor/refills/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note: note || "" }),
    }),
  rejectRefill: (id: number | string, reason: string) =>
    request<DoctorRefill>(`/api/doctor/refills/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Dashboard counts (optional endpoint; falls back to client-side if missing)
  getStats: async () => {
    try {
      return await request<{ pending: number; approved_today: number; rejected_today: number }>(
        "/api/doctor/stats",
      );
    } catch {
      return { pending: 0, approved_today: 0, rejected_today: 0 };
    }
  },
};
