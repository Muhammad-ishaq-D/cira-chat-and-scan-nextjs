import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ciraLogo from "@/assets/cira-logo.svg";
import { forgotPassword } from "@/lib/auth";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      toast.success(t("pages.forgotPassword.toastSuccess"));
      navigate(`/reset-password?email=${encodeURIComponent(email.trim())}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("pages.forgotPassword.toastError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Forgot password — Cira" description="Reset your Cira password. We'll email you a one-time code to securely regain access to your account." path="/forgot-password" noindex />
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={ciraLogo} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground text-center mb-2">
          {t("pages.forgotPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground text-center font-body mb-8">
          {t("pages.forgotPassword.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("pages.forgotPassword.emailPlaceholder")}
            autoComplete="email"
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            required
          />
          <button
            type="submit"
            disabled={loading || sent}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t("pages.forgotPassword.sending") : sent ? t("pages.forgotPassword.sent") : t("pages.forgotPassword.send")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors mt-4"
        >
          {t("pages.forgotPassword.back")}
        </button>
      </div>
    </div>
    </>
  );
};

export default ForgotPassword;
