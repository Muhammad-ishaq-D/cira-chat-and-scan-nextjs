import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Lock,
  ChevronDown,
  Camera,
  Pencil,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Stethoscope,
  Pill,
  User as UserIcon,
  Mail,
  CreditCard,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { getUser } from "@/lib/auth";

export type DrugDetails = {
  drug: string;
  form: string;
  strength: string;
  dosage: string;
};

export type ConsultAnswers = {
  healthChanges: { changed: boolean; detail: string };
  allergies: { had: boolean; detail: string };
  otherMeds: { taking: boolean; detail: string };
};

export type PatientInfo = {
  fullName: string;
  dob: string; // yyyy-mm-dd
  sex: "male" | "female" | "";
  weight: string;
  weightUnit: "kg" | "lbs";
  height: string;
  heightUnit: "cm" | "ftin";
};

export type RefillAnswers = {
  consent: boolean;
  drug: DrugDetails | null;
  submissionMode: "upload" | "manual" | null;
  consult: ConsultAnswers;
  patient: PatientInfo;
  email: string;
  paid: boolean;
};

const REFILL_PRICE_CENTS = 500;
const REFILL_PRICE_DISPLAY = "$5.00";
const PRESCRIBER_NAME = "Dr. Didier Decamps";
const PRESCRIBER_CLINIC = "CLINIQUE DE LA BRISEE";

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

const emptyAnswers = (): RefillAnswers => ({
  consent: false,
  drug: null,
  submissionMode: null,
  consult: {
    healthChanges: { changed: false, detail: "" },
    allergies: { had: false, detail: "" },
    otherMeds: { taking: false, detail: "" },
  },
  patient: detectPatientDefaults(),
  email: "",
  paid: false,
});

function detectPatientDefaults(): PatientInfo {
  const locale = (typeof navigator !== "undefined" && navigator.language) || "en-US";
  const usesImperial = /^(en-US|en-GB|en-CA|my)/i.test(locale);
  const existing = typeof window !== "undefined" ? getUser() : null;
  return {
    fullName: existing?.name || "",
    dob: "",
    sex: "",
    weight: "",
    weightUnit: usesImperial ? "lbs" : "kg",
    height: "",
    heightUnit: usesImperial ? "ftin" : "cm",
  };
}

// Flagging logic stub. Replace with backend call when available.
function evaluateConsult(c: ConsultAnswers): boolean {
  const flagKeywords = [
    "pregnan",
    "chest pain",
    "faint",
    "blood pressure",
    "diabetes",
    "stroke",
    "anaphyl",
    "swelling",
    "heart",
    "kidney",
    "liver",
  ];
  const text = `${c.healthChanges.detail} ${c.allergies.detail} ${c.otherMeds.detail}`.toLowerCase();
  if (flagKeywords.some((k) => text.includes(k))) return true;
  // If user reported new allergies/reactions OR major health changes — flag for safety
  if (c.allergies.had) return true;
  if (c.healthChanges.changed && c.healthChanges.detail.trim().length > 0) return true;
  return false;
}

