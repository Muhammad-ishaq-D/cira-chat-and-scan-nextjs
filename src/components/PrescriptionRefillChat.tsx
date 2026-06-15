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
  Copy,
  Check,
  X,
  Search,
} from "lucide-react";
import drugsData from "@/data/drugs.json";

import { getToken, getUser } from "@/lib/auth";
import { STRIPE_PAYMENT_LINKS } from "@/lib/stripe";
import { getDeviceId } from "@/lib/freeCredits";
import ciraLogo from "@/assets/cira-logo.svg";
import HealthScreeningChat from "@/components/HealthScreeningChat";

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

const API_BASE = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env
  .VITE_API_URL || "https://askainurse.com";

const newRefillId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `refill_${Date.now()}_${Math.random().toString(36).slice(2)}`;
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

 
  // refill_id is read from localStorage (saved before Stripe redirect) because
  // Stripe only injects {CHECKOUT_SESSION_ID} into the return URL — not client_reference_id.
  const initialFromUrl = (() => {
    if (typeof window === "undefined") return { step: 1 as number, refillId: newRefillId(), outcome: null as null | "success" | "cancel" };
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    if (status === "success" || status === "cancel") {
      const rid = localStorage.getItem("cira_pending_refill_id") || "";
      if (status === "success") localStorage.removeItem("cira_pending_refill_id");
      if (rid) return { step: 8, refillId: rid, outcome: status as "success" | "cancel" };
    }
    return { step: 1, refillId: newRefillId(), outcome: null as null | "success" | "cancel" };
  })();

  // Shared refill_id for the whole flow — every step endpoint references this.
  const [refillId, setRefillId] = useState<string>(initialFromUrl.refillId);
  const [creatingRefill, setCreatingRefill] = useState(false);

  const [step, setStep] = useState<number>(initialFromUrl.step);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [answers, setAnswers] = useState<RefillAnswers>(emptyAnswers);

  // Mode selection (before any step)
  const [mode, setMode] = useState<null | "upload" | "manual">(null);

  // Step 2 sub-state
  type Sub2 =
    | "upload-pending"
    | "choose"
    | "upload-reading"
    | "availability-check"
    | "manual-input"
    | "confirm"
    | "low-confidence"
    | "edit";
  const [sub2, setSub2] = useState<Sub2>("upload-pending");
  const [ocrResults, setOcrResults] = useState<Array<{ name: string; available: boolean; match: DrugRow | null }>>([]);
  const [manualValue, setManualValue] = useState("");
  const [editDraft, setEditDraft] = useState<DrugDetails | null>(null);
  const [lastCaptureMethod, setLastCaptureMethod] = useState<"camera" | "upload" | null>(null);
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
  // Token returned by the AI screening backend when the consult is cleared.
  const [, setConsultClearanceToken] = useState<string>("");

  // Step 4 sub-state — everyone (guest and logged-in) types from scratch every time.
  type Sub4 =
    | "g-name"
    | "g-dob"
    | "g-sex"
    | "g-weight"
    | "g-height"
    | "done";
  const [sub4, setSub4] = useState<Sub4>("g-name");
  const [patientDraft, setPatientDraft] = useState<PatientInfo>(answers.patient);

  // Step 5 sub-state
  type Sub5 = "logged-confirm" | "logged-different" | "guest-ask" | "guest-confirm";
  const [sub5, setSub5] = useState<Sub5>(isLoggedIn ? "logged-confirm" : "guest-ask");
  const [emailDraft, setEmailDraft] = useState("");

  // Step 7 sub-state
  type Sub7 = "ready" | "processing" | "failed";
  const [sub7, setSub7] = useState<Sub7>("ready");

  // Step 8 sub-state — outcome from Stripe + polling.
  type Sub8 = "pending" | "paid" | "canceled" | "failed";
  const [sub8, setSub8] = useState<Sub8>(
    initialFromUrl.outcome === "cancel" ? "canceled" : "pending"
  );
  const [emailStatus, setEmailStatus] = useState<"pending" | "sent" | "failed">("pending");

  // Step 8 state
  const [refNumber, setRefNumber] = useState<string>("");
  const [signupDismissed, setSignupDismissed] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<Set<string>>(new Set());

  const pushMsg = (m: Omit<ChatMessage, "id">) =>
    setMessages((prev) => [...prev, { ...m, id: `${Date.now()}-${Math.random()}` }]);


  // Clean Stripe redirect params from the URL once consumed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.search) return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("status") || params.has("refill_id")) {
      const url = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", url);
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const doScroll = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      doScroll();
      // Repeat to catch late renders / dynamic heights
      const t1 = setTimeout(doScroll, 150);
      const t2 = setTimeout(doScroll, 400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [messages, step, sub2, sub3, sub4, sub5, sub7]);

  // Auto-open the camera/file picker when the upload path lands on step 2.
  useEffect(() => {
    if (step === 2 && sub2 === "upload-pending") {
      const timer = setTimeout(() => fileRef.current?.click(), 150);
      return () => clearTimeout(timer);
    }
  }, [step, sub2]);

  // Seed AI prompts for each step + sub-state transitions
  useEffect(() => {
    const key = `step-${step}`;
    if (seededRef.current.has(key)) return;
    seededRef.current.add(key);

    if (step === 1) {
      // Step 1 renders a dedicated hero screen — no chat intro message.
    } else if (step === 2) {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step2Prompt") });
    } else if (step === 3) {
      // Step 3 is rendered by the isolated <HealthScreeningChat /> component.
      // No prompts are seeded into the main chat history here.
    } else if (step === 4) {
      // Everyone (guest and logged-in) types from scratch every time. No prefill card.
      setSub4("g-name");
      setPatientDraft(emptyAnswers().patient);
      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.step4PromptGuest"),
      });
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.gQName") });
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
        text: t("pages.prescriptionRefill.chat.step7PromptCheckout"),
      });
    } else if (step === 8) {
      // Step 8 result screen — the reference code is generated server-side by
      // the Stripe payment webhook and returned through the polling endpoint.
      // We never generate it client-side.
      onComplete?.({ ...answers, paid: sub8 === "paid" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // --- Step 8: poll backend for payment + email status until resolved ---
  useEffect(() => {
    if (step !== 8) return;
    if (sub8 === "canceled" || sub8 === "paid" || sub8 === "failed") return;
    if (!refillId) return;
    let cancelled = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const res = await fetch(`${API_BASE}/api/prescription/status/${encodeURIComponent(refillId)}`);
        if (res.ok) {
          const data = (await res.json()) as {
            payment_status?: "pending" | "paid" | "failed";
            email_status?: "pending" | "sent" | "failed";
            reference_code?: string | null;
          };
          if (!cancelled) {
            if (data.reference_code) setRefNumber(data.reference_code);
            if (data.email_status) setEmailStatus(data.email_status);
            if (data.payment_status === "paid") {
              setSub8("paid");
              setAnswers((a) => ({ ...a, paid: true }));
              // Persist to local refill history for logged-in users
              if (isLoggedIn && typeof window !== "undefined" && data.reference_code) {
                try {
                  const raw = window.localStorage.getItem("cira_refill_history");
                  const list = raw ? JSON.parse(raw) : [];
                  list.unshift({
                    ref: data.reference_code,
                    date: new Date().toISOString(),
                    drug: answers.drug?.drug || "",
                    strength: answers.drug?.strength || "",
                    email: answers.email,
                    priceCents: REFILL_PRICE_CENTS,
                  });
                  window.localStorage.setItem("cira_refill_history", JSON.stringify(list.slice(0, 50)));
                } catch {
                  // ignore storage errors
                }
              }
              return;
            }
            if (data.payment_status === "failed") {
              setSub8("failed");
              return;
            }
          }
        }
      } catch {
        // network blip — keep polling
      }
      // Give up after ~2 minutes of polling
      if (!cancelled && attempts < 60) {
        setTimeout(tick, 2000);
      }
    };
    tick();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sub8, refillId]);


  // --- Step 1 ---
  const handleConsent = () => {
    setAnswers((a) => ({ ...a, consent: true }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.consentAgree") });
    setTimeout(() => setStep(2), 250);
  };
  const handleStep1Submit = async (medications: DrugRow[]) => {
    const selectedDrugs = medications.filter((m) => m.product_name?.trim() || m.inn_name?.trim());
    const names = selectedDrugs.map((m) => m.product_name.trim()).filter(Boolean);
    if (names.length === 0 || creatingRefill) return;
    const joined = names.join(", ");
    setCreatingRefill(true);
    try {
      const token = getToken() || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/prescription/create-refill`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cira_device_id: getDeviceId(),
          user_id: localUser?.id || null,
          is_guest: !isLoggedIn,
          gdpr_consent: true,
        }),
      });
      if (!res.ok) throw new Error(`Refill session failed (${res.status})`);
      const data = (await res.json()) as { refill_id?: number | string };
      if (!data.refill_id) throw new Error("Missing refill session");

      const newRid = String(data.refill_id);
      setRefillId(newRid);
      setAnswers((a) => ({
        ...a,
        consent: true,
        submissionMode: "manual",
        drug: { drug: joined, form: "—", strength: "—", dosage: "—" },
      }));
      pushMsg({ role: "user", kind: "text", text: joined });

      // Persist medications to DB — required for prescriptions and refund records.
      const medsRes = await fetch(
        `${API_BASE}/api/prescription/refill/${encodeURIComponent(newRid)}/medications`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            medications: selectedDrugs.map((d) => ({
              drug_name_inn: d.product_name || d.inn_name,
              form: d.form || "Not specified",
              strength: d.available_strengths && d.available_strengths !== "N/A" ? d.available_strengths : "Not specified",
              dosage_instructions: "As previously prescribed",
              quantity: 1,
            })),
          }),
        }
      );
      if (!medsRes.ok) throw new Error(`Medication save failed (${medsRes.status})`);

      // Skip step 2 (medication is already captured) → go straight to health check.
      seededRef.current.add("step-2");
      setTimeout(() => setStep(3), 200);
    } catch {
      pushMsg({
        role: "ai",
        kind: "text",
        text: "I couldn't start your refill session. Please try again in a moment.",
      });
    } finally {
      setCreatingRefill(false);
    }
  };

  // Upload path: create a bare refill session (no medications yet — OCR will provide them).
  const handleStep1Upload = async () => {
    if (creatingRefill) return;
    setCreatingRefill(true);
    try {
      const token = getToken() || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_BASE}/api/prescription/create-refill`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          cira_device_id: getDeviceId(),
          user_id: localUser?.id || null,
          is_guest: !isLoggedIn,
          gdpr_consent: true,
        }),
      });
      if (!res.ok) throw new Error(`Refill session failed (${res.status})`);
      const data = (await res.json()) as { refill_id?: number | string };
      if (!data.refill_id) throw new Error("Missing refill session");
      const newRid = String(data.refill_id);
      setRefillId(newRid);
      setAnswers((a) => ({ ...a, consent: true, submissionMode: "upload" }));
      seededRef.current.add("step-2");
      setSub2("upload-pending");
      setStep(2);
    } catch {
      // Could surface a toast here if needed
    } finally {
      setCreatingRefill(false);
    }
  };

  // --- Step 2 ---
  const handleFilePicked: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset input immediately so re-upload works

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== "undefined" ? navigator.userAgent : ""
    );
    setLastCaptureMethod(isMobile ? "camera" : "upload");
    setSub2("upload-reading");

    try {
      // Build multipart/form-data payload with the image
      const formData = new FormData();
      formData.append("file", file);

      const token = getToken() || "";
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE}/api/prescription/ocr-image`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = (await res.json()) as { medications?: string[]; error?: string };

      // Graceful degradation: if the endpoint returned an error but also medications (empty), still handle it
      const extractedNames: string[] = Array.isArray(data.medications) ? data.medications : [];

      if (!res.ok && extractedNames.length === 0) {
        throw new Error(data.error || `Server error (${res.status})`);
      }

      // Match each extracted name against our local drugs database
      const results = extractedNames.map((name) => {
        const q = name.toLowerCase();
        const match =
          DRUGS.find(
            (d) =>
              d.product_name.toLowerCase().includes(q) ||
              d.inn_name.toLowerCase().includes(q) ||
              q.includes(d.product_name.toLowerCase()) ||
              q.includes(d.inn_name.toLowerCase())
          ) || null;
        return { name, available: !!match, match };
      });

      if (extractedNames.length === 0) {
        // No medications found in image — show error and let user retry or type manually
        pushMsg({
          role: "ai",
          kind: "text",
          text: t(
            "pages.prescriptionRefill.chat.ocrNoMeds",
            "I couldn't find any medication names in the image. Please try a clearer photo or enter your medication manually."
          ),
        });
        setSub2("upload-pending");
        return;
      }

      setOcrResults(results);

      // Pre-fill answers.drug with available medications
      const available = results.filter((r) => r.available);
      if (available.length > 0) {
        const names = available.map((r) => r.name).join(", ");
        setAnswers((a) => ({ ...a, drug: { drug: names, form: "—", strength: "—", dosage: "—" } }));
      }

      pushMsg({
        role: "ai",
        kind: "text",
        text: t("pages.prescriptionRefill.chat.ocrDone", "Here's what I found in your prescription:"),
      });
      setSub2("availability-check");
    } catch (err) {
      console.error("[OCR] Failed to scan prescription:", err);
      pushMsg({
        role: "ai",
        kind: "node",
        node: (
          <div className="space-y-2">
            <p style={{ fontSize: 14 }}>
              {t(
                "pages.prescriptionRefill.chat.ocrError",
                "I had trouble reading that image. Please try again with a clearer photo, or enter your medication manually."
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSub2("upload-pending");
                  fileRef.current?.click();
                }}
                className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors px-4"
                style={{ minHeight: 40, fontSize: 14 }}
              >
                {lastCaptureMethod === "upload"
                  ? t("pages.prescriptionRefill.chat.reuploadPhoto", "Re-upload Photo")
                  : t("pages.prescriptionRefill.chat.retakePhoto", "Retake Photo")}
              </button>
              <button
                onClick={() => {
                  setSub2("manual-input");
                  pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.manualPrompt", "Please type the name of your medication.") });
                }}
                className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity px-4"
                style={{ minHeight: 40, fontSize: 14 }}
              >
                {t("pages.prescriptionRefill.chat.enterManually", "Enter Manually")}
              </button>
            </div>
          </div>
        ),
      });
      setSub2("manual-input");
    }
  };

  const handleManualSubmit = () => {
    const v = manualValue.trim();
    if (!v) return;
    pushMsg({ role: "user", kind: "text", text: v });
    setManualValue("");
    setAnswers((a) => ({ ...a, drug: { drug: v, form: "—", strength: "—", dosage: "—" } }));
    setTimeout(() => setSub2("confirm"), 250);
  };
  const handleProceedWithAvailable = async () => {
    const available = ocrResults.filter((r) => r.available);
    if (available.length === 0) return;
    const names = available.map((r) => r.name).join(", ");
    pushMsg({ role: "user", kind: "text", text: `Continue with: ${names}` });
    try {
      const token = getToken() || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const medsRes = await fetch(`${API_BASE}/api/prescription/refill/${encodeURIComponent(refillId)}/medications`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          medications: available.map((r) => ({
            drug_name_inn: r.match?.product_name || r.match?.inn_name || r.name,
            form: r.match?.form || "Not specified",
            strength:
              r.match?.available_strengths && r.match.available_strengths !== "N/A"
                ? r.match.available_strengths
                : "Not specified",
            dosage_instructions: "As previously prescribed",
            quantity: 1,
          })),
        }),
      });
      if (!medsRes.ok) throw new Error(`Medication save failed (${medsRes.status})`);
    } catch (err) {
      pushMsg({ role: "ai", kind: "text", text: "I couldn't save your medications. Please try again." });
      return;
    }
    setTimeout(() => setStep(3), 250);
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
    setSub2("upload-pending");
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
    setMode(null);
    setSub2("upload-pending");
    setOcrResults([]);
    setSub3("q1");
    setSub4("g-name");
    setManualValue("");
    setDetailDraft("");
    seededRef.current = new Set();
    setStep(1);
  };

  const handleBookDoctor = () => navigate("/real-doctors");

  // Persist patient info to backend so generate-and-send has it after payment.
  const persistPatientInfo = async (draft: PatientInfo) => {
    try {
      const token = getToken() || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/prescription/refill/${encodeURIComponent(refillId)}/patient-info`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          full_name: draft.fullName,
          dob: draft.dob,
          sex: draft.sex === "male" ? "Male" : "Female",
          weight_value: parseFloat(draft.weight),
          weight_unit: draft.weightUnit,
          height_value: parseFloat(draft.height),
          height_unit: draft.heightUnit === "ftin" ? "ft_in" : "cm",
        }),
      });
    } catch {
      // Non-blocking — flow continues; backend will be missing data if this fails
    }
  };

  // Persist delivery email to backend so generate-and-send knows where to send the PDF.
  const persistDeliveryEmail = async (email: string) => {
    try {
      const token = getToken() || "";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      await fetch(`${API_BASE}/api/prescription/refill/${encodeURIComponent(refillId)}/email`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email }),
      });
    } catch {
      // Non-blocking
    }
  };

  // --- Step 4 (everyone uses the guest typing flow — no prefill card) ---


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
    persistPatientInfo(finalDraft);
    setTimeout(() => setStep(5), 350);
  };

  // --- Step 5 ---
  const handleConfirmLoggedEmail = () => {
    const email = answers.email || localUser?.email || "";
    setAnswers((a) => ({ ...a, email }));
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.sendHere") });
    persistDeliveryEmail(email);
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
    persistDeliveryEmail(answers.email);
    setTimeout(() => setStep(6), 250);
  };
  const handleEmailConfirmEdit = () => {
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.edit") });
    setSub5(isLoggedIn ? "logged-different" : "guest-ask");
    pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.step5GuestPrompt") });
  };

  // --- Step 6 — redirect straight to Stripe, no intermediate card form ---
  const handleConfirmAndPay = async () => {
    pushMsg({
      role: "user",
      kind: "text",
      text: t("pages.prescriptionRefill.chat.confirmAndPay", { price: REFILL_PRICE_DISPLAY }),
    });
    try {
      const paymentLink = STRIPE_PAYMENT_LINKS.prescription_refill;
      if (!paymentLink || paymentLink.includes("REPLACE_WITH_REAL_LINK")) {
        throw new Error("Payment link not configured");
      }
      const params = new URLSearchParams();
      if (answers.email) params.set("prefilled_email", answers.email);
      if (refillId) params.set("client_reference_id", String(refillId));
      localStorage.setItem("cira_pending_refill_id", String(refillId));
      const qs = params.toString();
      window.location.href = qs ? `${paymentLink}?${qs}` : paymentLink;
    } catch {
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.paymentFailed") });
    }
  };
  const handleEditFromSummary = () => {
    // Back to step 4 to edit patient details
    pushMsg({ role: "user", kind: "text", text: t("pages.prescriptionRefill.chat.editDetails") });
    seededRef.current.delete(`step-4`);
    seededRef.current.delete(`step-5`);
    seededRef.current.delete(`step-6`);
    setSub4("g-name");
    setStep(4);
  };

  // --- Step 7 — redirect to Stripe Payment Link ---
  const handlePay = async () => {
    setSub7("processing");
    try {
      const paymentLink = STRIPE_PAYMENT_LINKS.prescription_refill;
      if (!paymentLink || paymentLink.includes("REPLACE_WITH_REAL_LINK")) {
        throw new Error("Payment link not configured");
      }
      const params = new URLSearchParams();
      if (answers.email) params.set("prefilled_email", answers.email);
      if (refillId) params.set("client_reference_id", String(refillId));
      // Store refill_id before leaving — Stripe return URL can't carry client_reference_id back.
      localStorage.setItem("cira_pending_refill_id", String(refillId));
      const qs = params.toString();
      window.location.href = qs ? `${paymentLink}?${qs}` : paymentLink;
    } catch {
      setSub7("failed");
      pushMsg({ role: "ai", kind: "text", text: t("pages.prescriptionRefill.chat.paymentFailed") });
    }
  };
  const handleRetryPayment = () => {
    setSub7("ready");
  };

  // --- Back ---
  const handleBack = () => {
    if (step === 1) {
      if (mode !== null) {
        setMode(null); // go back to mode selection screen
        return;
      }
      return onExit();
    }
    if (step === 7 && sub7 === "processing") return; // block during payment
    seededRef.current.delete(`step-${step}`);

    if (step === 2) {
      // Go back to mode selection regardless of upload/manual state.
      setMessages([]);
      setSub2("upload-pending");
      setOcrResults([]);
      setMode(null);
      setStep(1);
      return;
    }

    if (step === 3) {
      if (answers.submissionMode === "manual") {
        // Manual path skipped step 2 — go back to mode selection.
        seededRef.current.delete("step-2");
        setMessages([]);
        setSub2("upload-pending");
        setMode(null);
        setStep(1);
      } else {
        // Upload path — go back to availability-check card.
        setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
        setSub3("q1");
        setSub2(ocrResults.length > 0 ? "availability-check" : "upload-pending");
        setStep(2);
      }
      return;
    }

    setMessages((prev) => prev.slice(0, Math.max(0, prev.length - 2)));
    if (step === 4) setSub4("g-name");
    if (step === 5) setSub5(isLoggedIn ? "logged-confirm" : "guest-ask");
    if (step === 7) setSub7("ready");
    setStep((s) => s - 1);
  };


  // Group the 8 internal steps into 4 user-visible stages for the header.
  const stageInfo = (() => {
    if (step <= 2) return { index: 1, label: t("pages.prescriptionRefill.chat.stageFind", "Find a Prescription") };
    if (step === 3) return { index: 2, label: t("pages.prescriptionRefill.chat.stageHealth", "Quick Health Check") };
    if (step <= 5) return { index: 3, label: t("pages.prescriptionRefill.chat.stageDetails", "Your Details") };
    return { index: 4, label: t("pages.prescriptionRefill.chat.stageReview", "Review & Confirm") };
  })();
  const progressPct = (stageInfo.index / 4) * 100;

  return (
    <div className="flex flex-col w-full bg-[#f7f6f0]" style={{ height: "100dvh" }}>
      {/* Top bar: back left, centered title + stage count, slim progress bar bottom */}
      {step < 8 && (
        <div className="sticky top-0 z-10 bg-[#f7f6f0]/95 backdrop-blur-md">
          <div className="relative px-3 sm:px-4 pt-3 pb-3">
            <button
              onClick={handleBack}
              aria-label={t("common.back")}
              className="absolute left-3 top-2.5 w-9 h-9 flex items-center justify-center rounded-lg text-foreground/70 hover:bg-black/5 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <div className="font-semibold text-foreground" style={{ fontSize: 16 }}>
                {stageInfo.label}
              </div>
              <div className="text-muted-foreground mt-0.5 tabular-nums" style={{ fontSize: 12 }}>
                {stageInfo.index} {t("pages.prescriptionRefill.chat.of", "of")} 4
              </div>
            </div>
          </div>
          <div className="h-[3px] bg-black/5 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Step 1 — mode selection or manual drug search */}
      {step === 1 ? (
        mode === null ? (
          <ModeSelectionScreen
            onChooseManual={() => setMode("manual")}
            onChooseUpload={handleStep1Upload}
            submitting={creatingRefill}
          />
        ) : (
          <Step1Hero onSubmit={handleStep1Submit} submitting={creatingRefill} />
        )
      ) : step === 3 ? (
        /* Step 3 — fully isolated AI Health Screening chat. Owns its own state. */
        <HealthScreeningChat
          refillId={refillId}
          medicationSummary={answers.drug?.drug || ""}
          onCleared={(token) => {
            setConsultClearanceToken(token);
            setStep(4);
          }}
          onStartOver={handleStartOver}
        />
      ) : (
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-4 space-y-4 w-full max-w-2xl mx-auto"
        style={{ minHeight: 0 }}
      >
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.kind === "text" ? (
              m.role === "ai" ? (
                <TypewriterText text={m.text} formatted={true} />
              ) : (
                <span className="whitespace-pre-line">{m.text}</span>
              )
            ) : m.node}
          </Bubble>
        ))}


        {/* Step 2 — hidden file input always present so fileRef works in all sub-states */}
        {step === 2 && (
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFilePicked}
          />
        )}
        {step === 2 && sub2 === "upload-pending" && (
          <Bubble role="ai" wide>
            <div className="space-y-3">
              <div className="flex items-center gap-3 py-1">
                <Camera className="w-5 h-5 text-primary" />
                <span style={{ fontSize: 15 }}>
                  {t("pages.prescriptionRefill.chat.openingCamera", "Opening camera to scan your prescription…")}
                </span>
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {t("pages.prescriptionRefill.chat.openCamera", "Open Camera")}
              </button>
            </div>
          </Bubble>
        )}
        {step === 2 && sub2 === "upload-reading" && (
          <Bubble role="ai">
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span style={{ fontSize: 16 }}>{t("pages.prescriptionRefill.chat.reading", "Scanning your prescription…")}</span>
            </div>
          </Bubble>
        )}
        {step === 2 && sub2 === "availability-check" && ocrResults.length > 0 && (
          <Bubble role="ai" wide>
            <MedicationAvailabilityCard
              results={ocrResults}
              onProceed={handleProceedWithAvailable}
            />
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

        {/* Step 3 is handled by the isolated HealthScreeningChat above */}


        {/* Step 4 — typed-from-scratch flow (everyone, guest and logged-in) */}
        {step === 4 && sub4 === "g-sex" && (
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
        {step === 4 && sub4 === "g-dob" && (
          <Bubble role="ai" wide>
            <DobPicker onSubmit={handleGDob} />
          </Bubble>
        )}
        {step === 4 && sub4 === "g-weight" && (
          <Bubble role="ai" wide>
            <NumberWithUnit
              defaultUnit={patientDraft.weightUnit}
              units={["kg", "lbs"]}
              onSubmit={(v, u) => handleGWeight(v, u as "kg" | "lbs")}
              placeholder={t("pages.prescriptionRefill.chat.weightPlaceholder")}
            />
          </Bubble>
        )}
        {step === 4 && sub4 === "g-height" && (
          <Bubble role="ai" wide>
            <NumberWithUnit
              defaultUnit={patientDraft.heightUnit}
              units={["cm", "ftin"]}
              onSubmit={(v, u) => handleGHeight(v, u as "cm" | "ftin")}
              placeholder={t("pages.prescriptionRefill.chat.heightPlaceholder")}
            />
          </Bubble>
        )}

        {/* Step 5 — Email */}
        {step === 5 && isLoggedIn && sub5 === "logged-confirm" && (
          <Bubble role="ai" wide>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={handleUseDifferentEmail}
                className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {t("pages.prescriptionRefill.chat.useDifferentEmail")}
              </button>
              <button
                onClick={handleConfirmLoggedEmail}
                className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {t("pages.prescriptionRefill.chat.sendHere")}
              </button>
            </div>
          </Bubble>
        )}
        {step === 5 && sub5 === "guest-confirm" && (
          <Bubble role="ai" wide>
            <EmailConfirmCard
              email={answers.email}
              onYes={handleEmailConfirmYes}
              onEdit={handleEmailConfirmEdit}
            />
          </Bubble>
        )}

        {/* Step 6 — Review */}
        {step === 6 && (
          <Bubble role="ai" wide>
            <ReviewSummaryCard
              answers={answers}
              priceDisplay={REFILL_PRICE_DISPLAY}
              prescriberName={PRESCRIBER_NAME}
              prescriberClinic={PRESCRIBER_CLINIC}
              onConfirm={handleConfirmAndPay}
              onEdit={handleEditFromSummary}
            />
          </Bubble>
        )}

        {/* Step 7 — Payment (hands off to Stripe Checkout) */}
        {step === 7 && (
          <Bubble role="ai" wide>
            <PaymentCard
              priceDisplay={REFILL_PRICE_DISPLAY}
              email={answers.email}
              savedCard={null}
              status={sub7}
              onPay={handlePay}
              onRetry={handleRetryPayment}
            />
          </Bubble>
        )}

        {/* Step 8 — Result (driven by polling /api/prescription/status/:refill_id) */}
        {step === 8 && sub8 === "pending" && (
          <Bubble role="ai" wide>
            <PaymentPendingCard />
          </Bubble>
        )}
        {step === 8 && sub8 === "canceled" && (
          <Bubble role="ai" wide>
            <PaymentCanceledCard onTryAgain={onExit} />
          </Bubble>
        )}
        {step === 8 && sub8 === "failed" && (
          <Bubble role="ai" wide>
            <PaymentCanceledCard onTryAgain={onExit} failed />
          </Bubble>
        )}
        {step === 8 && sub8 === "paid" && (
          <Bubble role="ai" wide>
            <SuccessCard
              refNumber={refNumber}
              emailStatus={emailStatus}
              isLoggedIn={isLoggedIn}
              signupDismissed={signupDismissed}
              onCreateAccount={() => navigate("/signup")}
              onDismissSignup={() => setSignupDismissed(true)}
              onDone={onExit}
            />
          </Bubble>
        )}
      </div>
      )}


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

      {/* Step 3 bottom input bar is handled by HealthScreeningChat */}


      {step === 4 && sub4 === "g-name" && (
        <NameInputBar
          onSubmit={handleGName}
          placeholder={t("pages.prescriptionRefill.chat.namePlaceholder")}
          buttonLabel={t("pages.prescriptionRefill.chat.continue")}
        />
      )}

      {step === 5 && (sub5 === "guest-ask" || sub5 === "logged-different") && (
        <BottomInputBar
          value={emailDraft}
          setValue={setEmailDraft}
          onSubmit={() => handleEmailSubmit(emailDraft)}
          placeholder={t("pages.prescriptionRefill.chat.emailPlaceholder")}
          buttonLabel={t("pages.prescriptionRefill.chat.continue")}
          type="email"
        />
      )}
    </div>
  );
};

