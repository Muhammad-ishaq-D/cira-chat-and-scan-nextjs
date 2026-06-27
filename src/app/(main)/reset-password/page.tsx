"use client";

import { useState } from "react";
import { useNavigate, useSearchParams } from '@/lib/react-router-compat';
import { useTranslation } from "react-i18next";
import ciraLogo from "@/assets/cira-logo.svg";
import { resetPassword } from "@/lib/auth";
import { toast } from "sonner";
import SEO from "@/components/SEO";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error(t("resetPassword.errors.passwordMin"));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t("resetPassword.errors.passwordMismatch"));
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), otp, newPassword);
      toast.success(t("resetPassword.success"));
      navigate("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("resetPassword.errors.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO path="/reset-password" />
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={ciraLogo.src} alt="Cira" width={32} height={32} />
          <span className="font-heading text-2xl font-semibold text-foreground">Cira</span>
        </div>

        <h1 className="font-heading text-2xl font-semibold text-foreground text-center mb-2">
          {t("resetPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground text-center font-body mb-8">
          {t("resetPassword.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("resetPassword.emailPlaceholder")}
            autoComplete="email"
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            required
          />
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder={t("resetPassword.otpPlaceholder")}
            maxLength={6}
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm text-center tracking-[0.3em] outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground placeholder:tracking-normal"
            required
          />
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("resetPassword.newPassword")}
            autoComplete="new-password"
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            required
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("resetPassword.confirmPassword")}
            autoComplete="new-password"
            className="w-full py-3 px-4 rounded-xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium font-body hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? t("resetPassword.resetting") : t("resetPassword.reset")}
          </button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="w-full text-xs text-muted-foreground hover:text-foreground font-body transition-colors mt-4"
        >
          {t("resetPassword.backToSignIn")}
        </button>
      </div>
    </div>
    </>
  );
};

export default ResetPassword;
