import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";
import { login, sendOtp, verifyOtp, googleLogin } from "@/lib/auth";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = "189012024552-c7u7miv6r56n1nv3e9litsd3gglo2i0e.apps.googleusercontent.com";

const Login = () => {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      toast.success("Verification code sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      navigate("/chat");
    } catch (err: any) {
      toast.error(err.message || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // TODO: Integrate Google OAuth SDK → call googleLogin(idToken)
    toast.info("Google login coming soon");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={ciraLogo} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground text-center mb-2">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground text-center font-body mb-8">
          Sign in to continue your conversation
        </p>

        {/* Google one-click */}
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm font-medium hover:bg-accent transition-colors mb-4"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-body">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Email Login */}
        {!showEmailForm ? (
          <button
            onClick={() => setShowEmailForm(true)}
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm font-medium hover:bg-accent transition-colors"
          >
            Continue with Email
          </button>
        ) : useOtp ? (
          // OTP flow
          !otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
                onClick={() => setUseOtp(false)}
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
          // Email + Password flow
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
          </form>
        )}

        <p className="text-xs text-muted-foreground text-center font-body mt-8 leading-relaxed">
          By signing in, you agree to Cira's Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