function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function maskEmail(e: string) {
  if (!e || !e.includes("@")) return e;
  const [local, domain] = e.split("@");
  if (local.length <= 2) return `${local[0] || ""}*@${domain}`;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

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
    className={`flex animate-fade-in ${
      role === "user" ? "justify-end" : "justify-start"
    }`}
  >
    <div
      className={`${wide ? "max-w-[95%] md:max-w-[90%] w-full" : "max-w-[85%] md:max-w-[70%]"} px-4 py-3 leading-relaxed ${
        role === "user"
          ? "bg-secondary/80 text-foreground rounded-[20px] rounded-tr-md"
          : "bg-white border border-border/50 shadow-sm text-foreground rounded-[20px] rounded-tl-md"
      }`}
      style={{ fontSize: 14.5 }}
    >
      {children}
    </div>
  </div>
);

const renderFormattedText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-[13px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const TypewriterText = ({ text, speed = 4, onComplete, formatted = false }: { text: string; speed?: number; onComplete?: () => void; formatted?: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const chars = Array.from(text);
    const interval = window.setInterval(() => {
      indexRef.current += 4;
      setDisplayed(chars.slice(0, indexRef.current).join(""));
      if (indexRef.current >= chars.length) {
        window.clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => window.clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className="whitespace-pre-line">
      {formatted ? renderFormattedText(displayed) : displayed}
    </span>
  );
};

const BottomInputBar = ({
  value,
  setValue,
  onSubmit,
  placeholder,
  buttonLabel,
  type = "text",
}: {
  value: string;
  setValue: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  buttonLabel: string;
  type?: string;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Retain focus when component re-renders or clears
    if (value === "") {
      inputRef.current?.focus();
    }
  }, [value]);

  return (
    <div className="relative shrink-0 bg-[#f7f6f0] border-t border-border/40" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
      <div className="max-w-2xl mx-auto px-3 py-2 sm:px-5 sm:py-3">
        <form 
          className="bg-white rounded-full flex items-center border border-border/50 p-1.5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) {
              onSubmit();
              setTimeout(() => inputRef.current?.focus(), 10);
            }
          }}
        >
          <input
            ref={inputRef}
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            autoFocus
            className="flex-1 px-4 py-2 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none font-body"
            style={{ fontSize: 15, minHeight: 44 }}
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="px-6 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            style={{ minHeight: 44, fontSize: 15 }}
          >
            {buttonLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

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

// ============= Mode Selection =============

const ModeSelectionScreen = ({
  onChooseManual,
  onChooseUpload,
  submitting,
}: {
  onChooseManual: () => void;
  onChooseUpload: () => void;
  submitting: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex-1 flex flex-col items-center px-6 pt-10 sm:pt-16 pb-12 text-center w-full overflow-y-auto scrollbar-hide">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-[0_8px_24px_-12px_rgba(15,42,60,0.18)]">
          <img src={ciraLogo} alt="Cira" width={40} height={40} />
        </div>

        <h1
          className="font-heading text-foreground leading-[1.05] tracking-tight"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 500 }}
        >
          {t("pages.prescriptionRefill.chat.modeTitle", "How would you like to start?")}
        </h1>

        <p className="mt-4 text-foreground/70 max-w-sm leading-relaxed" style={{ fontSize: 15 }}>
          {t("pages.prescriptionRefill.chat.modeSub", "Upload a photo of your prescription or search your medications manually.")}
        </p>

        <div className="mt-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Upload option */}
          <button
            onClick={onChooseUpload}
            disabled={submitting}
            className="flex flex-col items-center gap-3 rounded-2xl bg-white border border-border px-5 py-7 text-left hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              {submitting ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Camera className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <p className="font-semibold text-foreground text-center" style={{ fontSize: 16 }}>
                {t("pages.prescriptionRefill.chat.uploadPhoto", "Upload Prescription")}
              </p>
              <p className="mt-1 text-muted-foreground text-center leading-snug" style={{ fontSize: 13 }}>
                {t("pages.prescriptionRefill.chat.uploadPhotoDesc", "Take or upload a photo — we'll scan and check your medications")}
              </p>
            </div>
          </button>

          {/* Manual option */}
          <button
            onClick={onChooseManual}
            disabled={submitting}
            className="flex flex-col items-center gap-3 rounded-2xl bg-white border border-border px-5 py-7 text-left hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-center" style={{ fontSize: 16 }}>
                {t("pages.prescriptionRefill.chat.typeManually", "Search Manually")}
              </p>
              <p className="mt-1 text-muted-foreground text-center leading-snug" style={{ fontSize: 13 }}>
                {t("pages.prescriptionRefill.chat.manualDesc", "Search and select your medications from our database")}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============= Step 1 =============

type DrugRow = {
  id: number;
  inn_name: string;
  form: string;
  available_strengths: string;
  product_name: string;
  therapeutic_use: string;
};

const DRUGS = drugsData as DrugRow[];

const Step1Hero = ({
  onSubmit,
  submitting,
}: {
  onSubmit: (medications: DrugRow[]) => void;
  submitting: boolean;
}) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<DrugRow[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const ids = new Set(selected.map((s) => s.id));
    const out: DrugRow[] = [];
    for (const d of DRUGS) {
      if (ids.has(d.id)) continue;
      if (
        d.product_name.toLowerCase().includes(q) ||
        d.inn_name.toLowerCase().includes(q)
      ) {
        out.push(d);
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [query, selected]);

  const addDrug = (d: DrugRow) => {
    setSelected((s) => (s.find((x) => x.id === d.id) ? s : [...s, d]));
    setQuery("");
    setOpen(false);
  };
  const removeDrug = (id: number) =>
    setSelected((s) => s.filter((x) => x.id !== id));

  const canSubmit = checked && selected.length > 0 && !submitting;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(selected);
  };

  return (
    <div className="flex-1 flex flex-col items-center px-6 pt-10 sm:pt-16 pb-16 text-center w-full overflow-y-auto scrollbar-hide">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl">
        {/* Cira logo mark */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-[0_8px_24px_-12px_rgba(15,42,60,0.18)]">
          <img src={ciraLogo} alt="Cira" width={40} height={40} />
        </div>

        {/* Headline */}
        <h1
          className="font-heading text-foreground leading-[1.05] tracking-tight"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2rem, 5.5vw, 3rem)",
            fontWeight: 500,
          }}
        >
          {t("pages.prescriptionRefill.chat.step1Headline", "Refill your prescription in minutes")}
        </h1>

        {/* Subtitle */}
        <p
          className="mt-5 text-foreground/70 max-w-md leading-relaxed"
          style={{ fontSize: 15 }}
        >
          {t(
            "pages.prescriptionRefill.chat.step1Sub",
            "We cover common medications, reviewed by licensed pharmacists and approved by partner clinicians."
          )}
        </p>

        {/* Medication multi-select + CTA */}
        <form onSubmit={handleSubmit} className="mt-8 w-full space-y-3">
          <div ref={wrapRef} className="relative w-full">
            <div
              className="w-full rounded-2xl bg-white border border-border/70 px-3 py-2 flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/40 text-left"
              style={{ minHeight: 56 }}
              onClick={() => setOpen(true)}
            >
              <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
              {selected.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-2.5 pr-1 py-1 text-xs font-medium max-w-full"
                >
                  <span className="truncate max-w-[180px]">{d.product_name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDrug(d.id);
                    }}
                    className="rounded-full hover:bg-primary/20 p-0.5"
                    aria-label="Remove"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                placeholder={
                  selected.length === 0
                    ? t(
                        "pages.prescriptionRefill.chat.step1Placeholder",
                        "Search your medication(s)…"
                      )
                    : ""
                }
                autoFocus
                className="flex-1 min-w-[140px] bg-transparent px-2 py-1 text-foreground placeholder:text-muted-foreground focus:outline-none"
                style={{ fontSize: 16 }}
              />
            </div>

            {open && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1.5 w-full bg-white border border-border/70 rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto text-left">
                {suggestions.map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => addDrug(d)}
                    className="w-full px-4 py-2.5 hover:bg-primary/5 flex flex-col items-start border-b border-border/40 last:border-b-0"
                  >
                    <span className="text-sm font-medium text-foreground truncate w-full">
                      {d.product_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate w-full">
                      {d.inn_name} · {d.form}
                      {d.available_strengths && d.available_strengths !== "N/A"
                        ? ` · ${d.available_strengths}`
                        : ""}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {open && query.trim() && suggestions.length === 0 && (
              <div className="absolute z-20 mt-1.5 w-full bg-white border border-border/70 rounded-2xl shadow-lg px-4 py-3 text-sm text-muted-foreground text-left">
                No matches found
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
            style={{ minHeight: 56, fontSize: 16 }}
          >
            {submitting ? <Loader2 className="mx-auto w-5 h-5 animate-spin" /> : t("pages.prescriptionRefill.chat.startCta", "Check Eligibility")}
          </button>
        </form>

        {/* Tiny consent tickbox */}
        <label className="mt-4 flex items-start gap-2 max-w-md cursor-pointer select-none text-left">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-[3px] h-3.5 w-3.5 rounded border-border accent-primary shrink-0"
          />
          <span className="text-foreground/65 leading-snug" style={{ fontSize: 11.5 }}>
            <Lock className="inline w-3 h-3 mr-1 -mt-0.5 text-primary/80" />
            {t("pages.prescriptionRefill.chat.consentBody")}{" "}
            <Link
              to="/privacy"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              {t("pages.prescriptionRefill.chat.learnMore")}
            </Link>
          </span>
        </label>
      </div>
    </div>
  );
};




const ConsentCard = ({ onAgree }: { onAgree: () => void }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  return (
    <div
      className="space-y-3"
      onKeyDown={(e) => {
        if (e.key === "Enter" && checked) {
          e.preventDefault();
          onAgree();
        }
      }}
    >
      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-[3px] h-4 w-4 rounded border-border accent-primary shrink-0"
        />
        <span className="text-foreground/90 leading-snug" style={{ fontSize: 13.5 }}>
          <Lock className="inline w-3.5 h-3.5 mr-1 -mt-0.5 text-primary" />
          {t("pages.prescriptionRefill.chat.consentBody")}{" "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setOpen((o) => !o);
            }}
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            {t("pages.prescriptionRefill.chat.learnMore")}
          </button>
        </span>
      </label>

      {open && (
        <div className="space-y-2 rounded-lg bg-background/60 border border-border/60 p-3 animate-fade-in" style={{ fontSize: 12.5 }}>
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
        disabled={!checked}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ minHeight: 40, fontSize: 14 }}
      >
        {t("pages.prescriptionRefill.chat.continue")}
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

const MedicationAvailabilityCard = ({
  results,
  onProceed,
}: {
  results: Array<{ name: string; available: boolean; match: DrugRow | null }>;
  onProceed: () => void;
}) => {
  const { t } = useTranslation();
  const availableCount = results.filter((r) => r.available).length;
  const unavailableCount = results.length - availableCount;

  return (
    <div className="space-y-3">
      {/* Header summary */}
      <div className="flex items-center justify-between px-1">
        <p className="font-semibold text-foreground" style={{ fontSize: 15 }}>
          {t("pages.prescriptionRefill.chat.ocrResultsTitle", "Prescription Scan Results")}
        </p>
        <div className="flex items-center gap-2 text-xs font-medium">
          {availableCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              {availableCount} {t("pages.prescriptionRefill.chat.available", "available")}
            </span>
          )}
          {unavailableCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
              <XCircle className="w-3 h-3" />
              {unavailableCount} {t("pages.prescriptionRefill.chat.unavailable", "unavailable")}
            </span>
          )}
        </div>
      </div>

      {/* Medication list */}
      <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
        {results.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${
              r.available ? "bg-emerald-500/5 hover:bg-emerald-500/8" : "bg-red-500/[0.03] hover:bg-red-500/[0.06]"
            }`}
          >
            {/* Status icon */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                r.available
                  ? "bg-emerald-500/15 ring-1 ring-emerald-500/25"
                  : "bg-red-500/12 ring-1 ring-red-500/20"
              }`}
            >
              {r.available ? (
                <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
              ) : (
                <XCircle className="w-[18px] h-[18px] text-red-500" />
              )}
            </div>

            {/* Drug info */}
            <div className="min-w-0 flex-1">
              <p
                className={`font-semibold truncate ${r.available ? "text-foreground" : "text-foreground/70"}`}
                style={{ fontSize: 15 }}
              >
                {r.name}
              </p>
              {r.available && r.match ? (
                <p className="text-emerald-600 font-medium" style={{ fontSize: 12 }}>
                  ✓ {t("pages.prescriptionRefill.chat.drugAvailable", "Available for refill")}
                  {r.match.form && r.match.form !== "N/A" ? ` · ${r.match.form}` : ""}
                  {r.match.available_strengths && r.match.available_strengths !== "N/A"
                    ? ` · ${r.match.available_strengths}`
                    : ""}
                </p>
              ) : (
                <p className="text-red-400" style={{ fontSize: 12 }}>
                  ✗ {t("pages.prescriptionRefill.chat.drugUnavailable", "Not available in our system")}
                </p>
              )}
            </div>

            {/* Right badge */}
            <div
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                r.available
                  ? "bg-emerald-500/15 text-emerald-600"
                  : "bg-red-500/10 text-red-500"
              }`}
            >
              {r.available
                ? t("pages.prescriptionRefill.chat.inStock", "In Stock")
                : t("pages.prescriptionRefill.chat.notAvail", "N/A")}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      {availableCount > 0 ? (
        <button
          onClick={onProceed}
          className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity shadow-sm"
          style={{ minHeight: 52, fontSize: 16 }}
        >
          {t(
            "pages.prescriptionRefill.chat.continueWithAvailable",
            "Continue with {{count}} medication(s)",
            { count: availableCount }
          ).replace("{{count}}", String(availableCount))}
        </button>
      ) : (
        <div className="rounded-xl bg-amber-500/8 border border-amber-500/20 px-4 py-3 text-center">
          <p className="text-amber-700 font-medium" style={{ fontSize: 14 }}>
            {t(
              "pages.prescriptionRefill.chat.noAvailable",
              "None of the detected medications are available for refill."
            )}
          </p>
          <p className="text-muted-foreground mt-1" style={{ fontSize: 13 }}>
            {t(
              "pages.prescriptionRefill.chat.noAvailableHint",
              "Please contact our team or try searching manually."
            )}
          </p>
        </div>
      )}
    </div>
  );
};


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
      {fields.map((f, i) => (
        <div key={f.key}>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">
            {f.label}
          </label>
          <input
            type="text"
            value={draft[f.key]}
            onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter" && i === fields.length - 1) {
                e.preventDefault();
                onSave();
              }
            }}
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
  <div className="grid grid-cols-2 gap-3 w-full min-w-[260px] sm:min-w-[320px]">
    <button
      onClick={onNo}
      className="rounded-full border border-border bg-background text-foreground font-semibold hover:bg-accent transition-colors px-6"
      style={{ minHeight: 52, fontSize: 16 }}
    >
      {noLabel}
    </button>
    <button
      onClick={onYes}
      className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity px-6"
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
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border/50 pb-2 mb-2">
        <UserIcon className="w-5 h-5 text-primary" />
        <span className="font-semibold text-foreground text-[15px]">Patient Details</span>
      </div>
      
      <div>
        <FieldLabel>Full Legal Name</FieldLabel>
        <div className="relative">
          <input
            type="text"
            value={draft.fullName}
            onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSave();
              }
            }}
            placeholder="e.g. John Doe"
            className="w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm"
            style={{ fontSize: 15 }}
          />
        </div>
      </div>

      <div>
        <FieldLabel>Date of Birth</FieldLabel>
        <input
          type="date"
          value={draft.dob}
          onChange={(e) => setDraft({ ...draft, dob: e.target.value })}
          className="w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-sm"
          style={{ fontSize: 15 }}
        />
      </div>

      <div>
        <FieldLabel>{t("pages.prescriptionRefill.chat.pSex")}</FieldLabel>
        <div className="flex rounded-xl border border-border bg-card/50 p-1 shadow-sm">
          {(["male", "female"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setDraft({ ...draft, sex: s })}
              className={`flex-1 rounded-lg py-2 text-[14px] font-medium transition-all ${
                draft.sex === s
                  ? "bg-white text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-black/5"
              }`}
            >
              {s === "male"
                ? t("pages.prescriptionRefill.chat.male")
                : t("pages.prescriptionRefill.chat.female")}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>{t("pages.prescriptionRefill.chat.pWeight")}</FieldLabel>
          <UnitRow
            value={draft.weight}
            unit={draft.weightUnit}
            units={["kg", "lbs"]}
            onChange={(v, u) => setDraft({ ...draft, weight: v, weightUnit: u as "kg" | "lbs" })}
          />
        </div>
        <div>
          <FieldLabel>{t("pages.prescriptionRefill.chat.pHeight")}</FieldLabel>
          <UnitRow
            value={draft.height}
            unit={draft.heightUnit}
            units={["cm", "ftin"]}
            onChange={(v, u) => setDraft({ ...draft, height: v, heightUnit: u as "cm" | "ftin" })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-3">
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
  inputRef,
  onKeyDown,
}: {
  value: string;
  unit: string;
  units: string[];
  onChange: (val: string, unit: string) => void;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) => (
  <div className="flex flex-col gap-2">
    <input
      ref={inputRef}
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value, unit)}
      onKeyDown={onKeyDown}
      className="w-full rounded-xl border border-border bg-card/50 px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
      style={{ fontSize: 15 }}
    />
    <div className="flex rounded-xl border border-border bg-card/50 p-1 shadow-sm w-full">
      {units.map((u) => (
        <button
          key={u}
          onClick={() => onChange(value, u)}
          className={`flex-1 rounded-lg py-1.5 text-[13px] font-medium transition-all ${
            unit === u
              ? "bg-white text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:bg-black/5"
          }`}
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

  // Focus management
  const mRef = useRef<HTMLInputElement>(null);
  const yRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!valid) return;
    const iso = `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    onSubmit(iso);
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-1">
        <span className="font-semibold text-foreground text-[15px]">Date of Birth</span>
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          placeholder="DD"
          value={d}
          onChange={(e) => {
            const val = e.target.value.slice(0, 2);
            setD(val);
            if (val.length === 2) mRef.current?.focus();
          }}
          autoFocus
          className="w-1/3 rounded-xl border border-border bg-card/50 px-3 py-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
          style={{ fontSize: 16 }}
        />
        <input
          ref={mRef}
          type="number"
          inputMode="numeric"
          placeholder="MM"
          value={m}
          onChange={(e) => {
            const val = e.target.value.slice(0, 2);
            setM(val);
            if (val.length === 2) yRef.current?.focus();
          }}
          className="w-1/3 rounded-xl border border-border bg-card/50 px-3 py-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
          style={{ fontSize: 16 }}
        />
        <input
          ref={yRef}
          type="number"
          inputMode="numeric"
          placeholder="YYYY"
          value={y}
          onChange={(e) => setY(e.target.value.slice(0, 4))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          className="w-1/3 rounded-xl border border-border bg-card/50 px-3 py-3 text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
          style={{ fontSize: 16 }}
        />
      </div>
      <button
        onClick={submit}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = val.trim().length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit(val, unit);
  };

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
        inputRef={inputRef}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <input
        type="hidden"
        value={placeholder}
        readOnly
      />
      <button
        onClick={submit}
        disabled={!canSubmit}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
        style={{ minHeight: 48, fontSize: 16 }}
      >
        {t("pages.prescriptionRefill.chat.continue")}
      </button>
    </div>
  );
};

// ============= Step 5 =============

const EmailConfirmCard = ({
  email,
  onYes,
  onEdit,
}: {
  email: string;
  onYes: () => void;
  onEdit: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl bg-background/60 border border-border px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Mail className="w-4 h-4 text-primary" />
        </div>
        <span className="text-foreground font-medium truncate" style={{ fontSize: 15 }}>
          {email}
        </span>
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
          onClick={onYes}
          className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          style={{ minHeight: 48, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.emailConfirmYes")}
        </button>
      </div>
    </div>
  );
};

// ============= Step 6 =============

const ReviewSummaryCard = ({
  answers,
  priceDisplay,
  prescriberName,
  prescriberClinic,
  onConfirm,
  onEdit,
}: {
  answers: RefillAnswers;
  priceDisplay: string;
  prescriberName: string;
  prescriberClinic: string;
  onConfirm: () => void;
  onEdit: () => void;
}) => {
  const { t } = useTranslation();
  const drug = answers.drug;
  const p = answers.patient;
  const sexLabel = p.sex
    ? p.sex === "male"
      ? t("pages.prescriptionRefill.chat.male")
      : t("pages.prescriptionRefill.chat.female")
    : "—";
  const drugLine = drug
    ? [drug.drug, drug.strength, drug.form].filter(Boolean).join(" · ")
    : "—";
  const patientLine = [
    p.fullName || "—",
    p.dob ? formatDobDisplay(p.dob) : "—",
    sexLabel,
    p.weight ? `${p.weight} ${p.weightUnit}` : "—",
    p.height ? `${p.height} ${p.heightUnit === "cm" ? "cm" : "ft/in"}` : "—",
  ].join(" · ");

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-background/60 border border-border divide-y divide-border">
        <SummaryRow icon={<Pill className="w-4 h-4" />} title={drugLine} subtitle={drug?.dosage} />
        <SummaryRow icon={<UserIcon className="w-4 h-4" />} title={p.fullName || "—"} subtitle={patientLine} />
        <SummaryRow icon={<Mail className="w-4 h-4" />} title={maskEmail(answers.email) || "—"} subtitle={t("pages.prescriptionRefill.chat.deliveryEmail")} />
        <SummaryRow
          icon={<ShieldCheck className="w-4 h-4" />}
          title={prescriberName}
          subtitle={prescriberClinic}
        />
        <SummaryRow
          icon={<CreditCard className="w-4 h-4" />}
          title={t("pages.prescriptionRefill.chat.totalLine", { price: priceDisplay })}
          subtitle={t("pages.prescriptionRefill.chat.oneTime")}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
        <button
          onClick={onEdit}
          className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors order-2 sm:order-1"
          style={{ minHeight: 52, fontSize: 15 }}
        >
          {t("pages.prescriptionRefill.chat.editDetails")}
        </button>
        <button
          onClick={onConfirm}
          className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity order-1 sm:order-2"
          style={{ minHeight: 52, fontSize: 16 }}
        >
          {t("pages.prescriptionRefill.chat.confirmAndPay", { price: priceDisplay })}
        </button>
      </div>
    </div>
  );
};

const SummaryRow = ({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-start gap-3 px-3 py-3">
    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-foreground font-medium leading-snug" style={{ fontSize: 15 }}>{title}</p>
      {subtitle && (
        <p className="text-muted-foreground mt-0.5 leading-snug" style={{ fontSize: 13 }}>{subtitle}</p>
      )}
    </div>
  </div>
);

// ============= Step 7 =============

const PaymentCard = ({
  priceDisplay,
  email,
  savedCard,
  status,
  onPay,
  onRetry,
}: {
  priceDisplay: string;
  email: string;
  savedCard: { brand: string; last4: string } | null;
  status: "ready" | "processing" | "failed";
  onPay: () => void;
  onRetry: () => void;
}) => {
  const { t } = useTranslation();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const canPay = savedCard ? true : cardNumber.replace(/\s/g, "").length >= 12 && expiry.length >= 4 && cvc.length >= 3;

  if (status === "failed") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-foreground leading-relaxed" style={{ fontSize: 15 }}>
            {t("pages.prescriptionRefill.chat.paymentFailed")}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          style={{ minHeight: 52, fontSize: 16 }}
        >
          {t("pages.prescriptionRefill.chat.tryAgain")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-background/60 border border-border px-3 py-3">
        <div className="flex items-center gap-2 text-muted-foreground" style={{ fontSize: 13 }}>
          <Mail className="w-4 h-4" />
          <span className="truncate">{email}</span>
        </div>
        <span className="text-foreground font-semibold" style={{ fontSize: 15 }}>{priceDisplay}</span>
      </div>

      {savedCard ? (
        <div className="rounded-xl border border-border bg-background/60 px-3 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground font-medium" style={{ fontSize: 15 }}>
            {t("pages.prescriptionRefill.chat.payWithCard", {
              brand: savedCard.brand,
              last4: savedCard.last4,
            })}
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/[^\d ]/g, "").slice(0, 19))}
            placeholder={t("pages.prescriptionRefill.chat.cardNumber")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            style={{ fontSize: 16, minHeight: 48 }}
            disabled={status === "processing"}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value.replace(/[^\d/]/g, "").slice(0, 5))}
              placeholder={t("pages.prescriptionRefill.chat.expiry")}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: 16, minHeight: 48 }}
              disabled={status === "processing"}
            />
            <input
              type="text"
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canPay && status !== "processing") onPay();
                }
              }}
              placeholder={t("pages.prescriptionRefill.chat.cvc")}
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              style={{ fontSize: 16, minHeight: 48 }}
              disabled={status === "processing"}
            />
          </div>
        </div>
      )}

      <button
        onClick={onPay}
        disabled={!canPay || status === "processing"}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ minHeight: 52, fontSize: 16 }}
      >
        {status === "processing" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            {t("pages.prescriptionRefill.chat.processing")}
          </>
        ) : (
          t("pages.prescriptionRefill.chat.confirmPayment", { price: priceDisplay })
        )}
      </button>

      <p className="text-center text-muted-foreground flex items-center justify-center gap-1.5" style={{ fontSize: 12 }}>
        <Lock className="w-3 h-3" /> {t("pages.prescriptionRefill.chat.securedByStripe")}
      </p>
    </div>
  );
};

