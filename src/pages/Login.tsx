import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";
import { googleLogin, isAuthenticated, login, register, sendOtp, verifyOtp } from "@/lib/auth";
import { sanitizeAuthRedirect, storePostAuthRedirect } from "@/lib/authFlow";
import { userApi } from "@/lib/apiClient";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = "189012024552-c7u7miv6r56n1nv3e9litsd3gglo2i0e.apps.googleusercontent.com";
type AuthMode = "login" | "register";
type RouteState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleContextReady, setGoogleContextReady] = useState(() =>
    typeof window === "undefined" || !("serviceWorker" in navigator) || !navigator.serviceWorker.controller,
  );

  const resetOtpFlow = useCallback(() => {
    setUseOtp(false);
    setOtpSent(false);
    setOtp("");
  }, []);

  const requestedPath = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const redirectFromQuery = sanitizeAuthRedirect(searchParams.get("redirect"));
    if (redirectFromQuery) return redirectFromQuery;

    const from = (location.state as RouteState | null)?.from;
    if (!from?.pathname) return null;

    return sanitizeAuthRedirect(`${from.pathname}${from.search ?? ""}${from.hash ?? ""}`);
  }, [location.search, location.state]);

  const buildAuthPath = useCallback((mode: AuthMode) => {
    const params = new URLSearchParams(location.search);
    params.delete("mode");
    const query = params.toString();
    return `${mode === "register" ? "/register" : "/login"}${query ? `?${query}` : ""}`;
  }, [location.search]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      setGoogleContextReady(true);
      return;
    }

    const controller = navigator.serviceWorker.controller;
    if (!controller) {
      sessionStorage.removeItem("cira_google_popup_reset_at");
      setGoogleContextReady(true);
      return;
    }

    setGoogleContextReady(false);

    const lastResetAt = Number(sessionStorage.getItem("cira_google_popup_reset_at") || "0");
    if (Date.now() - lastResetAt > 3000) {
      sessionStorage.setItem("cira_google_popup_reset_at", String(Date.now()));
      controller.postMessage({ type: "deregister" });
    }
  }, [location.pathname]);

  const redirectAfterAuth = useCallback(async () => {
    const followUpPath = requestedPath || (sessionStorage.getItem("cira_landing_message") ? "/chat" : null);

    try {
      const profile = await userApi.getProfile();

      if (!profile?.age || !profile?.height || !profile?.weight || !profile?.biological_sex) {
        storePostAuthRedirect(followUpPath);
        navigate("/onboarding", { replace: true });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Session expired") {
        throw error;
      }

      storePostAuthRedirect(followUpPath);
      navigate("/onboarding", { replace: true });
      return;
    }

    storePostAuthRedirect(null);
    navigate(followUpPath || "/dashboard", { replace: true });
  }, [navigate, requestedPath]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const wantsRegister = location.pathname === "/register" || searchParams.get("mode") === "register";

    setAuthMode(wantsRegister ? "register" : "login");
    resetOtpFlow();
  }, [location.pathname, location.search, resetOtpFlow]);

  useEffect(() => {
    if (isAuthenticated()) {
      void redirectAfterAuth();
    }
  }, [redirectAfterAuth]);

  const handleModeChange = (mode: AuthMode) => {
    setAuthMode(mode);
    setPassword("");
    setConfirmPassword("");
    resetOtpFlow();
    navigate(buildAuthPath(mode), { replace: true, state: location.state });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email.trim(), password);
      await redirectAfterAuth();
    } catch (error) {
      toast.error(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
      });
      toast.success("Account created");
      await redirectAfterAuth();
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setOtpSent(true);
      toast.success("Verification code sent!");
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to send code"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp);
      await redirectAfterAuth();
    } catch (error) {
      toast.error(getErrorMessage(error, "Invalid code"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!googleContextReady) {
      return;
    }

    const initGoogle = () => {
      const google = (window as any).google?.accounts?.id;
      const container = googleButtonRef.current;

      if (!google || !container) {
        setTimeout(initGoogle, 200);
        return;
      }

      container.innerHTML = "";
      google.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            toast.error("Google login failed");
            return;
          }

          setLoading(true);
          try {
            const authData = await googleLogin(response.credential);
            // Extract Google profile picture from ID token
            try {
              const payload = JSON.parse(atob(response.credential.split(".")[1]));
              if (payload.picture && !authData.user.avatar) {
                const { updateUserAvatar } = await import("@/lib/auth");
                updateUserAvatar(payload.picture);
              }
            } catch {}
            await redirectAfterAuth();
          } catch (error) {
            toast.error(getErrorMessage(error, "Google login failed"));
          } finally {
            setLoading(false);
          }
        },
      });

      google.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        width: container.offsetWidth || 320,
        text: "continue_with",
        shape: "pill",
      });
    };

    initGoogle();

    return () => {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }
    };
  }, [googleContextReady, redirectAfterAuth]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={ciraLogo} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground text-center mb-2">
          {authMode === "register" ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground text-center font-body mb-8">
          {authMode === "register"
            ? "Start your first assessment in a few steps"
            : "Sign in to continue your conversation"}
        </p>

        <div className={`w-full mb-4 flex justify-center ${loading || !googleContextReady ? "pointer-events-none opacity-70" : ""}`}>
          <div className="relative w-full min-h-[44px]">
            <div ref={googleButtonRef} className="w-full min-h-[44px]" />
            {!googleContextReady && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full border border-border bg-card text-xs text-muted-foreground font-body">
                Preparing Google sign-in...
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-body">or continue with email</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-muted p-1 mb-4">
          <button
            type="button"
            onClick={() => handleModeChange("login")}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium font-body transition-colors ${
              authMode === "login"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("register")}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium font-body transition-colors ${
              authMode === "register"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Create account
          </button>
        </div>

        {authMode === "register" ? (
          <form onSubmit={handleRegister} className="space-y-3">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="new-password"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("login")}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              Already have an account? Sign in
            </button>
          </form>
        ) : useOtp ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send verification code"}
              </button>
              <button
                type="button"
                onClick={resetOtpFlow}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                Use password instead
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-xs text-muted-foreground font-body text-center">
                We sent a code to <strong className="text-foreground">{email}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm text-center tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground placeholder:tracking-normal"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify & Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                Use a different email
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => setUseOtp(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              Use OTP instead
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              Need an account? Create one
            </button>
          </form>
        )}

        <p className="text-xs text-muted-foreground text-center font-body mt-8 leading-relaxed">
          By continuing, you agree to Cira's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
