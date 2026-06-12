import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";

export type RefillAnswers = {
  fullName: string;
  medication: string;
  dosage: string;
  lastRefill: string;
  pharmacy: string;
  allergies: string;
  notes: string;
};

const TOTAL_STEPS = 8;

type ChatMessage = {
  id: string;
  role: "ai" | "user";
  text: string;
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
    fullName: "",
    medication: "",
    dosage: "",
    lastRefill: "",
    pharmacy: "",
    allergies: "",
    notes: "",
  });
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const seededRef = useRef<Set<number>>(new Set());

  // Prompts for each step
  const stepPrompts: Record<number, string> = {
    1: t("pages.prescriptionRefill.chat.step1Prompt"),
    2: t("pages.prescriptionRefill.chat.step2Prompt"),
    3: t("pages.prescriptionRefill.chat.step3Prompt"),
    4: t("pages.prescriptionRefill.chat.step4Prompt"),
    5: t("pages.prescriptionRefill.chat.step5Prompt"),
    6: t("pages.prescriptionRefill.chat.step6Prompt"),
    7: t("pages.prescriptionRefill.chat.step7Prompt"),
    8: t("pages.prescriptionRefill.chat.step8Prompt"),
  };

  const stepKeys: Record<number, keyof RefillAnswers | null> = {
    1: "fullName",
    2: "medication",
    3: "dosage",
    4: "lastRefill",
    5: "pharmacy",
    6: "allergies",
    7: "notes",
    8: null, // review/confirm
  };

  // Seed AI message when entering a step
  useEffect(() => {
    if (seededRef.current.has(step)) return;
    seededRef.current.add(step);
    const prompt = stepPrompts[step];
    setMessages((prev) => [
      ...prev,
      { id: `ai-${step}-${Date.now()}`, role: "ai", text: prompt },
    ]);
    // Pre-fill input with existing answer if any
    const key = stepKeys[step];
    setInputValue(key ? answers[key] : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  const handleContinue = () => {
    const key = stepKeys[step];
    const value = inputValue.trim();

    if (step < 8) {
      if (!value) return;
      // Save answer
      if (key) setAnswers((prev) => ({ ...prev, [key]: value }));
      // Push user message
      setMessages((prev) => [
        ...prev,
        { id: `u-${step}-${Date.now()}`, role: "user", text: value },
      ]);
      setInputValue("");
      // Advance after a beat for animation
      setTimeout(() => setStep((s) => s + 1), 250);
    } else {
      // Final confirm
      setMessages((prev) => [
        ...prev,
        {
          id: `u-final-${Date.now()}`,
          role: "user",
          text: t("pages.prescriptionRefill.chat.confirmSend"),
        },
        {
          id: `ai-final-${Date.now() + 1}`,
          role: "ai",
          text: t("pages.prescriptionRefill.chat.completed"),
        },
      ]);
      onComplete?.(answers);
    }
  };

  const handleBack = () => {
    if (step <= 1) return;
    const prevStep = step - 1;
    // Remove the last AI prompt and last user reply for the current step
    setMessages((prev) => {
      const copy = [...prev];
      // Drop trailing messages until we remove one AI message for current step
      // Simpler: drop last user msg (if any) and last AI msg
      if (copy.length && copy[copy.length - 1].role === "ai") copy.pop();
      if (copy.length && copy[copy.length - 1].role === "user") copy.pop();
      return copy;
    });
    seededRef.current.delete(step);
    setStep(prevStep);
  };

  const progressPct = (step / TOTAL_STEPS) * 100;
  const isOptional = step === 6 || step === 7; // allergies & notes optional
  const canContinue = step === 8 ? true : isOptional ? true : inputValue.trim().length > 0;

  return (
    <div className="flex flex-col w-full" style={{ minHeight: "min(720px, 100dvh)" }}>
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/60 px-4 sm:px-6 pt-3 pb-2">
        <div className="flex items-center gap-3 mb-2">
          {step > 1 ? (
            <button
              onClick={handleBack}
              aria-label={t("common.back")}
              className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              style={{ minHeight: 48, minWidth: 48 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onExit}
              aria-label={t("common.back")}
              className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              style={{ minHeight: 48, minWidth: 48 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground font-medium">
              {t("pages.prescriptionRefill.chat.stepCounter", { current: step, total: TOTAL_STEPS })}
            </p>
          </div>
        </div>
      </div>

      {/* Chat scroll area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-4"
        style={{ minHeight: 0 }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-end gap-2 animate-fade-in ${
              m.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {m.role === "ai" && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                <img src={ciraLogo} alt="Cira" width={18} height={18} />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              }`}
              style={{ fontSize: "16px" }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Step 8: review summary */}
        {step === 8 && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="w-8 h-8 shrink-0" />
            <div
              className="max-w-[85%] w-full rounded-2xl bg-card border border-border p-4 space-y-2"
              style={{ fontSize: "16px" }}
            >
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumName")} value={answers.fullName} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumMedication")} value={answers.medication} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumDosage")} value={answers.dosage} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumLastRefill")} value={answers.lastRefill} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumPharmacy")} value={answers.pharmacy} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumAllergies")} value={answers.allergies || "—"} />
              <SummaryRow label={t("pages.prescriptionRefill.chat.sumNotes")} value={answers.notes || "—"} />
            </div>
          </div>
        )}
      </div>

      {/* Input + Continue */}
      <div className="border-t border-border bg-background px-4 sm:px-6 py-4">
        {step < 8 && (
          <div className="mb-3">
            {step === 7 ? (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t("pages.prescriptionRefill.chat.inputPlaceholder")}
                rows={3}
                className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                style={{ fontSize: "16px", minHeight: 48 }}
              />
            ) : (
              <input
                type={step === 4 ? "date" : "text"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canContinue) handleContinue();
                }}
                placeholder={t("pages.prescriptionRefill.chat.inputPlaceholder")}
                className="w-full rounded-full border border-border bg-card px-5 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ fontSize: "16px", minHeight: 48 }}
                autoFocus
              />
            )}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="inline-flex items-center justify-center px-8 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ minHeight: 48, fontSize: "16px" }}
          >
            {step === 8
              ? t("pages.prescriptionRefill.chat.confirmSend")
              : t("pages.prescriptionRefill.chat.continue")}
          </button>
        </div>
      </div>
    </div>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span className="text-foreground font-medium text-right break-words">{value}</span>
  </div>
);

export default PrescriptionRefillChat;
