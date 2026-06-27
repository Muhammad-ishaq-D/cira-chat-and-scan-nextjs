"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from '@/lib/react-router-compat';
import ciraLogo from "@/assets/cira-logo.svg";
import { googleLogin, isAuthenticated, login, register, sendOtp, verifyOtp } from "@/lib/auth";
import { sanitizeAuthRedirect, storePostAuthRedirect } from "@/lib/authFlow";
import {
  clearDocumentReload,
  hasCoiServiceWorkerController,
  hasRecentDocumentReload,
  isDocumentCrossOriginIsolated,
  markDocumentReload,
  unregisterCoiServiceWorkers,
} from "@/lib/browserContext";
import { userApi } from "@/lib/apiClient";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

const GOOGLE_CLIENT_ID = "189012024552-c7u7miv6r56n1nv3e9litsd3gglo2i0e.apps.googleusercontent.com";
const GOOGLE_CONTEXT_RESET_KEY = "cira_google_popup_reset";
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
  const { t } = useTranslation();
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
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtp, setRegisterOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleContextReady, setGoogleContextReady] = useState(true);

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
    if (typeof window === "undefined") {
      setGoogleContextReady(true);
      return;
    }

    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      const isReady = !isDocumentCrossOriginIsolated() && !hasCoiServiceWorkerController();

      if (isReady) {
        clearDocumentReload(GOOGLE_CONTEXT_RESET_KEY);
      }

      setGoogleContextReady(isReady);
    };

    const resetGoogleContext = async () => {
      const needsReset = isDocumentCrossOriginIsolated() || hasCoiServiceWorkerController();

      if (!needsReset) {
        markReady();
        return;
      }

      setGoogleContextReady(false);

      if (hasRecentDocumentReload(GOOGLE_CONTEXT_RESET_KEY)) {
        window.setTimeout(markReady, 1200);
        return;
      }

      markDocumentReload(GOOGLE_CONTEXT_RESET_KEY);

      try {
        await unregisterCoiServiceWorkers();
      } catch (error) {
        console.warn("Failed to clear COI service worker for Google sign-in:", error);
      }

      if (!cancelled) {
        window.location.reload();
      }
    };

    void resetGoogleContext();

    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  const redirectAfterAuth = useCallback(async () => {
    // Double-check we're actually authenticated before doing anything
    if (!isAuthenticated()) return;

    const followUpPath = requestedPath || (globalThis?.sessionStorage?.getItem("cira_landing_message") ? "/chat" : null);

    try {
      const profile = await userApi.getProfile();

      if (!profile?.age || !profile?.height || !profile?.weight || !profile?.biological_sex) {
        storePostAuthRedirect(followUpPath);
        navigate("/onboarding", { replace: true });
        return;
      }
    } catch (error) {
      // If auth is no longer valid after the error, stay on login
      if (!isAuthenticated()) return;

      // Only redirect to onboarding if we're genuinely authenticated
      // but profile fetch failed for a non-auth reason
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

    if (searchParams.get("error") === "account_deleted") {
      toast.error("This account has been scheduled for deletion. Contact support@askainurse.com if this was a mistake.");
    }

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
    setRegisterOtpSent(false);
    setRegisterOtp("");
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
      toast.error(getErrorMessage(error, t("auth.errors.loginFailed")));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error(t("auth.errors.nameRequired"));
      return;
    }

    if (password.length < 8) {
      toast.error(t("auth.errors.passwordMin"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("auth.errors.passwordsMismatch"));
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email.trim());
      setRegisterOtpSent(true);
      toast.success(t("auth.toast.codeSent"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("auth.errors.sendCodeFailed")));
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({
        name: fullName.trim(),
        email: email.trim(),
        password,
        otp: registerOtp,
      });
      toast.success(t("auth.toast.accountCreated"));
      await redirectAfterAuth();
    } catch (error) {
      toast.error(getErrorMessage(error, t("auth.errors.verifyFailed")));
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
      toast.success(t("auth.toast.codeSentShort"));
    } catch (error) {
      toast.error(getErrorMessage(error, t("auth.errors.sendCodeFailedShort")));
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
      toast.error(getErrorMessage(error, t("auth.errors.invalidCode")));
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
            toast.error(t("auth.errors.googleFailed"));
            return;
          }

          setLoading(true);
          try {
            // Extract Google profile picture from ID token before auth call
            let googleAvatar: string | undefined;
            let googleName: string | undefined;
            try {
              const payload = JSON.parse(atob(response.credential.split(".")[1]));
              googleAvatar = payload.picture;
              googleName = payload.name;
            } catch {}

            const authData = await googleLogin(response.credential);

            // Persist Google avatar to local storage and backend
            if (googleAvatar) {
              const { updateUserAvatar } = await import("@/lib/auth");
              updateUserAvatar(googleAvatar);
              try {
                await userApi.updateProfile({ 
                  avatar: googleAvatar,
                  ...(googleName && !authData?.user?.name ? { name: googleName } : {}),
                });
              } catch (e) {
                console.warn("Failed to save Google avatar to backend:", e);
              }
            }
            await redirectAfterAuth();
          } catch (error) {
            toast.error(getErrorMessage(error, t("auth.errors.googleFailed")));
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
    <>
      <SEO path="/login" />
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={ciraLogo.src} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground text-center mb-2">
          {authMode === "register" ? t("auth.createAccount") : t("auth.welcomeBack")}
        </h1>
        <p className="text-sm text-muted-foreground text-center font-body mb-8">
          {authMode === "register" ? t("auth.subtitleRegister") : t("auth.subtitleLogin")}
        </p>

        <div className={`w-full mb-4 flex justify-center ${loading || !googleContextReady ? "pointer-events-none opacity-70" : ""}`}>
          <div className="relative w-full min-h-[44px]">
            <div ref={googleButtonRef} className="w-full min-h-[44px]" />
            {!googleContextReady && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full border border-border bg-card text-xs text-muted-foreground font-body">
                {t("auth.preparingGoogle")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-body">{t("auth.orContinueEmail")}</span>
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
            {t("auth.tabSignIn")}
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
            {t("auth.tabCreateAccount")}
          </button>
        </div>

        {authMode === "register" ? (
          !registerOtpSent ? (
            <form onSubmit={handleRegisterSendOtp} className="space-y-3">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("auth.fullName")}
                autoComplete="name"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                autoComplete="email"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                autoComplete="new-password"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("auth.confirmPassword")}
                autoComplete="new-password"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t("auth.sendingCode") : t("auth.continue")}
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("login")}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                {t("auth.alreadyHave")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterVerifyOtp} className="space-y-3">
              <p className="text-xs text-muted-foreground font-body text-center">
                {t("auth.sentCodeTo")} <strong className="text-foreground">{email}</strong>
              </p>
              <input
                type="text"
                value={registerOtp}
                onChange={(e) => setRegisterOtp(e.target.value)}
                placeholder={t("auth.enter6Digit")}
                maxLength={6}
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm text-center tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground placeholder:tracking-normal"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t("auth.verifying") : t("auth.verifyCreate")}
              </button>
              <button
                type="button"
                onClick={() => setRegisterOtpSent(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                {t("auth.useDifferentEmail")}
              </button>
            </form>
          )
        ) : useOtp ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailEnter")}
                autoComplete="email"
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t("auth.sending") : t("auth.sendVerificationCode")}
              </button>
              <button
                type="button"
                onClick={resetOtpFlow}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                {t("auth.usePasswordInstead")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <p className="text-xs text-muted-foreground font-body text-center">
                {t("auth.sentCodeTo")} <strong className="text-foreground">{email}</strong>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder={t("auth.enter6Digit")}
                maxLength={6}
                className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm text-center tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground placeholder:tracking-normal"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? t("auth.verifying") : t("auth.verifySignIn")}
              </button>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                {t("auth.useDifferentEmail")}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.email")}
              autoComplete="email"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.password")}
              autoComplete="current-password"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? t("auth.signingIn") : t("auth.signIn")}
            </button>
            <button
              type="button"
              onClick={() => setUseOtp(true)}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              {t("auth.useOtpInstead")}
            </button>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              {t("auth.forgotPassword")}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("register")}
              className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              {t("auth.needAccount")}
            </button>
          </form>
        )}

        <p className="text-xs text-muted-foreground text-center font-body mt-8 leading-relaxed">
          {t("auth.termsNotice")}
        </p>
      </div>
    </div>
    </>
  );
};

export default Login;