// ============= Step 8 =============

const PaymentPendingCard = () => {
  const { t } = useTranslation();
  return (
    <div className="space-y-3 text-center py-2">
      <div className="flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
      <h3 className="font-semibold text-foreground" style={{ fontSize: 17 }}>
        {t("pages.prescriptionRefill.chat.paymentPendingTitle", "Confirming your payment…")}
      </h3>
      <p className="text-foreground/80" style={{ fontSize: 14 }}>
        {t(
          "pages.prescriptionRefill.chat.paymentPendingBody",
          "Hang tight — this usually takes a few seconds.",
        )}
      </p>
    </div>
  );
};

const PaymentCanceledCard = ({
  onTryAgain,
  failed,
}: {
  onTryAgain: () => void;
  failed?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-amber-500/15 flex items-center justify-center mb-3">
          <XCircle className="w-8 h-8 text-amber-500" strokeWidth={2.5} />
        </div>
        <h3 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
          {failed
            ? t("pages.prescriptionRefill.chat.paymentFailedTitle", "Payment failed")
            : t("pages.prescriptionRefill.chat.paymentCanceledTitle", "Payment not completed")}
        </h3>
        <p className="mt-2 text-foreground/80" style={{ fontSize: 14 }}>
          {t(
            "pages.prescriptionRefill.chat.paymentCanceledBody",
            "No charge was made. You can try again whenever you're ready.",
          )}
        </p>
      </div>
      <button
        onClick={onTryAgain}
        className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        style={{ minHeight: 48, fontSize: 15 }}
      >
        {t("pages.prescriptionRefill.chat.tryAgain", "Try again")}
      </button>
    </div>
  );
};

