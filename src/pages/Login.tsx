import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";
import { login, sendOtp, verifyOtp, googleLogin } from "@/lib/auth";
import { userApi } from "@/lib/apiClient";
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

  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initGoogle = () => {
      if (!(window as any).google?.accounts?.id) {
        setTimeout(initGoogle, 200);
        return;
      }
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          setLoading(true);
          try {
            await googleLogin(response.credential);
            navigate("/chat");
          } catch (err: any) {
            toast.error(err.message || "Google login failed");
          } finally {
            setLoading(false);
          }
        },
      });
      if (googleButtonRef.current) {
        (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: googleButtonRef.current.offsetWidth,
          text: "continue_with",
          shape: "pill",
        });
      }
    };
    initGoogle();
  }, [navigate]);

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
        <div ref={googleButtonRef} className="w-full mb-4 flex justify-center" />

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
