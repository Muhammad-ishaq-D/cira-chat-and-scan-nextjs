import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FileText, ChevronRight, SkipForward, Pencil, Download,
  CheckCircle, Loader2, Users, ArrowLeft, ClipboardList,
  Stethoscope, AlertCircle,
} from "lucide-react";
import { getUser, getToken } from "@/lib/auth";
import { userApi } from "@/lib/apiClient";
import { referralApi, type ReferralLetter, type ReferralGenerateRequest } from "@/lib/referralApi";
import { secureStorage } from "@/lib/storage";
import { toast } from "sonner";
import AiSparkleIcon from "@/components/AiSparkleIcon";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "cira" | "user" | "form";
  text?: string;
  formKey?: string;
  formType?: "text" | "buttons" | "date" | "tel";
  buttons?: { id: string; label: string }[];
  skippable?: boolean;
  skipLabel?: string;
  answered?: boolean;
}

interface Answers {
  // Phase 1
  patientName?: string;
  patientDOB?: string;
  patientSex?: string;
  patientContact?: string;
  // Phase 2
  specialistSpecialty?: string;
  specialistClinic?: string;
  urgency?: "routine" | "urgent" | "two-week-wait";
  // Phase 3
  reasonForReferral?: string;
  historyOfComplaint?: string;
  triedTreatments?: string;
  // Phase 4
  pastMedicalHistory?: string;
  currentMedications?: string;
  allergies?: string;
  // Phase 5
  investigationsDone?: string;
  // Phase 6
  specificRequest?: "assess" | "diagnose" | "treat" | "second-opinion";
  enclosures?: string;
}

interface Props {
  onExit: () => void;
  /** If shen AI vitals were captured in the session they are passed here */
  sessionVitals?: { heartRate?: number; bloodPressure?: string; spo2?: number } | null;
}

// ─── Question definitions (keyed for i18n lookup) ─────────────────────────────

interface QuestionDef {
  key: keyof Answers;
  questionKey: string;   // i18n key for the question text
  type: "text" | "buttons" | "date" | "tel";
  buttons?: { id: string; labelKey: string }[];
  skippable?: boolean;
  skipLabelKey?: string;
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  guestOnly?: boolean;   // only asked of guests
}

const QUESTIONS: QuestionDef[] = [
  // ── Phase 1 (guest-only) ──────────────────────────────────────────────────
  { key: "patientName",      questionKey: "referral.q.patientName",      type: "text",    phase: 1, guestOnly: true },
  { key: "patientDOB",       questionKey: "referral.q.patientDOB",       type: "date",    phase: 1, guestOnly: true },
  { key: "patientSex",       questionKey: "referral.q.patientSex",       type: "buttons", phase: 1, guestOnly: true,
    buttons: [{ id: "Male", labelKey: "referral.sex.male" }, { id: "Female", labelKey: "referral.sex.female" }, { id: "Other", labelKey: "referral.sex.other" }] },
  { key: "patientContact",   questionKey: "referral.q.patientContact",   type: "tel",     phase: 1, guestOnly: true },

  // ── Phase 2 ───────────────────────────────────────────────────────────────
  { key: "specialistSpecialty", questionKey: "referral.q.specialistSpecialty", type: "text",    phase: 2 },
  { key: "specialistClinic",    questionKey: "referral.q.specialistClinic",    type: "text",    phase: 2, skippable: true, skipLabelKey: "referral.btn.skip" },
  { key: "urgency", questionKey: "referral.q.urgency", type: "buttons", phase: 2,
    buttons: [
      { id: "routine",       labelKey: "referral.urgency.routine" },
      { id: "urgent",        labelKey: "referral.urgency.urgent" },
      { id: "two-week-wait", labelKey: "referral.urgency.twoWeekWait" },
    ] },

  // ── Phase 3 ───────────────────────────────────────────────────────────────
  { key: "reasonForReferral",  questionKey: "referral.q.reasonForReferral",  type: "text", phase: 3 },
  { key: "historyOfComplaint", questionKey: "referral.q.historyOfComplaint", type: "text", phase: 3 },
  { key: "triedTreatments",    questionKey: "referral.q.triedTreatments",    type: "text", phase: 3, skippable: true, skipLabelKey: "referral.btn.skip" },

  // ── Phase 4 ───────────────────────────────────────────────────────────────
  { key: "pastMedicalHistory", questionKey: "referral.q.pastMedicalHistory", type: "text", phase: 4, skippable: true, skipLabelKey: "referral.btn.skip" },
  { key: "currentMedications", questionKey: "referral.q.currentMedications", type: "text", phase: 4, skippable: true, skipLabelKey: "referral.btn.skip" },
  { key: "allergies",          questionKey: "referral.q.allergies",          type: "text", phase: 4, skippable: true, skipLabelKey: "referral.btn.none" },

  // ── Phase 5 ───────────────────────────────────────────────────────────────
  { key: "investigationsDone", questionKey: "referral.q.investigationsDone", type: "text", phase: 5, skippable: true, skipLabelKey: "referral.btn.skip" },

  // ── Phase 6 ───────────────────────────────────────────────────────────────
  { key: "specificRequest", questionKey: "referral.q.specificRequest", type: "buttons", phase: 6,
    buttons: [
      { id: "assess",         labelKey: "referral.request.assess" },
      { id: "diagnose",       labelKey: "referral.request.diagnose" },
      { id: "treat",          labelKey: "referral.request.treat" },
      { id: "second-opinion", labelKey: "referral.request.secondOpinion" },
    ] },
  { key: "enclosures", questionKey: "referral.q.enclosures", type: "text", phase: 6, skippable: true, skipLabelKey: "referral.btn.none" },
];

