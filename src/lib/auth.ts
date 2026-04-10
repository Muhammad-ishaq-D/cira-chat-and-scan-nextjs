/**
 * Auth utilities — JWT token management for Cira API
 */

const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
const TOKEN_KEY = "cira_token";
const REFRESH_KEY = "cira_refresh_token";
const USER_KEY = "cira_user";
const POST_AUTH_REDIRECT_KEY = "cira_post_auth_redirect";

function getStoredValue(key: string): string | null {
  const value = localStorage.getItem(key);

  if (!value || value === "undefined" || value === "null") {
    if (value) {
      localStorage.removeItem(key);
    }
    return null;
  }

  return value;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: AuthUser;
}

/** Get stored JWT token */
export function getToken(): string | null {
  return getStoredValue(TOKEN_KEY);
}

/** Get stored user */
export function getUser(): AuthUser | null {
  const raw = getStoredValue(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

/** Check if user is authenticated */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/** Store auth data */
function saveAuth(data: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

/** Clear auth data */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
}

/** Update avatar in stored user data */
export function updateUserAvatar(avatar: string) {
  const user = getUser();
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, avatar }));
  }
}

/** Register a new user */
export async function register(payload: {
  name: string;
  email: string;
  password: string;
  biological_sex?: string;
  age?: number;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Registration failed");
  }
  const data = await res.json();
  saveAuth(data);
  return data;
}

/** Login with email & password */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Invalid credentials");
  }
  const data = await res.json();
  saveAuth(data);
  return data;
}

/** Google OAuth login */
export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Google login failed");
  }
  const data = await res.json();
  saveAuth(data);
  return data;
}

/** Send OTP to email */
export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to send OTP");
  }
}

/** Verify OTP and login */
export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Invalid OTP");
  }
  const data = await res.json();
  saveAuth(data);
  return data;
}