const SuccessCard = ({
  refNumber,
  emailStatus,
  isLoggedIn,
  signupDismissed,
  onCreateAccount,
  onDismissSignup,
  onDone,
}: {
  refNumber: string;
  emailStatus: "pending" | "sent" | "failed";
  isLoggedIn: boolean;
  signupDismissed: boolean;
  onCreateAccount: () => void;
  onDismissSignup: () => void;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      {/* Animated check */}
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3 animate-scale-in">
          <CheckCircle2 className="w-9 h-9 text-emerald-500" strokeWidth={2.5} />
        </div>
        <h3 className="font-semibold text-foreground" style={{ fontSize: 18 }}>
          {t("pages.prescriptionRefill.chat.successTitle")}
        </h3>
        <p className="mt-2 text-foreground/80 leading-relaxed" style={{ fontSize: 15 }}>
          {t("pages.prescriptionRefill.chat.successBody")}
        </p>
        <p className="mt-2 text-muted-foreground" style={{ fontSize: 13 }}>
          {t("pages.prescriptionRefill.chat.successSpamNote")}
        </p>
      </div>

      {/* Reference number card */}
      <div className="rounded-2xl border border-border bg-background/60 p-4 text-center space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {t("pages.prescriptionRefill.chat.referenceNumber")}
        </p>
        <p className="font-mono font-semibold text-foreground tracking-wider" style={{ fontSize: 22 }}>
          {refNumber}
        </p>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-foreground hover:bg-accent transition-colors"
          style={{ minHeight: 40, fontSize: 14 }}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              {t("pages.prescriptionRefill.chat.copied")}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {t("pages.prescriptionRefill.chat.copy")}
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center" style={{ fontSize: 12 }}>
        {emailStatus === "sent"
          ? t("pages.prescriptionRefill.chat.emailSent", "Email sent — check your inbox.")
          : emailStatus === "failed"
          ? t("pages.prescriptionRefill.chat.emailFailed", "We couldn't send the email — support will reach out.")
          : t("pages.prescriptionRefill.chat.emailSending", "Sending your prescription by email…")}
      </p>

      <p className="text-xs text-muted-foreground leading-relaxed text-center px-1">
        {t("pages.prescriptionRefill.chat.refundNote")}
      </p>


      {isLoggedIn ? (
        <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-3 text-center">
          <p className="text-primary font-medium" style={{ fontSize: 14 }}>
            {t("pages.prescriptionRefill.chat.addedToHistory")}
          </p>
        </div>
      ) : (
        !signupDismissed && (
          <div className="rounded-2xl border border-border bg-background/60 p-4 space-y-3 animate-fade-in">
            <p className="text-foreground font-medium text-center" style={{ fontSize: 15 }}>
              {t("pages.prescriptionRefill.chat.signupPrompt")}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={onDismissSignup}
                className="rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors order-2 sm:order-1"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {t("pages.prescriptionRefill.chat.maybeLater")}
              </button>
              <button
                onClick={() => {
                  onDismissSignup();
                  onCreateAccount();
                }}
                className="rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity order-1 sm:order-2"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                {t("pages.prescriptionRefill.chat.createAccount")}
              </button>
            </div>
          </div>
        )
      )}

      <button
        onClick={onDone}
        className="w-full rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors"
        style={{ minHeight: 48, fontSize: 15 }}
      >
        {t("pages.prescriptionRefill.chat.done")}
      </button>
    </div>
  );
};

export default PrescriptionRefillChat;