// ─── Summary field definitions ───────────────────────────────────────────────

const SUMMARY_FIELDS: { key: keyof Answers; labelKey: string }[] = [
  { key: "patientName",         labelKey: "referral.summary.patientName" },
  { key: "patientDOB",          labelKey: "referral.summary.patientDOB" },
  { key: "patientSex",          labelKey: "referral.summary.patientSex" },
  { key: "patientContact",      labelKey: "referral.summary.patientContact" },
  { key: "specialistSpecialty", labelKey: "referral.summary.specialistSpecialty" },
  { key: "specialistClinic",    labelKey: "referral.summary.specialistClinic" },
  { key: "urgency",             labelKey: "referral.summary.urgency" },
  { key: "reasonForReferral",   labelKey: "referral.summary.reasonForReferral" },
  { key: "historyOfComplaint",  labelKey: "referral.summary.historyOfComplaint" },
  { key: "triedTreatments",     labelKey: "referral.summary.triedTreatments" },
  { key: "pastMedicalHistory",  labelKey: "referral.summary.pastMedicalHistory" },
  { key: "currentMedications",  labelKey: "referral.summary.currentMedications" },
  { key: "allergies",           labelKey: "referral.summary.allergies" },
  { key: "investigationsDone",  labelKey: "referral.summary.investigationsDone" },
  { key: "specificRequest",     labelKey: "referral.summary.specificRequest" },
  { key: "enclosures",          labelKey: "referral.summary.enclosures" },
];

// ─── Chat bubble components ───────────────────────────────────────────────────

const TypewriterText = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);
  return <>{displayed}</>;
};

const CiraBubble = ({ text }: { text: string }) => (
  <div className="flex justify-start animate-fade-in">
    <div className="max-w-[88%] md:max-w-[75%]">
      <div className="flex items-start gap-2 mb-1">
        <div className="shrink-0 mt-2">
          <AiSparkleIcon size={20} active />
        </div>
        <div
          className="bg-card border border-border/50 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          <p className="text-[14px] leading-6 text-foreground whitespace-pre-line">
            <TypewriterText text={text} speed={10} />
          </p>
        </div>
      </div>
    </div>
  </div>
);

