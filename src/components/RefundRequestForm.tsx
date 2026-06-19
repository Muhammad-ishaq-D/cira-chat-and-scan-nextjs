import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Upload, X, FileText, Image as ImageIcon } from "lucide-react";

export type RefillRecord = {
  ref: string;
  date: string; // ISO
  drug: string;
  strength: string;
  email: string;
  priceCents: number;
  token?: string; // refund_token from backend (present on email-link flow)
  type?: "prescription" | "referral";
};

const API_BASE =
  (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  "https://askainurse.com";

const REFUND_WINDOW_DAYS = 7;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

type Props = {
  /** When null, render the "invalid token" error state. */
  refill: RefillRecord | null;
  /** Force the invalid state regardless of refill (used for bad guest tokens). */
  invalid?: boolean;
  /** Optional href shown in the back link in the success state and header. */
  backHref?: string;
};

const RefundRequestForm = ({ refill, invalid, backHref }: Props) => {
  const { t, i18n } = useTranslation();
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const deadline = useMemo(() => {
    if (!refill) return null;
    const d = new Date(refill.date);
    d.setDate(d.getDate() + REFUND_WINDOW_DAYS);
    return d;
  }, [refill]);

  const daysRemaining = useMemo(() => {
    if (!deadline) return 0;
    const diff = deadline.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [deadline]);

  const expired = !!deadline && deadline.getTime() < Date.now();
  const formDisabled = expired || submitting;
  const canSubmit = !formDisabled && reason.trim().length > 0 && !!file;

  // Invalid / missing token
  if (invalid || !refill) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-destructive/15 flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="font-semibold text-foreground mb-2" style={{ fontSize: 18 }}>
          {t("pages.refund.invalidTitle")}
        </h2>
        <p className="text-muted-foreground leading-relaxed" style={{ fontSize: 15 }}>
          {t("pages.refund.invalidBody")}
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
        </div>
        <h2 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
          {t("pages.refund.successTitle")}
        </h2>
        <p className="text-foreground/80 leading-relaxed" style={{ fontSize: 15 }}>
          {t("pages.refund.successBody")}
        </p>
        {backHref && (
          <Link
            to={backHref}
            className="inline-block rounded-full border border-border bg-background text-foreground font-medium px-6 hover:bg-accent transition-colors"
            style={{ minHeight: 44, lineHeight: "44px", fontSize: 15 }}
          >
            {t("pages.refund.backToRefills")}
          </Link>
        )}
      </div>
    );
  }

  const handleFiles = (files: FileList | null) => {
    setFileError(null);
    const f = files?.[0];
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError(t("pages.refund.fileTypeError"));
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFileError(t("pages.refund.fileSizeError"));
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !refill || !file) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const formData = new FormData();
      // Use the refund_token from the email link if present, otherwise fall back to ref code.
      formData.append("token", refill.token || refill.ref);
      formData.append("reason", reason.trim());
      formData.append("proof_file", file);
      const endpoint = refill.type === "referral"
        ? `${API_BASE}/api/referral/refund/submit`
        : `${API_BASE}/api/prescription/refund/submit`;
      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error || "Submission failed");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const locale = i18n.language;
  const issuedDisplay = new Date(refill.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const deadlineDisplay = deadline
    ? deadline.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" })
    : "";
  const priceDisplay = `€${(refill.priceCents / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Service details */}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        <DetailRow label={t("pages.refund.referenceLabel")} value={refill.ref} mono />
        {refill.type === "referral" ? (
          <DetailRow label={t("pages.refund.specialistLabel", { defaultValue: "Specialist" })} value={refill.drug || "—"} />
        ) : (
          <DetailRow
            label={t("pages.refund.medicationLabel")}
            value={[refill.drug, refill.strength].filter(Boolean).join(" · ") || "—"}
          />
        )}
        <DetailRow label={t("pages.refund.issuedLabel")} value={issuedDisplay} />
        <DetailRow label={t("pages.refund.amountLabel")} value={priceDisplay} />
      </div>

      {/* Deadline banner */}
      {expired ? (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-destructive leading-snug" style={{ fontSize: 14 }}>
            {t("pages.refund.expired")}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
          <p className="text-primary font-semibold" style={{ fontSize: 14 }}>
            {t("pages.refund.deadline", { date: deadlineDisplay })}
          </p>
          <p className="text-primary/85 mt-0.5" style={{ fontSize: 13 }}>
            {t("pages.refund.daysRemaining", { count: daysRemaining })}
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="refund-reason"
            className="block text-sm font-medium text-foreground mb-2"
          >
            {refill.type === "referral"
              ? "Please describe why the specialist did not accept your referral letter:"
              : t("pages.refund.reasonLabel")}
          </label>
          <textarea
            id="refund-reason"
            required
            disabled={formDisabled}
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 1500))}
            placeholder={refill.type === "referral"
              ? "Tell us briefly what the specialist said…"
              : t("pages.refund.reasonPlaceholder")}
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-3 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 resize-y"
            style={{ fontSize: 16 }}
          />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {reason.length}/1500
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            {refill.type === "referral"
              ? "Upload proof (letter, email, or note from specialist):"
              : t("pages.refund.uploadLabel")}
          </label>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            className="hidden"
            disabled={formDisabled}
            onChange={(e) => handleFiles(e.target.files)}
          />
          {file ? (
            <div className="rounded-xl border border-border bg-background px-3 py-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {file.type === "application/pdf" ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <ImageIcon className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-foreground font-medium truncate" style={{ fontSize: 14 }}>
                  {file.name}
                </p>
                <p className="text-muted-foreground" style={{ fontSize: 12 }}>
                  {formatBytes(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={formDisabled}
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
                aria-label={t("pages.refund.removeFile")}
                style={{ minHeight: 40, minWidth: 40 }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={formDisabled}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!formDisabled) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                if (formDisabled) return;
                handleFiles(e.dataTransfer.files);
              }}
              className={`w-full rounded-xl border-2 border-dashed px-4 py-6 flex flex-col items-center gap-2 text-center transition-colors disabled:opacity-50 ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:bg-accent/40 hover:border-primary/40"
              }`}
              style={{ minHeight: 120 }}
            >
              <Upload className="w-6 h-6 text-primary" />
              <span className="text-foreground font-medium" style={{ fontSize: 15 }}>
                {t("pages.refund.uploadCta")}
              </span>
              <span className="text-muted-foreground" style={{ fontSize: 12 }}>
                {t("pages.refund.uploadHint")}
              </span>
            </button>
          )}
          {fileError && (
            <p className="text-destructive mt-2" style={{ fontSize: 13 }}>{fileError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            {t("pages.refund.uploadHelper")}
          </p>
        </div>

        {submitError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-destructive leading-snug" style={{ fontSize: 14 }}>{submitError}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ minHeight: 52, fontSize: 16 }}
        >
          {submitting ? t("pages.refund.submitting") : t("pages.refund.submit")}
        </button>
      </form>
    </div>
  );
};

const DetailRow = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex justify-between gap-3 px-4 py-3">
    <span className="text-muted-foreground" style={{ fontSize: 14 }}>{label}</span>
    <span
      className={`text-foreground font-medium text-right ${mono ? "font-mono tracking-wider" : ""}`}
      style={{ fontSize: 15 }}
    >
      {value}
    </span>
  </div>
);

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export default RefundRequestForm;
