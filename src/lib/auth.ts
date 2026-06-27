/**
 * Auth utilities — JWT token management for Cira API
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://askainurse.com";
const TOKEN_KEY = "cira_token";
const REFRESH_KEY = "cira_refresh_token";
const USER_KEY = "cira_user";
const POST_AUTH_REDIRECT_KEY = "cira_post_auth_redirect";

function getStoredValue(key: string): string | null {
  if (typeof window === "undefined") return null;
  
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
  user?: AuthUser;
}

/** Decode JWT payload (no verification — server already issued the token). */
export function parseTokenUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload?.id) return null;
    return {
      id: payload.id,
      email: payload.email || "",
      name: payload.name || payload.email?.split("@")[0] || "User",
      role: payload.role || "user",
    };
  } catch {
    return null;
  }
}

/** Get stored JWT token */
export function getToken(): string | null {
  return getStoredValue(TOKEN_KEY);
}

/** Database user id for billing / Stripe client_reference_id */
export function getUserId(): string | null {
  const user = getUser();
  if (user?.id) return user.id;
  const token = getToken();
  if (!token) return null;
  return parseTokenUser(token)?.id ?? null;
}

/** Get stored user */
export function getUser(): AuthUser | null {
  const raw = getStoredValue(USER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthUser;
      if (parsed?.id) return parsed;
    } catch {
      localStorage.removeItem(USER_KEY);
    }
  }
  const token = getToken();
  if (!token) return null;
  return parseTokenUser(token);
}

/** Check if user is authenticated (token exists AND is not expired) */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds; add 30s buffer so we don't use a nearly-expired token
    if (payload.exp && payload.exp * 1000 < Date.now() + 30_000) {
      // Token expired — clean up stale auth data
      logout();
      return false;
    }
  } catch {
    // Malformed token — clear it
    logout();
    return false;
  }

  return true;
}

/** Store auth data */
function saveAuth(data: AuthResponse) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, data.token);
  if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
  else localStorage.removeItem(REFRESH_KEY);
  const user = data.user?.id ? data.user : parseTokenUser(data.token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

/** Clear auth data */
export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
}

/** Update avatar in stored user data */
export function updateUserAvatar(avatar: string) {
  if (typeof window === "undefined") return;
  const user = getUser();
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({ ...user, avatar }));
  }
}

/** Register a new user */
export async function register(payload: {
  name: string;
  email: string;
  password?: string;
  otp?: string;
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
  let googleId = "";
  let googleName = "User";
  let googleEmail = "";
  let googleAvatar: string | undefined;

  try {
    const payload = JSON.parse(atob(idToken.split(".")[1]));
    googleId = payload.sub || payload.email || "";
    googleName = payload.name || payload.email?.split("@")[0] || "User";
    googleEmail = payload.email || "";
    googleAvatar = payload.picture;
  } catch {}

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch (networkErr) {
    throw new Error("Network error — could not reach server");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err?.error || err?.message || "").toString().trim();
    throw new Error(msg && msg !== "null" ? msg : "Google login failed");
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error("Google login failed — invalid server response");
  }

  if (!data || !data.token) {
    throw new Error("Google login failed — no token received");
  }

  const fromToken = parseTokenUser(data.token);
  const normalizedData: AuthResponse = {
    ...data,
    user: {
      id: data?.user?.id || fromToken?.id || "",
      name: data?.user?.name || fromToken?.name || googleName,
      email: data?.user?.email || fromToken?.email || googleEmail,
      role: data?.user?.role || fromToken?.role || "user",
      ...(data?.user?.avatar || googleAvatar ? { avatar: data?.user?.avatar || googleAvatar } : {}),
    },
  };

  if (!normalizedData.user?.id) {
    throw new Error("Google login failed — could not resolve user id");
  }

  saveAuth(normalizedData);
  return normalizedData as AuthResponse & { user: AuthUser };
}

/** Send OTP to email */
export async function sendOtp(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
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
  const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
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

/** Request a password-reset OTP */
export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to send reset code");
  }
}

/** Reset password using OTP */
export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp, newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Password reset failed");
  }
}
