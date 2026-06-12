import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  ChevronDown,
  Camera,
  Pencil,
  Loader2,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";

export type DrugDetails = {
  drug: string;
  form: string;
  strength: string;
  dosage: string;
};

export type RefillAnswers = {
  consent: boolean;
  drug: DrugDetails | null;
  submissionMode: "upload" | "manual" | null;
  // remaining fields reserved for later steps (3-8)
  fullName?: string;
  pharmacy?: string;
  notes?: string;
};

const TOTAL_STEPS = 8;

type ChatMessage = {
  id: string;
  role: "ai" | "user";
  kind: "text" | "node";
  text?: string;
  node?: React.ReactNode;
};

type Props = {
  onExit: () => void;
  onComplete?: (answers: RefillAnswers) => void;
};

const PrescriptionRefillChat = ({ onExit, onComplete }: Props) => {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<RefillAnswers>({
    consent: false,
    drug: null,
    submissionMode: null,
  });

  // Step 2 sub-state
  type Sub2 =
    | "choose"
    | "upload-reading"
    | "manual-input"
    | "confirm"
    | "low-confidence"
    | "edit";
  const [sub2, setSub2] = useState<Sub2>("choose");
  const [lowConfidence, setLowConfidence] = useState(false);
  const [manualValue, setManualValue] = useState("");
  const [editDraft, setEditDraft] = useState<DrugDetails | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<Set<string>>(new Set());

  // --- Helpers ---
  const pushMsg = (m: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...m, id: `${Date.now()}-${Math.random()}` }]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, step, sub2]);

  // Seed AI prompt for each step
  useEffect(() => {
    const key = `step-${step}`;
    if (seededRef.current.has(key)) return;
    seededRef.current.add(key);

    if (step === 1) {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step1Intro") });
    } else if (step === 2) {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step2Prompt") });
    } else if (step >= 3) {
      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.placeholderStep", { step }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // --- Step 1: consent ---
  const handleConsent = () => {
    setAnswers((a) => ({ ...a, consent: true }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.consentAgree") });
    setTimeout(() => setStep(2), 250);
  };

  // --- Step 2: submission ---
  const handleChooseUpload = () => {
    setAnswers((a) => ({ ...a, submissionMode: "upload" }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.uploadPhoto") });
    fileRef.current?.click();
  };

  const handleChooseManual = () => {
    setAnswers((a) => ({ ...a, submissionMode: "manual" }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.typeManually") });
    setTimeout(() => {
      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.manualPrompt"),
      });
      setSub2("manual-input");
    }, 250);
  };

  const handleFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSub2("upload-reading");
    pushMsg({
      role: "ai",
      kind: "text",
      text: t("pages.prescriptionRefill.chat.reading"),
    });

    // TODO: replace with real OCR call (e.g. Lovable AI vision endpoint).
    // For now, simulate extraction + random low-confidence outcome.
    setTimeout(() => {
      const mock: DrugDetails = {
        drug: "Lisinopril",
        form: t("pages.prescriptionRefill.chat.formTablet"),
        strength: "10 mg",
        dosage: t("pages.prescriptionRefill.chat.dosageDaily"),
      };
      const isLow = Math.random() < 0.3;
      setAnswers((a) => ({ ...a, drug: mock }));
      setLowConfidence(isLow);
      if (isLow) {
        pushMsg({
          role: "ai",
          kind: "text",
          text: t("pages.prescriptionRefill.chat.lowConfidence"),
        });
        setSub2("low-confidence");
      } else {
        setSub2("confirm");
      }
    }, 1800);

    // reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleManualSubmit = () => {
    const v = manualValue.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setManualValue("");
    const guess: DrugDetails = {
      drug: v,
      form: "—",
      strength: "—",
      dosage: "—",
    };
    setAnswers((a) => ({ ...a, drug: guess }));
    setTimeout(() => setSub2("confirm"), 250);
  };

  const handleLooksGood = () => {
    if (!answers.drug) return;
    const d = answers.drug;
    pushMsg({
      role: "user",
      kind: "text",
      text: `${d.drug} · ${d.strength} · ${d.form}`,
    });
    setTimeout(() => setStep(3), 250);
  };

  const handleEdit = () => {
    setEditDraft(answers.drug);
    setSub2("edit");
  };

  const handleEditSave = () => {
    if (!editDraft) return;
    setAnswers((a) => ({ ...a, drug: editDraft }));
    setSub2("confirm");
  };

  const handleRetake = () => {
    setSub2("choose");
    setLowConfidence(false);
    fileRef.current?.click();
    setAnswers((a) => ({ ...a, submissionMode: "upload" }));
  };

  // --- Back navigation ---
  const handleBack = () => {
    if (step === 1) {
      onExit();
      return;
    }
    if (step === 2) {
      // back from step 2 to step 1
      seededRef.current.delete(`step-${step}`);
      // remove messages added after step 1's first AI msg (keep first msg only? Simpler: drop trailing until count is 1)
      setMessages((prev) => prev.slice(0, 1));
      setSub2("choose");
      setStep(1);
      return;
    }
    seededRef.current.delete(`step-${step}`);
    setStep((s) => s - 1);
  };

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="flex flex-col w-full" style={{ minHeight: "min(720px, 100dvh)" }}>
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 px-3 sm:px-5 pt-3 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={handleBack}
            aria-label={t("common.back")}
            className="flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            style={{ minHeight: 48, minWidth: 48 }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
              {t("pages.prescriptionRefill.chat.stepCounter", {
                current: step,
                total: TOTAL_STEPS,
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-5 space-y-3"
        style={{ minHeight: 0 }}
      >
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.kind === "text" ? <span>{m.text}</span> : m.node}
          </Bubble>
        ))}

        {/* Step 1: consent card */}
        {step === 1 && !answers.consent && (
          <Bubble role="ai" wide>
            <ConsentCard onAgree={handleConsent} />
          </Bubble>
        )}

        {/* Step 2 UI */}
        {step === 2 && sub2 === "choose" && (
          <Bubble role="ai" wide>
            <div className="grid grid-cols-2 gap-3">
              <SubmissionButton
                icon={<Camera className="w-6 h-6" />}
                label={t("pages.prescriptionRefill.chat.uploadPhoto")}
                onClick={handleChooseUpload}
              />
              <SubmissionButton
                icon={<Pencil className="w-6 h-6" />}
                label={t("pages.prescriptionRefill.chat.typeManually")}
                onClick={handleChooseManual}
              />
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFilePicked}
            />
          </Bubble>
        )}

        {step === 2 && sub2 === "upload-reading" && (
          <Bubble role="ai">
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span style={{ fontSize: 16 }}>
                {t("pages.prescriptionRefill.chat.reading")}
              </span>
            </div>
          </Bubble>
        )}

        {step === 2 && sub2 === "confirm" && answers.drug && (
          <Bubble role="ai" wide>
            <DrugConfirmCard
              drug={answers.drug}
              lowConfidence={false}
              onPrimary={handleLooksGood}
              onSecondary={handleEdit}
              primaryLabel={t("pages.prescriptionRefill.chat.looksGood")}
              secondaryLabel={t("pages.prescriptionRefill.chat.editDetails")}
            />
          </Bubble>
        )}

        {step === 2 && sub2 === "low-confidence" && answers.drug && (
          <Bubble role="ai" wide>
            <DrugConfirmCard
              drug={answers.drug}
              lowConfidence
              onPrimary={handleLooksGood}
              onSecondary={handleRetake}
              onTertiary={() => {
                setSub2("manual-input");
                pushMsg({
                  role: "ai",
                  kind: "text",
                  text: t("pages.prescriptionRefill.chat.manualPrompt"),
                });
              }}
              primaryLabel={t("pages.prescriptionRefill.chat.confirm")}
              secondaryLabel={t("pages.prescriptionRefill.chat.retakePhoto")}
              tertiaryLabel={t("pages.prescriptionRefill.chat.enterManually")}
            />
          </Bubble>
        )}

        {step === 2 && sub2 === "edit" && editDraft && (
          <Bubble role="ai" wide>
            <EditDrugCard
              draft={editDraft}
              setDraft={setEditDraft}
              onSave={handleEditSave}
              onCancel={() => setSub2("confirm")}
              t={t}
            />
          </Bubble>
        )}
      </div>

      {/* Bottom input bar (only for manual text input) */}
      {step === 2 && sub2 === "manual-input" && (
        <div className="border-t border-border bg-background px-3 sm:px-5 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleManualSubmit();
              }}
              placeholder={t("pages.prescriptionRefill.chat.manualPlaceholder")}
              autoFocus
              className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: 16, minHeight: 48 }}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualValue.trim()}
              className="px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ minHeight: 48, fontSize: 16 }}
            >
              {t("pages.prescriptionRefill.chat.continue")}
            </button>
          </div>
        </div>
      )}

      {/* Placeholder for later steps */}
      {step >= 3 && (
        <div className="border-t border-border bg-background px-3 sm:px-5 py-4 text-center text-sm text-muted-foreground">
          {t("pages.prescriptionRefill.chat.placeholderHint")}
        </div>
      )}
    </div>
  );
};

