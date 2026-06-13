import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import SEO from "@/components/SEO";
import RefundRequestForm, { type RefillRecord } from "@/components/RefundRequestForm";

const API_BASE =
  (import.meta as unknown as { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
  "https://askainurse.com";

const Refund = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();

  const [loading, setLoading] = useState(!!token);
  const [refill, setRefill] = useState<RefillRecord | null>(null);
  const [invalid, setInvalid] = useState(!token);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      return;
    }
    setLoading(true);
    fetch(`${API_BASE}/api/prescription/refund/validate-token?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          setInvalid(true);
          return;
        }
        const data = await res.json() as {
          reference_code?: string;
          medications?: Array<{ drug_name_inn?: string; drug_strength?: string }>;
          issued_date?: string;
          amount?: number;
          days_remaining?: number;
        };
        const firstMed = data.medications?.[0] ?? {};
        setRefill({
          ref: data.reference_code || "",
          date: data.issued_date || new Date().toISOString(),
          drug: firstMed.drug_name_inn || "",
          strength: firstMed.drug_strength || "",
          email: "",
          priceCents: Math.round((data.amount ?? 0) * 100),
          token,
        });
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <SEO
        title="Refund Request — Cira"
        description="Request a refund for your CLINIQUE DE LA BRISEE prescription within 7 days of issue."
        path="/refund"
      />
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
          <span className="w-12" />
        </nav>

        <main className="max-w-xl mx-auto px-5 sm:px-6 pb-16">
          <header className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 mb-4">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-heading text-2xl md:text-3xl leading-tight text-foreground">
              {t("pages.refund.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("pages.refund.subtitle")}
            </p>
          </header>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          ) : (
            <RefundRequestForm refill={refill} invalid={invalid} />
          )}
        </main>
      </div>
    </>
  );
};

export default Refund;