const UserBubble = ({ text }: { text: string }) => (
  <div className="flex justify-end animate-fade-in">
    <div
      className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] shadow-sm"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <p className="text-[14px] leading-6 whitespace-pre-line">{text}</p>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReferralLetterChat({ onExit, sessionVitals }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const localUser = getUser();
  const isAuthenticated = !!getToken();

  // ── State ─────────────────────────────────────────────────────────────────
  const [chatLog, setChatLog] = useState<{ role: "cira" | "user"; text: string }[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1); // -1 = intro
  const [inputValue, setInputValue] = useState("");
  const [phase, setPhase] = useState<"intro" | "questions" | "summary" | "generating" | "done">("intro");
  const [editingKey, setEditingKey] = useState<keyof Answers | null>(null);
  const [generatedReferral, setGeneratedReferral] = useState<ReferralLetter | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Build chat history for API (all Q&A pairs)
  const buildChatHistory = useCallback(() => {
    const history: { role: "user" | "assistant"; content: string }[] = [];
    // Include all answered questions
    getActiveQuestions().forEach((q) => {
      const answer = answers[q.key];
      if (answer !== undefined) {
        history.push({ role: "assistant", content: t(q.questionKey) });
        history.push({ role: "user", content: String(answer) });
      }
    });
    return history;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, t]);

  // ── Load profile for authenticated users ──────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      setProfileLoaded(true);
      return;
    }
    userApi.getProfile()
      .then((p: any) => {
        setUserProfile(p);
        // Pre-fill from profile
        setAnswers(prev => ({
          ...prev,
          patientName: p?.name || localUser?.name || undefined,
          patientDOB: p?.dob || undefined,
          patientSex: p?.biological_sex || undefined,
          patientContact: p?.email || localUser?.email || undefined,
        }));
      })
      .catch(() => { /* non-fatal */ })
      .finally(() => setProfileLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const doScroll = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    doScroll();
    const t1 = setTimeout(doScroll, 150);
    return () => clearTimeout(t1);
  }, [chatLog, phase, currentQuestionIndex]);

  // Focus input when question changes
  useEffect(() => {
    if (phase === "questions" && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [currentQuestionIndex, phase]);

  // ── Questions helper ──────────────────────────────────────────────────────
  const getActiveQuestions = useCallback((): QuestionDef[] => {
    return QUESTIONS.filter(q => {
      if (q.guestOnly && isAuthenticated) return false;
      // Skip vitals question if session has vitals
      if (q.key === "investigationsDone" && sessionVitals) return false;
      return true;
    });
  }, [isAuthenticated, sessionVitals]);

  // ── Start flow after profile loaded ──────────────────────────────────────
  useEffect(() => {
    if (!profileLoaded) return;
    const intro = t("referral.intro");
    setChatLog([{ role: "cira", text: intro }]);
    setPhase("intro");
  }, [profileLoaded, t]);

  // ── Advance to next question ──────────────────────────────────────────────
  const advanceToNextQuestion = useCallback((fromIndex: number, currentAnswers: Answers) => {
    const activeQs = getActiveQuestions();
    const nextIndex = fromIndex + 1;

    if (nextIndex >= activeQs.length) {
      // All answered — show summary
      setPhase("summary");
      setChatLog(prev => [
        ...prev,
        { role: "cira", text: t("referral.summaryIntro") },
      ]);
      return;
    }

    const nextQ = activeQs[nextIndex];
    setCurrentQuestionIndex(nextIndex);

    // If vitals present and we're at the vitals confirmation, add confirmation bubble
    if (nextQ.key === "investigationsDone" && sessionVitals) {
      const confirmText = t("referral.vitalsConfirm", {
        hr: sessionVitals.heartRate ?? "—",
        bp: sessionVitals.bloodPressure ?? "—",
        spo2: sessionVitals.spo2 ?? "—",
      });
      setChatLog(prev => [...prev, { role: "cira", text: confirmText }]);
      // Auto-advance past it
      advanceToNextQuestion(nextIndex, currentAnswers);
      return;
    }

    setChatLog(prev => [...prev, { role: "cira", text: t(nextQ.questionKey) }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getActiveQuestions, sessionVitals, t]);

  // ── Handle start button ───────────────────────────────────────────────────
  const handleStart = () => {
    setChatLog(prev => [...prev, { role: "user", text: t("referral.btn.letsGo") }]);
    const activeQs = getActiveQuestions();
    if (activeQs.length === 0) {
      setPhase("summary");
      return;
    }
    setPhase("questions");
    setCurrentQuestionIndex(0);
    setChatLog(prev => [...prev, { role: "cira", text: t(activeQs[0].questionKey) }]);
  };

  // ── Handle answer submission ──────────────────────────────────────────────
  const submitAnswer = (key: keyof Answers, value: string, displayValue?: string) => {
    const updatedAnswers = { ...answers, [key]: value };
    setAnswers(updatedAnswers);
    const display = displayValue || value;
    setChatLog(prev => [...prev, { role: "user", text: display }]);
    setInputValue("");

    if (editingKey) {
      // Jump back to summary after edit
      setEditingKey(null);
      setPhase("summary");
      setChatLog(prev => [...prev, { role: "cira", text: t("referral.editSaved") }]);
      return;
    }

    const activeQs = getActiveQuestions();
    advanceToNextQuestion(currentQuestionIndex, updatedAnswers);
  };

  const handleSkip = (key: keyof Answers) => {
    const updatedAnswers = { ...answers, [key]: undefined };
    setAnswers(updatedAnswers);
    setChatLog(prev => [...prev, { role: "user", text: t("referral.btn.skip") }]);
    setInputValue("");

    if (editingKey) {
      setEditingKey(null);
      setPhase("summary");
      setChatLog(prev => [...prev, { role: "cira", text: t("referral.editSaved") }]);
      return;
    }

    advanceToNextQuestion(currentQuestionIndex, updatedAnswers);
  };

  const handleButtonChoice = (key: keyof Answers, id: string, label: string) => {
    submitAnswer(key, id, label);
  };

  const handleTextSubmit = () => {
    if (!inputValue.trim()) return;
    const activeQs = getActiveQuestions();
    const q = editingKey
      ? activeQs.find(q => q.key === editingKey)
      : activeQs[currentQuestionIndex];
    if (!q) return;
    submitAnswer(q.key, inputValue.trim());
  };

  // ── Edit flow ─────────────────────────────────────────────────────────────
  const handleEdit = (key: keyof Answers) => {
    setEditingKey(key);
    setPhase("questions");
    const activeQs = getActiveQuestions();
    const idx = activeQs.findIndex(q => q.key === key);
    setCurrentQuestionIndex(idx);
    const q = activeQs[idx];
    setChatLog(prev => [
      ...prev,
      { role: "cira", text: t("referral.editPrompt") + " " + t(q.questionKey) },
    ]);
  };

  // ── Generate referral ─────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsGenerating(true);
    setPhase("generating");

    try {
      const chatHistory = buildChatHistory();
      const userType = isAuthenticated ? "authenticated" : "guest";

      // Compose payload
      const payload: ReferralGenerateRequest = {
        chatHistory,
        userType,
        reasonForReferral: answers.reasonForReferral || "General referral",
        urgency: (answers.urgency as any) || "routine",
        specialistSpecialty: answers.specialistSpecialty || "Specialist",
        specificRequest: (answers.specificRequest as any) || "assess",
        patientName: answers.patientName || null,
        patientDOB: answers.patientDOB || null,
        patientSex: answers.patientSex || null,
        patientContact: answers.patientContact || null,
        specialistName: null,
        specialistClinic: answers.specialistClinic || null,
        historyOfComplaint: [answers.historyOfComplaint, answers.triedTreatments].filter(Boolean).join(". ") || null,
        pastMedicalHistory: answers.pastMedicalHistory || null,
        currentMedications: answers.currentMedications || null,
        allergies: answers.allergies || null,
        vitalScanData: sessionVitals
          ? {
              heartRate: sessionVitals.heartRate ?? null,
              bloodPressure: sessionVitals.bloodPressure ?? null,
              spo2: sessionVitals.spo2 ?? null,
            }
          : null,
        investigationsDone: answers.investigationsDone || null,
        enclosures: answers.enclosures || null,
      };

      // Step 1: Generate structured referral JSON
      const referral = await referralApi.generate(payload);
      setGeneratedReferral(referral);

      // Step 2: Generate PDF
      const blob = await referralApi.downloadPDF(referral);
      setPdfBlob(blob);

      // Auto-download
      triggerDownload(blob, `referral-${referral.referenceNumber}.pdf`);

      // Mark done
      setPhase("done");
    } catch (err: any) {
      console.error("[Referral] Generation error:", err);
      toast.error(t("referral.errorGenerate") + ": " + (err.message || "Unknown error"));
      setPhase("summary");
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("[Referral] Download error:", e);
    }
  };

  const handleManualDownload = () => {
    if (!pdfBlob || !generatedReferral) return;
    triggerDownload(pdfBlob, `referral-${generatedReferral.referenceNumber}.pdf`);
  };

  // ── Current question ──────────────────────────────────────────────────────
  const activeQs = getActiveQuestions();
  const currentQ = phase === "questions" && currentQuestionIndex >= 0
    ? (editingKey ? activeQs.find(q => q.key === editingKey) : activeQs[currentQuestionIndex])
    : null;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!profileLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 size={24} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent items-center">
      <div className="w-full max-w-2xl flex flex-col h-full relative bg-transparent">
        {/* ── Chat area ──────────────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* Chat log */}
          {chatLog.map((msg, i) =>
            msg.role === "cira"
              ? <CiraBubble key={i} text={msg.text} />
              : <UserBubble key={i} text={msg.text} />
          )}

          {/* ── Phase: INTRO ─────────────────────────────────────────────────── */}
          {phase === "intro" && (
            <div className="animate-fade-in flex justify-start">
              <div className="ml-9">
                <button
                  onClick={handleStart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-[13px] font-semibold rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <ChevronRight size={15} />
                  {t("referral.btn.letsGo")}
                </button>
              </div>
            </div>
          )}

          {/* ── Phase: QUESTIONS ─────────────────────────────────────────────── */}
          {phase === "questions" && currentQ && (
            <div className="animate-fade-in ml-9 space-y-2">
              {/* Button choices */}
              {currentQ.type === "buttons" && currentQ.buttons && (
                <div className="flex flex-wrap gap-2">
                  {currentQ.buttons.map(btn => (
                    <button
                      key={btn.id}
                      onClick={() => handleButtonChoice(currentQ.key, btn.id, t(btn.labelKey))}
                      className="px-4 py-2 bg-card border border-border text-primary text-[13px] font-medium rounded-xl hover:bg-accent hover:border-border transition-all active:scale-95 shadow-sm"
                    >
                      {t(btn.labelKey)}
                    </button>
                  ))}
                  {currentQ.skippable && (
                    <button
                      onClick={() => handleSkip(currentQ.key)}
                      className="px-4 py-2 bg-card border border-border text-muted-foreground text-[13px] rounded-xl hover:bg-accent transition-all active:scale-95"
                    >
                      <SkipForward size={13} className="inline mr-1" />
                      {t(currentQ.skipLabelKey || "referral.btn.skip")}
                    </button>
                  )}
                </div>
              )}

              {/* Text / date / tel input */}
              {(currentQ.type === "text" || currentQ.type === "date" || currentQ.type === "tel") && (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <input
                      ref={inputRef}
                      type={currentQ.type === "date" ? "date" : currentQ.type === "tel" ? "tel" : "text"}
                      value={inputValue}
                      onChange={e => setInputValue(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                      placeholder={t("referral.inputPlaceholder")}
                      className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5 text-[14px] text-foreground outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                    />
                    <button
                      onClick={handleTextSubmit}
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 hover:bg-primary/90 transition-colors active:scale-95 shrink-0"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                  {currentQ.skippable && (
                    <button
                      onClick={() => handleSkip(currentQ.key)}
                      className="self-start text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                    >
                      <SkipForward size={12} />
                      {t(currentQ.skipLabelKey || "referral.btn.skip")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Phase: SUMMARY ───────────────────────────────────────────────── */}
          {phase === "summary" && (
            <div className="animate-fade-in space-y-3">
              {/* Summary card */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-border bg-card/60">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={15} className="text-primary" />
                    <p className="text-[13px] font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                      {t("referral.summaryTitle")}
                    </p>
                  </div>
                </div>

                {/* Session vitals badge */}
                {sessionVitals && (
                  <div className="mx-4 mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-[11px] text-emerald-600 font-medium">
                      {t("referral.vitalsIncluded")}
                    </span>
                  </div>
                )}

                <div className="p-4 space-y-2">
                  {SUMMARY_FIELDS.map(({ key, labelKey }) => {
                    const value = answers[key];
                    // Skip Phase 1 fields for authenticated users
                    const qDef = QUESTIONS.find(q => q.key === key);
                    if (qDef?.guestOnly && isAuthenticated) return null;
                    // Skip vitals question if session vitals present
                    if (key === "investigationsDone" && sessionVitals) return null;

                    return (
                      <div
                        key={key}
                        className="flex items-start gap-2 group"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] text-primary/70 font-medium uppercase tracking-wide leading-none">
                            {t(labelKey)}
                          </span>
                          <p className="text-[13px] text-foreground leading-snug mt-0.5 break-words">
                            {value
                              ? (key === "urgency"
                                ? t(`referral.urgency.${value.toString().replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`)
                                : key === "specificRequest"
                                  ? t(`referral.request.${value.toString().replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`)
                                  : String(value))
                              : <span className="text-muted-foreground/60 italic text-[12px]">{t("referral.notProvided")}</span>
                            }
                          </p>
                        </div>
                        <button
                          onClick={() => handleEdit(key)}
                          className="opacity-0 group-hover:opacity-100 shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-card border border-border/50 text-primary/70 hover:text-primary hover:border-border transition-all text-[10px] shadow-sm mt-0.5"
                          title={t("common.edit")}
                        >
                          <Pencil size={9} />
                          {t("common.edit")}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI notice */}
              <div className="flex items-start gap-2 px-1">
                <AlertCircle size={13} className="text-primary/70 shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">{t("referral.aiNotice")}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleGenerate}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-[14px] font-semibold shadow-sm hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Stethoscope size={16} />
                  {t("referral.btn.generate")}
                </button>
                <button
                  onClick={onExit}
                  className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-[13px] hover:bg-accent transition-colors active:scale-[0.98]"
                >
                  {t("common.back")}
                </button>
              </div>
            </div>
          )}

          {/* ── Phase: GENERATING ────────────────────────────────────────────── */}
          {phase === "generating" && (
            <div className="animate-fade-in flex justify-start">
              <div className="ml-2">
                <div className="bg-card border border-border/50 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-3">
                  <Loader2 size={20} className="animate-spin text-primary shrink-0" />
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{t("referral.generating")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("referral.generatingDesc")}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Phase: DONE ──────────────────────────────────────────────────── */}
          {phase === "done" && generatedReferral && (
            <div className="animate-fade-in space-y-4">
              {/* Success banner */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl px-5 py-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <CheckCircle size={20} className="text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                      {t("referral.doneTitle")}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">{t("referral.doneSubtitle")}</p>
                  </div>
                </div>

                {/* Referral meta */}
                <div className="bg-card/70 rounded-xl px-4 py-3 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("referral.refNumber")}</p>
                      <p className="text-[12px] font-semibold text-foreground mt-0.5">{generatedReferral.referenceNumber}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("referral.issuedOn")}</p>
                      <p className="text-[12px] font-semibold text-foreground mt-0.5">{generatedReferral.dateOfIssue}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("referral.summary.specialistSpecialty")}</p>
                      <p className="text-[12px] font-semibold text-foreground mt-0.5">{generatedReferral.specialistSpecialty}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground uppercase tracking-wide">{t("referral.summary.urgency")}</p>
                      <p className="text-[12px] font-semibold text-foreground mt-0.5 capitalize">{generatedReferral.urgency?.replace(/-/g, " ")}</p>
                    </div>
                  </div>
                </div>

                {/* Diagnosis preview */}
                <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-3">
                  <p className="text-[10px] text-primary/70 font-medium uppercase tracking-wide mb-1">
                    {t("referral.provisionalDiagnosis")} <span className="normal-case">(AI)</span>
                  </p>
                  <p className="text-[12px] text-foreground leading-snug">{generatedReferral.provisionalDiagnosis}</p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleManualDownload}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors active:scale-95"
                  >
                    <Download size={15} />
                    {t("referral.btn.downloadPDF")}
                  </button>
                  <button
                    onClick={() => navigate("/doctor")}
                    className="w-full py-2.5 rounded-xl bg-card border border-border text-primary text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-accent transition-colors active:scale-95"
                  >
                    <Users size={15} />
                    {t("referral.btn.findDoctor")}
                  </button>
                  <button
                    onClick={onExit}
                    className="w-full py-2 text-muted-foreground text-[12px] hover:text-foreground transition-colors"
                  >
                    {t("common.back")}
                  </button>
                </div>
              </div>

              {/* AI disclosure */}
              <div className="flex items-start gap-2 px-1">
                <AlertCircle size={12} className="text-muted-foreground/60 shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground/60 leading-snug">{t("referral.aiDisclosure")}</p>
              </div>
            </div>
          )}

          {/* Spacer at bottom */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
