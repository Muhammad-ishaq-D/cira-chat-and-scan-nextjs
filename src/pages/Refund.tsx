import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import RefundRequestForm, { type RefillRecord } from "@/components/RefundRequestForm";

const API_BASE =
  (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  "https://askainurse.com";

type InvalidReason =
  | "refund_already_approved"
  | "refund_already_requested"
  | "refund_already_rejected"
  | "token_expired_or_invalid"
  | null;

const StatusCard = ({
  icon,
  color,
  title,
  body,
}: {
  icon: React.ReactNode;
  color: "emerald" | "amber" | "red" | "destructive";
  title: string;
  body: string;
}) => {
  const palette = {
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    amber: "border-amber-500/30 bg-amber-500/5",
    red: "border-red-500/30 bg-red-500/5",
    destructive: "border-destructive/30 bg-destructive/5",
  };
  return (
    <div className={`rounded-2xl border ${palette[color]} p-6 text-center`}>
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 bg-white/60">
        {icon}
      </div>
      <h2 className="font-semibold text-foreground mb-2" style={{ fontSize: 18 }}>
        {title}
      </h2>
      <p className="text-muted-foreground leading-relaxed" style={{ fontSize: 15 }}>
        {body}
      </p>
    </div>
  );
};

const Refund = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();

  const [loading, setLoading] = useState(!!token);
  const [refill, setRefill] = useState<RefillRecord | null>(null);
  const [invalid, setInvalid] = useState(!token);
  const [invalidReason, setInvalidReason] = useState<InvalidReason>(null);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/prescription/refund/validate-token?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({})) as { error?: string };
          setInvalidReason((data.error as InvalidReason) || "token_expired_or_invalid");
          setInvalid(true);
          return;
        }
        const data = await res.json() as {
          type?: "prescription" | "referral";
          reference_code?: string;
          specialist_specialty?: string;
          medications?: Array<{ drug_name_inn?: string; drug_strength?: string }>;
          issued_date?: string;
          amount?: number;
          days_remaining?: number;
        };
        const firstMed = data.medications?.[0] ?? {};
        const isReferral = data.type === "referral";
        setRefill({
          ref: data.reference_code || "",
          date: data.issued_date || new Date().toISOString(),
          drug: isReferral ? (data.specialist_specialty || "") : (firstMed.drug_name_inn || ""),
          strength: isReferral ? "" : (firstMed.drug_strength || ""),
          email: "",
          priceCents: Math.round((data.amount ?? 0) * 100),
          token,
          type: data.type,
        });
      })
      .catch(() => {
        setInvalidReason("token_expired_or_invalid");
        setInvalid(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const isReferral = refill?.type === "referral";
  const subtitle = isReferral
    ? "CLINIQUE DE LA BRISEE Referral Letter"
    : t("pages.refund.subtitle");

  const renderInvalidState = () => {
    if (invalidReason === "refund_already_approved") {
      return (
        <StatusCard
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-600" />}
          color="emerald"
          title="Your refund has already been approved"
          body="Your refund request was approved and processed. If you have not received your refund yet, please allow 5–10 business days for it to appear on your statement."
        />
      );
    }
    if (invalidReason === "refund_already_requested") {
      return (
        <StatusCard
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          color="amber"
          title="Refund request already submitted"
          body="Your refund request has already been submitted and is currently under review. You will be notified by email once a decision has been made."
        />
      );
    }
    if (invalidReason === "refund_already_rejected") {
      return (
        <StatusCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          color="red"
          title="Refund request was not approved"
          body="Your refund request was reviewed and could not be approved. If you believe this is an error, please contact our support team for assistance."
        />
      );
    }
    return <RefundRequestForm refill={null} invalid={true} />;
  };

  return (
    <>
      <SEO path="/refund" />
      <div className="min-h-screen bg-background">
        <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> {t("common.back")}
          </button>
          <button onClick={() => navigate("/")} className="flex items-center gap-2">
            <img src={ciraLogo} alt="Cira" width={24} height={24} />
            <span className="font-heading text-lg">Cira</span>
          </button>
        </nav>

        <main className="max-w-xl mx-auto px-5 sm:px-6 pb-16">
          <header className="text-center mb-6">
            <h1 className="font-heading text-2xl md:text-3xl leading-tight text-foreground">
              {t("pages.refund.title")}
            </h1>
            {!loading && !invalid && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </header>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : invalid ? (
            renderInvalidState()
          ) : (
            <RefundRequestForm refill={refill} invalid={false} />
          )}
        </main>
      </div>
    </>
  );
};

export default Refund;