const PrescriptionRefillChat = ({ onExit, onComplete }: Props) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const localUser = typeof window !== "undefined" ? getUser() : null;
  const isLoggedIn = !!localUser;

  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<RefillAnswers>(emptyAnswers);

  // Step 2 sub-state
  type Sub2 =
    | "choose"
    | "upload-reading"
    | "manual-input"
    | "confirm"
    | "low-confidence"
    | "edit";
  const [sub2, setSub2] = useState<Sub2>("choose");
  const [manualValue, setManualValue] = useState("");
  const [editDraft, setEditDraft] = useState<DrugDetails | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3 sub-state
  type Sub3 =
    | "q1"
    | "q1-detail"
    | "q2"
    | "q2-detail"
    | "q3"
    | "q3-detail"
    | "reviewing"
    | "flagged"
    | "cleared";
  const [sub3, setSub3] = useState<Sub3>("q1");
  const [detailDraft, setDetailDraft] = useState("");

  // Step 4 sub-state
  type Sub4 =
    | "summary" // logged-in default
    | "edit" // logged-in editing
    | "g-name"
    | "g-dob"
    | "g-sex"
    | "g-weight"
    | "g-height"
    | "done";
  const [sub4, setSub4] = useState<Sub4>(isLoggedIn ? "summary" : "g-name");
  const [patientDraft, setPatientDraft] = useState<PatientInfo>(answers.patient);

  // Step 5 sub-state
  type Sub5 = "logged-confirm" | "logged-different" | "guest-ask" | "guest-confirm";
  const [sub5, setSub5] = useState<Sub5>(isLoggedIn ? "logged-confirm" : "guest-ask");
  const [emailDraft, setEmailDraft] = useState("");

  // Step 7 sub-state
  type Sub7 = "ready" | "processing" | "failed";
  const [sub7, setSub7] = useState<Sub7>("ready");
  // Mocked saved card flag — wire to real payment vault later.
  const savedCard = isLoggedIn ? ((localUser as unknown as { savedCard?: { brand: string; last4: string } })?.savedCard ?? null) : null;
  const hasSavedCard = !!savedCard;

  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<Set<string>>(new Set());

  const pushMsg = (m: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...m, id: `${Date.now()}-${Math.random()}` }]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, step, sub2, sub3, sub4, sub5, sub7]);

  // Seed AI prompts for each step + sub-state transitions
  useEffect(() => {
    const key = `step-${step}`;
    if (seededRef.current.has(key)) return;
    seededRef.current.add(key);

    if (step === 1) {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step1Intro") });
    } else if (step === 2) {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step2Prompt") });
    } else if (step === 3) {
      setSub3("q1");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q1") });
    } else if (step === 4) {
      setSub4(isLoggedIn ? "summary" : "g-name");
      setPatientDraft(answers.patient);
      pushMsg({
        role: "ai",
        kind: "text",
        text: isLoggedIn
          ? t("pages.prescriptionRefill.chat.step4PromptLogged")
          : t("pages.prescriptionRefill.chat.step4PromptGuest"),
      });
      if (!isLoggedIn) {
        pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQName") });
      }
    } else if (step === 5) {
      if (isLoggedIn) {
        const email = localUser?.email || "";
        setSub5("logged-confirm");
        setAnswers((a) => ({ ...a, email: a.email || email }));
        pushMsg({
          role: "ai",
          kind: "text",
          text: t("pages.prescriptionRefill.chat.step5LoggedPrompt", { email }),
        });
      } else {
        setSub5("guest-ask");
        pushMsg({
          role: "ai",
          kind: "text",
          text: t("pages.prescriptionRefill.chat.step5GuestPrompt"),
        });
      }
    } else if (step === 6) {
      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.step6Prompt"),
      });
    } else if (step === 7) {
      setSub7("ready");
      pushMsg({
        role: "ai",
        kind: "text",
        text: hasSavedCard
          ? t("pages.prescriptionRefill.chat.step7PromptSaved")
          : t("pages.prescriptionRefill.chat.step7PromptCheckout"),
      });
    } else if (step >= 8) {
      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.placeholderStep", { step }),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // --- Step 1 ---
  const handleConsent = () => {
    setAnswers((a) => ({ ...a, consent: true }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.consentAgree") });
    setTimeout(() => setStep(2), 250);
  };

  // --- Step 2 ---
  const handleChooseUpload = () => {
    setAnswers((a) => ({ ...a, submissionMode: "upload" }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.uploadPhoto") });
    fileRef.current?.click();
  };
  const handleChooseManual = () => {
    setAnswers((a) => ({ ...a, submissionMode: "manual" }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.typeManually") });
    setTimeout(() => {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.manualPrompt") });
      setSub2("manual-input");
    }, 250);
  };
  const handleFilePicked: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSub2("upload-reading");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.reading") });
    // TODO: real OCR.
    setTimeout(() => {
      const mock: DrugDetails = {
        drug: "Lisinopril",
        form: t("pages.prescriptionRefill.chat.formTablet"),
        strength: "10 mg",
        dosage: t("pages.prescriptionRefill.chat.dosageDaily"),
      };
      const isLow = Math.random() < 0.3;
      setAnswers((a) => ({ ...a, drug: mock }));
      if (isLow) {
        pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.lowConfidence") });
        setSub2("low-confidence");
      } else {
        setSub2("confirm");
      }
    }, 1800);
    e.target.value = "";
  };
  const handleManualSubmit = () => {
    const v = manualValue.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setManualValue("");
    setAnswers((a) => ({ ...a, drug: { drug: v, form: "—", strength: "—", dosage: "—" } }));
    setTimeout(() => setSub2("confirm"), 250);
  };
  const handleLooksGood = () => {
    if (!answers.drug) return;
    const d = answers.drug;
    pushMsg({ role: "user", kind: "text", text: `${d.drug} · ${d.strength} · ${d.form}` });
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
    fileRef.current?.click();
    setAnswers((a) => ({ ...a, submissionMode: "upload" }));
  };

  // --- Step 3 ---
  const yesNo = (yes: boolean) =>
    yes ? t("pages.prescriptionRefill.chat.yes") : t("pages.prescriptionRefill.chat.no");

  const runReview = (next: ConsultAnswers) => {
    setSub3("reviewing");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.reviewing") });
    // TODO: replace with backend call.
    setTimeout(() => {
      const flagged = evaluateConsult(next);
      if (flagged) {
        setSub3("flagged");
      } else {
        setSub3("cleared");
        pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.consultCleared") });
        setTimeout(() => setStep(4), 600);
      }
    }, 1400);
  };

  const handleQ1 = (yes: boolean) => {
    pushMsg({ role: "user", kind: "text", text: yesNo(yes) });
    if (yes) {
      setSub3("q1-detail");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q1DetailPrompt") });
    } else {
      setAnswers((a) => ({ ...a, consult: { ...a.consult, healthChanges: { changed: false, detail: "" } } }));
      setSub3("q2");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q2") });
    }
  };
  const handleQ1Detail = () => {
    const v = detailDraft.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setAnswers((a) => ({ ...a, consult: { ...a.consult, healthChanges: { changed: true, detail: v } } }));
    setDetailDraft("");
    setSub3("q2");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q2") });
  };
  const handleQ2 = (yes: boolean) => {
    pushMsg({ role: "user", kind: "text", text: yesNo(yes) });
    if (yes) {
      setSub3("q2-detail");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q2DetailPrompt") });
    } else {
      setAnswers((a) => ({ ...a, consult: { ...a.consult, allergies: { had: false, detail: "" } } }));
      setSub3("q3");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q3") });
    }
  };
  const handleQ2Detail = () => {
    const v = detailDraft.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setAnswers((a) => ({ ...a, consult: { ...a.consult, allergies: { had: true, detail: v } } }));
    setDetailDraft("");
    setSub3("q3");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q3") });
  };
  const handleQ3 = (yes: boolean) => {
    pushMsg({ role: "user", kind: "text", text: yesNo(yes) });
    if (yes) {
      setSub3("q3-detail");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.q3DetailPrompt") });
    } else {
      const next: ConsultAnswers = {
        ...answers.consult,
        otherMeds: { taking: false, detail: "" },
      };
      setAnswers((a) => ({ ...a, consult: next }));
      runReview(next);
    }
  };
  const handleQ3Detail = () => {
    const v = detailDraft.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    const next: ConsultAnswers = {
      ...answers.consult,
      otherMeds: { taking: true, detail: v },
    };
    setAnswers((a) => ({ ...a, consult: next }));
    setDetailDraft("");
    runReview(next);
  };

  const handleStartOver = () => {
    setMessages([]);
    setAnswers(emptyAnswers());
    setSub2("choose");
    setSub3("q1");
    setSub4(isLoggedIn ? "summary" : "g-name");
    setManualValue("");
    setDetailDraft("");
    seededRef.current = new Set();
    setStep(1);
  };

  const handleBookDoctor = () => navigate("/real-doctors");

  // --- Step 4 ---
  const handleUseProfile = () => {
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.useTheseDetails") });
    setAnswers((a) => ({ ...a, patient: patientDraft }));
    setTimeout(() => setStep(5), 250);
  };
  const handleSaveProfileEdit = () => {
    setAnswers((a) => ({ ...a, patient: patientDraft }));
    setSub4("summary");
  };

  const handleGName = (v: string) => {
    const val = v.trim();
    if (!val) return;
    pushMsg({ role: "user", kind: "text", text: val });
    setPatientDraft((p) => ({ ...p, fullName: val }));
    setSub4("g-dob");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQDob") });
  };
  const handleGDob = (dob: string) => {
    if (!dob) return;
    pushMsg({ role: "user", kind: "text", text: formatDobDisplay(dob) });
    setPatientDraft((p) => ({ ...p, dob }));
    setSub4("g-sex");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQSex") });
  };
  const handleGSex = (sex: "male" | "female") => {
    pushMsg({
      role: "user",
      kind: "text",
      text: sex === "male" ? t("pages.prescriptionRefill.chat.male") : t("pages.prescriptionRefill.chat.female"),
    });
    setPatientDraft((p) => ({ ...p, sex }));
    setSub4("g-weight");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQWeight") });
  };
  const handleGWeight = (val: string, unit: "kg" | "lbs") => {
    const v = val.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: `${v} ${unit}` });
    setPatientDraft((p) => ({ ...p, weight: v, weightUnit: unit }));
    setSub4("g-height");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQHeight") });
  };
  const handleGHeight = (val: string, unit: "cm" | "ftin") => {
    const v = val.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: `${v} ${unit === "cm" ? "cm" : "ft/in"}` });
    const finalDraft: PatientInfo = { ...patientDraft, height: v, heightUnit: unit };
    setPatientDraft(finalDraft);
    setAnswers((a) => ({ ...a, patient: finalDraft }));
    setSub4("done");
    setTimeout(() => setStep(5), 350);
  };

  // --- Step 5 ---
  const handleConfirmLoggedEmail = () => {
    const email = answers.email || localUser?.email || "";
    setAnswers((a) => ({ ...a, email }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.sendHere") });
    setTimeout(() => setStep(6), 250);
  };
  const handleUseDifferentEmail = () => {
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.useDifferentEmail") });
    setSub5("logged-different");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step5GuestPrompt") });
  };
  const handleEmailSubmit = (email: string) => {
    const v = email.trim();
    if (!isValidEmail(v)) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setAnswers((a) => ({ ...a, email: v }));
    setEmailDraft("");
    setSub5("guest-confirm");
    pushMsg({
      role: "ai",
      kind: "text",
      text: t("pages.prescriptionRefill.chat.step5ConfirmPrompt"),
    });
  };
  const handleEmailConfirmYes = () => {
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.emailConfirmYes") });
    setTimeout(() => setStep(6), 250);
  };
  const handleEmailConfirmEdit = () => {
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.edit") });
    setSub5(isLoggedIn ? "logged-different" : "guest-ask");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step5GuestPrompt") });
  };

  // --- Step 6 ---
  const handleConfirmAndPay = () => {
    pushMsg({
      role: "user",
      kind: "text",
      text: t("pages.prescriptionRefill.chat.confirmAndPay", { price: REFILL_PRICE_DISPLAY }),
    });
    setTimeout(() => setStep(7), 250);
  };
  const handleEditFromSummary = () => {
    // Back to step 4 to edit patient details
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.editDetails") });
    seededRef.current.delete(`step-4`);
    seededRef.current.delete(`step-5`);
    seededRef.current.delete(`step-6`);
    setSub4(isLoggedIn ? "edit" : "g-name");
    setStep(4);
  };

  // --- Step 7 ---
  const handlePay = async () => {
    setSub7("processing");
    // TODO: replace with real Stripe call.
    await new Promise((r) => setTimeout(r, 1600));
    const ok = Math.random() > 0.15;
    if (!ok) {
      setSub7("failed");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.paymentFailed") });
      return;
    }
    setAnswers((a) => ({ ...a, paid: true }));
    pushMsg({
      role: "user",
      kind: "text",
      text: t("pages.prescriptionRefill.chat.paid", { price: REFILL_PRICE_DISPLAY }),
    });
    setTimeout(() => setStep(8), 300);
  };
  const handleRetryPayment = () => {
    setSub7("ready");
  };

  // --- Back ---
  const handleBack = () => {
    if (step === 1) return onExit();
    if (step === 7 && sub7 === "processing") return; // block during payment
    seededRef.current.delete(`step-${step}`);
    setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
    if (step === 2) setSub2("choose");
    if (step === 3) setSub3("q1");
    if (step === 4) setSub4(isLoggedIn ? "summary" : "g-name");
    if (step === 5) setSub5(isLoggedIn ? "logged-confirm" : "guest-ask");
    if (step === 7) setSub7("ready");
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

        {/* Step 1 */}
        {step === 1 && !answers.consent && (
          <Bubble role="ai" wide>
            <ConsentCard onAgree={handleConsent} />
          </Bubble>
        )}

        {/* Step 2 */}
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
              <span style={{ fontSize: 16 }}>{t("pages.prescriptionRefill.chat.reading")}</span>
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
                pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.manualPrompt") });
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

        {/* Step 3 */}
        {step === 3 && (sub3 === "q1" || sub3 === "q2" || sub3 === "q3") && (
          <Bubble role="ai" wide>
            <YesNoButtons
              onYes={() =>
                sub3 === "q1" ? handleQ1(true) : sub3 === "q2" ? handleQ2(true) : handleQ3(true)
              }
              onNo={() =>
                sub3 === "q1" ? handleQ1(false) : sub3 === "q2" ? handleQ2(false) : handleQ3(false)
              }
              yesLabel={t("pages.prescriptionRefill.chat.yes")}
              noLabel={t("pages.prescriptionRefill.chat.no")}
            />
          </Bubble>
        )}
        {step === 3 && sub3 === "reviewing" && (
          <Bubble role="ai">
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span style={{ fontSize: 16 }}>{t("pages.prescriptionRefill.chat.reviewing")}</span>
            </div>
          </Bubble>
        )}
        {step === 3 && sub3 === "flagged" && (
          <Bubble role="ai" wide>
            <FlaggedCard
              onBook={handleBookDoctor}
              onStartOver={handleStartOver}
              bookLabel={t("pages.prescriptionRefill.chat.bookDoctor")}
              startOverLabel={t("pages.prescriptionRefill.chat.startOver")}
              title={t("pages.prescriptionRefill.chat.flaggedTitle")}
              body={t("pages.prescriptionRefill.chat.flaggedBody")}
            />
          </Bubble>
        )}

        {/* Step 4 — logged-in */}
        {step === 4 && isLoggedIn && sub4 === "summary" && (
          <Bubble role="ai" wide>
            <ProfileSummaryCard
              info={patientDraft}
              onUse={handleUseProfile}
              onEdit={() => setSub4("edit")}
            />
          </Bubble>
        )}
        {step === 4 && isLoggedIn && sub4 === "edit" && (
          <Bubble role="ai" wide>
            <ProfileEditCard
              draft={patientDraft}
              setDraft={setPatientDraft}
              onCancel={() => setSub4("summary")}
              onSave={handleSaveProfileEdit}
            />
          </Bubble>
        )}

        {/* Step 4 — guest */}
        {step === 4 && !isLoggedIn && sub4 === "g-sex" && (
          <Bubble role="ai" wide>
            <div className="grid grid-cols-2 gap-3">
              <BigChoice
                label={t("pages.prescriptionRefill.chat.male")}
                onClick={() => handleGSex("male")}
              />
              <BigChoice
                label={t("pages.prescriptionRefill.chat.female")}
                onClick={() => handleGSex("female")}
              />
            </div>
          </Bubble>
        )}
        {step === 4 && !isLoggedIn && sub4 === "g-dob" && (
          <Bubble role="ai" wide>
            <DobPicker onSubmit={handleGDob} />
          </Bubble>
        )}
        {step === 4 && !isLoggedIn && sub4 === "g-weight" && (
          <Bubble role="ai" wide>
            <NumberWithUnit
              defaultUnit={patientDraft.weightUnit}
              units={["kg", "lbs"]}
              onSubmit={(v, u) => handleGWeight(v, u as "kg" | "lbs")}
              placeholder={t("pages.prescriptionRefill.chat.weightPlaceholder")}
            />
          </Bubble>
        )}
        {step === 4 && !isLoggedIn && sub4 === "g-height" && (
          <Bubble role="ai" wide>
            <NumberWithUnit
              defaultUnit={patientDraft.heightUnit}
              units={["cm", "ftin"]}
              onSubmit={(v, u) => handleGHeight(v, u as "cm" | "ftin")}
              placeholder={t("pages.prescriptionRefill.chat.heightPlaceholder")}
            />
          </Bubble>
        )}
      </div>

      {/* Bottom input bar */}
      {step === 2 && sub2 === "manual-input" && (
        <BottomInputBar
          value={manualValue}
          setValue={setManualValue}
          onSubmit={handleManualSubmit}
          placeholder={t("pages.prescriptionRefill.chat.manualPlaceholder")}
          buttonLabel={t("pages.prescriptionRefill.chat.continue")}
        />
      )}

      {step === 3 && (sub3 === "q1-detail" || sub3 === "q2-detail" || sub3 === "q3-detail") && (
        <BottomInputBar
          value={detailDraft}
          setValue={setDetailDraft}
          onSubmit={() => {
            if (sub3 === "q1-detail") handleQ1Detail();
            else if (sub3 === "q2-detail") handleQ2Detail();
            else handleQ3Detail();
          }}
          placeholder={t("pages.prescriptionRefill.chat.detailPlaceholder")}
          buttonLabel={t("pages.prescriptionRefill.chat.continue")}
        />
      )}

      {step === 4 && !isLoggedIn && sub4 === "g-name" && (
        <NameInputBar
          onSubmit={handleGName}
          placeholder={t("pages.prescriptionRefill.chat.namePlaceholder")}
          buttonLabel={t("pages.prescriptionRefill.chat.continue")}
        />
      )}

      {step >= 5 && (
        <div className="border-t border-border bg-background px-3 sm:px-5 py-4 text-center text-sm text-muted-foreground">
          {t("pages.prescriptionRefill.chat.placeholderHint")}
        </div>
      )}
    </div>
  );
};

function formatDobDisplay(dob: string) {
  // dob: yyyy-mm-dd → dd/mm/yyyy
  const [y, m, d] = dob.split("-");
  if (!y || !m || !d) return dob;
  return `${d}/${m}/${y}`;
}

// ============= Shared UI =============

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

const BottomInputBar = ({
  value,
  setValue,
  onSubmit,
  placeholder,
  buttonLabel,
}: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  buttonLabel: string;
}) => (
  <div className="border-t border-border bg-background px-3 sm:px-5 py-3">
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder={placeholder}
        autoFocus
        className="flex-1 rounded-full border border-border bg-card px-5 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        style={{ fontSize: 16, minHeight: 48 }}
      />
      <button
        onClick={onSubmit}
        disabled={!value.trim()}
        className="px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        style={{ minHeight: 48, fontSize: 16 }}
      >
        {buttonLabel}
      </button>
    </div>
  </div>
);

const NameInputBar = ({
  onSubmit,
  placeholder,
  buttonLabel,
}: {
  onSubmit: (v: string) => void;
  placeholder: string;
  buttonLabel: string;
}) => {
  const [v, setV] = useState("");
  return (
    <BottomInputBar
      value={v}
      setValue={setV}
      onSubmit={() => {
        onSubmit(v);
        setV("");
      }}
      placeholder={placeholder}
      buttonLabel={buttonLabel}
    />
  );
};

// ============= Step 1 =============

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
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
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
          <Link to="/privacy" className="inline-block text-primary underline underline-offset-2 hover:opacity-80">
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
    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    <p className="text-foreground mt-0.5">{value}</p>
  </div>
);

// ============= Step 2 =============

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
    <span className="text-muted-foreground" style={{ fontSize: 14 }}>{label}</span>
    <span className="text-foreground font-medium text-right" style={{ fontSize: 15 }}>{value}</span>
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

// ============= Step 3 =============

const YesNoButtons = ({
  onYes,
  onNo,
  yesLabel,
  noLabel,
}: {
  onYes: () => void;
  onNo: () => void;
  yesLabel: string;
  noLabel: string;
}) => (
  <div className="grid grid-cols-2 gap-3">
    <button
      onClick={onNo}
      className="rounded-full border border-border bg-background text-foreground font-semibold hover:bg-accent transition-colors"
      style={{ minHeight: 52, fontSize: 16 }}
    >
      {noLabel}
    </button>
    <button
      onClick={onYes}
      className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
      style={{ minHeight: 52, fontSize: 16 }}
    >
      {yesLabel}
    </button>
  </div>
);

const FlaggedCard = ({
  onBook,
  onStartOver,
  bookLabel,
  startOverLabel,
  title,
  body,
}: {
  onBook: () => void;
  onStartOver: () => void;
  bookLabel: string;
  startOverLabel: string;
  title: string;
  body: string;
}) => (
  <div className="space-y-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h3 className="font-semibold text-foreground" style={{ fontSize: 17 }}>
          {title}
        </h3>
        <p className="mt-1.5 text-foreground/85 leading-relaxed" style={{ fontSize: 15 }}>
          {body}
        </p>
      </div>
    </div>
    <button
      onClick={onBook}
      className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
      style={{ minHeight: 52, fontSize: 16 }}
    >
      <Stethoscope className="w-5 h-5" />
      {bookLabel}
    </button>
    <button
      onClick={onStartOver}
      className="w-full rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
      style={{ minHeight: 48, fontSize: 15 }}
    >
      {startOverLabel}
    </button>
  </div>
);

// ============= Step 4 =============

const ProfileSummaryCard = ({
  info,
  onUse,
  onEdit,
}: {
  info: PatientInfo;
  onUse: () => void;
  onEdit: () => void;
}) => {
  const { t } = useTranslation();
  const rows: Array<{ label: string; value: string }> = [
    { label: t("pages.prescriptionRefill.chat.pName"), value: info.fullName || "—" },
    { label: t("pages.prescriptionRefill.chat.pDob"), value: info.dob ? formatDobDisplay(info.dob) : "—" },
    {
      label: t("pages.prescriptionRefill.chat.pSex"),
      value: info.sex
        ? info.sex === "male"
          ? t("pages.prescriptionRefill.chat.male")
          : t("pages.prescriptionRefill.chat.female")
        : "—",
    },
    {
      label: t("pages.prescriptionRefill.chat.pWeight"),
      value: info.weight ? `${info.weight} ${info.weightUnit}` : "—",
    },
    {
      label: t("pages.prescriptionRefill.chat.pHeight"),
      value: info.height ? `${info.height} ${info.heightUnit === "cm" ? "cm" : "ft/in"}` : "—",
    },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-background/60 border border-border divide-y divide-border">
        {rows.map((r) => (
          <Row key={r.label} label={r.label} value={r.value} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onEdit}
          className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.edit")}
        </button>
        <button
          onClick={onUse}
          className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.useTheseDetails")}
        </button>
      </div>
    </div>
  );
};

const ProfileEditCard = ({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: PatientInfo;
  setDraft: (d: PatientInfo) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <FieldLabel>{t("pages.prescriptionRefill.chat.pName")}</FieldLabel>
      <TextField value={draft.fullName} onChange={(v) => setDraft({ ...draft, fullName: v })} />

      <FieldLabel>{t("pages.prescriptionRefill.chat.pDob")}</FieldLabel>
      <TextField
        type="date"
        value={draft.dob}
        onChange={(v) => setDraft({ ...draft, dob: v })}
      />

      <FieldLabel>{t("pages.prescriptionRefill.chat.pSex")}</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {(["male", "female"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setDraft({ ...draft, sex: s })}
            className={`rounded-full border font-medium transition-all ${
              draft.sex === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-foreground hover:bg-accent"
            }`}
            style={{ minHeight: 48, fontSize: 15 }}
          >
            {s === "male"
              ? t("pages.prescriptionRefill.chat.male")
              : t("pages.prescriptionRefill.chat.female")}
          </button>
        ))}
      </div>

      <FieldLabel>{t("pages.prescriptionRefill.chat.pWeight")}</FieldLabel>
      <UnitRow
        value={draft.weight}
        unit={draft.weightUnit}
        units={["kg", "lbs"]}
        onChange={(v, u) => setDraft({ ...draft, weight: v, weightUnit: u as "kg" | "lbs" })}
      />

      <FieldLabel>{t("pages.prescriptionRefill.chat.pHeight")}</FieldLabel>
      <UnitRow
        value={draft.height}
        unit={draft.heightUnit}
        units={["cm", "ftin"]}
        onChange={(v, u) => setDraft({ ...draft, height: v, heightUnit: u as "cm" | "ftin" })}
      />

      <div className="grid grid-cols-2 gap-2 pt-2">
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

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
    {children}
  </label>
);

const TextField = ({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    style={{ fontSize: 16, minHeight: 48 }}
  />
);

const UnitRow = ({
  value,
  unit,
  units,
  onChange,
}: {
  value: string;
  unit: string;
  units: string[];
  onChange: (val: string, unit: string) => void;
}) => (
  <div className="flex gap-2">
    <input
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value, unit)}
      className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      style={{ fontSize: 16, minHeight: 48 }}
    />
    <div className="flex rounded-full border border-border bg-background overflow-hidden">
      {units.map((u) => (
        <button
          key={u}
          onClick={() => onChange(value, u)}
          className={`px-4 font-medium transition-colors ${
            unit === u ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent"
          }`}
          style={{ minHeight: 48, fontSize: 14 }}
        >
          {u === "ftin" ? "ft/in" : u}
        </button>
      ))}
    </div>
  </div>
);

const BigChoice = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="rounded-2xl bg-background border border-border text-foreground hover:bg-accent hover:border-primary/40 transition-all font-medium"
    style={{ minHeight: 64, fontSize: 16 }}
  >
    {label}
  </button>
);

const DobPicker = ({ onSubmit }: { onSubmit: (dob: string) => void }) => {
  const { t } = useTranslation();
  const [d, setD] = useState("");
  const [m, setM] = useState("");
  const [y, setY] = useState("");
  const valid = useMemo(() => {
    const dn = +d, mn = +m, yn = +y;
    if (!dn || !mn || !yn) return false;
    if (mn < 1 || mn > 12) return false;
    if (dn < 1 || dn > 31) return false;
    if (yn < 1900 || yn > new Date().getFullYear()) return false;
    return true;
  }, [d, m, y]);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder={t("pages.prescriptionRefill.chat.dd")}
          value={d}
          onChange={(e) => setD(e.target.value.slice(0, 2))}
          className="rounded-xl border border-border bg-background px-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontSize: 16, minHeight: 52 }}
        />
        <input
          type="number"
          inputMode="numeric"
          placeholder={t("pages.prescriptionRefill.chat.mm")}
          value={m}
          onChange={(e) => setM(e.target.value.slice(0, 2))}
          className="rounded-xl border border-border bg-background px-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontSize: 16, minHeight: 52 }}
        />
        <input
          type="number"
          inputMode="numeric"
          placeholder={t("pages.prescriptionRefill.chat.yyyy")}
          value={y}
          onChange={(e) => setY(e.target.value.slice(0, 4))}
          className="rounded-xl border border-border bg-background px-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontSize: 16, minHeight: 52 }}
        />
      </div>
      <button
        onClick={() => {
          if (!valid) return;
          const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
          onSubmit(iso);
        }}
        disabled={!valid}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        style={{ minHeight: 48, fontSize: 16 }}
      >
        {t("pages.prescriptionRefill.chat.continue")}
      </button>
    </div>
  );
};

const NumberWithUnit = ({
  defaultUnit,
  units,
  onSubmit,
  placeholder,
}: {
  defaultUnit: string;
  units: string[];
  onSubmit: (value: string, unit: string) => void;
  placeholder: string;
}) => {
  const { t } = useTranslation();
  const [val, setVal] = useState("");
  const [unit, setUnit] = useState(defaultUnit);
  return (
    <div className="space-y-3">
      <UnitRow
        value={val}
        unit={unit}
        units={units}
        onChange={(v, u) => {
          setVal(v);
          setUnit(u);
        }}
      />
      <input
        type="hidden"
        value={placeholder}
        readOnly
      />
      <button
        onClick={() => onSubmit(val, unit)}
        disabled={!val.trim()}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        style={{ minHeight: 48, fontSize: 16 }}
      >
        {t("pages.prescriptionRefill.chat.continue")}
      </button>
    </div>
  );
};

export default PrescriptionRefillChat;