// ============= Subcomponents =============

const Bubble = ({
  role,
  children,
  wide,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div
    className={`flex items-end gap-2 animate-fade-in ${
      role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    {role === "ai" && (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
        <img src={ciraLogo} alt="Cira" width={18} height={18} />
      </div>
    )}
    <div
      className={`${wide ? "max-w-[92%] w-full" : "max-w-[85%]"} rounded-2xl px-4 py-3 leading-relaxed ${
        role === "user"
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-muted text-foreground rounded-bl-sm"
      }`}
      style={{ fontSize: 16 }}
    >
      {children}
    </div>
  </div>
);

const ConsentCard = ({ onAgree }: { onAgree: () => void }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
          {t("pages.prescriptionRefill.chat.consentTitle")}
        </h3>
        <p className="mt-2 text-foreground/80" style={{ fontSize: 15 }}>
          {t("pages.prescriptionRefill.chat.consentBody")}
        </p>
      </div>

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-background/60 border border-border text-left text-foreground hover:bg-background transition-colors"
        style={{ minHeight: 48, fontSize: 15 }}
        aria-expanded={open}
      >
        <span className="font-medium">{t("pages.prescriptionRefill.chat.learnMore")}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="space-y-3 px-1 animate-fade-in" style={{ fontSize: 14 }}>
          <DetailRow
            label={t("pages.prescriptionRefill.chat.consentCollectLabel")}
            value={t("pages.prescriptionRefill.chat.consentCollectValue")}
          />
          <DetailRow
            label={t("pages.prescriptionRefill.chat.consentUseLabel")}
            value={t("pages.prescriptionRefill.chat.consentUseValue")}
          />
          <DetailRow
            label={t("pages.prescriptionRefill.chat.consentRetentionLabel")}
            value={t("pages.prescriptionRefill.chat.consentRetentionValue")}
          />
          <Link
            to="/privacy"
            className="inline-block text-primary underline underline-offset-2 hover:opacity-80"
          >
            {t("pages.prescriptionRefill.chat.readPolicy")}
          </Link>
        </div>
      )}

      <button
        onClick={onAgree}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        style={{ minHeight: 52, fontSize: 16 }}
      >
        {t("pages.prescriptionRefill.chat.consentAgree")}
      </button>
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
      {label}
    </p>
    <p className="text-foreground mt-0.5">{value}</p>
  </div>
);

const SubmissionButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-background border border-border px-3 py-5 text-foreground hover:bg-accent hover:border-primary/40 transition-all"
    style={{ minHeight: 96, fontSize: 16 }}
  >
    <span className="text-primary">{icon}</span>
    <span className="font-medium text-center leading-tight">{label}</span>
  </button>
);

const DrugConfirmCard = ({
  drug,
  lowConfidence,
  onPrimary,
  onSecondary,
  onTertiary,
  primaryLabel,
  secondaryLabel,
  tertiaryLabel,
}: {
  drug: DrugDetails;
  lowConfidence: boolean;
  onPrimary: () => void;
  onSecondary: () => void;
  onTertiary?: () => void;
  primaryLabel: string;
  secondaryLabel: string;
  tertiaryLabel?: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <CheckCircle2 className="w-5 h-5" />
        <span className="font-semibold" style={{ fontSize: 15 }}>
          {lowConfidence
            ? t("pages.prescriptionRefill.chat.pleaseConfirm")
            : t("pages.prescriptionRefill.chat.weFound")}
        </span>
      </div>
      <div className="rounded-xl bg-background/60 border border-border divide-y divide-border">
        <Row label={t("pages.prescriptionRefill.chat.drug")} value={drug.drug} />
        <Row label={t("pages.prescriptionRefill.chat.form")} value={drug.form} />
        <Row label={t("pages.prescriptionRefill.chat.strength")} value={drug.strength} />
        <Row label={t("pages.prescriptionRefill.chat.dosage")} value={drug.dosage} />
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onSecondary}
          className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors flex items-center justify-center gap-1.5"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {lowConfidence && <RotateCcw className="w-4 h-4" />}
          {secondaryLabel}
        </button>
        <button
          onClick={onPrimary}
          className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {primaryLabel}
        </button>
      </div>
      {tertiaryLabel && onTertiary && (
        <button
          onClick={onTertiary}
          className="w-full rounded-full text-primary font-medium hover:underline"
          style={{ minHeight: 44, fontSize: 14 }}
        >
          {tertiaryLabel}
        </button>
      )}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 px-3 py-2.5">
    <span className="text-muted-foreground" style={{ fontSize: 14 }}>
      {label}
    </span>
    <span className="text-foreground font-medium text-right" style={{ fontSize: 15 }}>
      {value}
    </span>
  </div>
);

const EditDrugCard = ({
  draft,
  setDraft,
  onSave,
  onCancel,
  t,
}: {
  draft: DrugDetails;
  setDraft: (d: DrugDetails) => void;
  onSave: () => void;
  onCancel: () => void;
  t: (k: string) => string;
}) => {
  const fields: Array<{ key: keyof DrugDetails; label: string }> = [
    { key: "drug", label: t("pages.prescriptionRefill.chat.drug") },
    { key: "form", label: t("pages.prescriptionRefill.chat.form") },
    { key: "strength", label: t("pages.prescriptionRefill.chat.strength") },
    { key: "dosage", label: t("pages.prescriptionRefill.chat.dosage") },
  ];
  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            {f.label}
          </label>
          <input
            type="text"
            value={draft[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: 16, minHeight: 48 }}
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.cancel")}
        </button>
        <button
          onClick={onSave}
          className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.save")}
        </button>
      </div>
    </div>
  );
};

export default PrescriptionRefillChat;
