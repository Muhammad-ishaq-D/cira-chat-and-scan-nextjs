import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Loader2, Send, Stethoscope, RotateCcw } from "lucide-react";
import { getToken, getUser } from "@/lib/auth";
import { getDeviceId } from "@/lib/freeCredits";
import AiSparkleIcon from "@/components/AiSparkleIcon";

const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
const AIR_DOCTOR_URL = "https://airdoctor.biz/Cira";

type Msg = {
  id: string;
  role: "ai" | "user";
  text: string;
  animate?: boolean;
};

type ConsultResult = {
  cleared: boolean;
  flag_reason?: string;
};

type RefillChatResponse = {
  reply: string;
  consult_result?: ConsultResult;
  consult_clearance_token?: string;
};

type ScreeningQuestion = {
  key: "healthChanges" | "allergies" | "otherMeds";
  textKey: string;
};

const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  { key: "healthChanges", textKey: "pages.prescriptionRefill.chat.q1" },
  { key: "allergies", textKey: "pages.prescriptionRefill.chat.q2" },
  { key: "otherMeds", textKey: "pages.prescriptionRefill.chat.q3" },
];

const flagKeywords = [
  "pregnan", "chest pain", "faint", "blood pressure", "diabetes", "stroke",
  "anaphyl", "swelling", "heart", "kidney", "liver", "shortness of breath", "rash",
];

const isAffirmative = (text: string) => /\b(yes|yeah|yep|new|changed|reaction|allerg|taking|started|currently|supplement)\b/i.test(text);
const isNegative = (text: string) => /\b(no|none|nope|not|never|n\/a|na)\b/i.test(text);

const shouldFlagLocalResponse = (question: ScreeningQuestion, answer: string) => {
  const normalized = answer.toLowerCase();
  if (flagKeywords.some((k) => normalized.includes(k))) return true;
  if (question.key === "healthChanges" || question.key === "allergies") {
    return isAffirmative(answer) && !isNegative(answer);
  }
  return false;
};

type Props = {
  refillId: string;
  medicationSummary?: string;
  onCleared: (token: string) => void;
  onStartOver: () => void;
};

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Lightweight markdown: **bold**, *italic*, `code`
const renderFormatted = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-muted px-1 py-0.5 rounded text-[13px]">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

// Smooth typewriter matching Cira's main chat feel (fast, code-point aware)
const TypewriterText = ({ text, speed = 6, onDone }: { text: string; speed?: number; onDone?: () => void }) => {
  const [displayed, setDisplayed] = useState("");
  const doneRef = useRef(false);
  useEffect(() => {
    setDisplayed("");
    doneRef.current = false;
    const chars = Array.from(text);
    let i = 0;
    const interval = setInterval(() => {
      i += 3;
      setDisplayed(chars.slice(0, i).join(""));
      if (i >= chars.length) {
        clearInterval(interval);
        if (!doneRef.current) {
          doneRef.current = true;
          onDone?.();
        }
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);
  return <span className="whitespace-pre-line">{renderFormatted(displayed)}</span>;
};

const THINKING_PHRASES = ["Thinking...", "Reviewing your answer...", "One moment...", "Checking safety..."];
const ThinkingLabel = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % THINKING_PHRASES.length), 2000);
    return () => clearInterval(t);
  }, []);
  return <span className="text-foreground/60 italic" style={{ fontSize: 13 }}>{THINKING_PHRASES[idx]}</span>;
};

const HealthScreeningChat = ({ refillId, medicationSummary = "", onCleared, onStartOver }: Props) => {
  const { t } = useTranslation();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(true); // start with typing indicator visible
  const [phase, setPhase] = useState<"chatting" | "cleared" | "flagged" | "error">("chatting");
  const [error, setError] = useState<string>("");
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackQuestionIndex, setFallbackQuestionIndex] = useState(0);
  const [fallbackFlagged, setFallbackFlagged] = useState(false);

  const startedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const refocus = () => {
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const pushAi = (text: string) =>
    setMessages((prev) => [...prev, { id: newId(), role: "ai", text, animate: true }]);

  const startFallbackScreening = async () => {
    setFallbackMode(true);
    setFallbackQuestionIndex(0);
    setFallbackFlagged(false);
    setPhase("chatting");
    setError("");
    await new Promise((r) => setTimeout(r, 300));
    pushAi(t(SCREENING_QUESTIONS[0].textKey));
    setTyping(false);
    refocus();
  };

  const sendFallback = async (message: string) => {
    setSending(true);
    setTyping(true);
    setError("");
    await new Promise((r) => setTimeout(r, 450));

    const currentQuestion = SCREENING_QUESTIONS[fallbackQuestionIndex];
    const flagged = fallbackFlagged || shouldFlagLocalResponse(currentQuestion, message);
    const nextIndex = fallbackQuestionIndex + 1;

    if (nextIndex < SCREENING_QUESTIONS.length) {
      setFallbackFlagged(flagged);
      setFallbackQuestionIndex(nextIndex);
      pushAi(t(SCREENING_QUESTIONS[nextIndex].textKey));
      setSending(false);
      setTyping(false);
      refocus();
      return;
    }

    if (flagged) {
      setPhase("flagged");
      pushAi(t("pages.prescriptionRefill.chat.screeningRecommendation"));
    } else {
      setPhase("cleared");
      pushAi(t("pages.prescriptionRefill.chat.screeningCleared"));
      setTimeout(() => onCleared(`local-${refillId}-${Date.now()}`), 900);
    }
    setSending(false);
    setTyping(false);
  };

  const send = async (message: string, isHidden = false) => {
    if (fallbackMode) {
      await sendFallback(message);
      return;
    }
    setSending(true);
    setTyping(true);
    setError("");
    try {
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const outboundMessage = isHidden && medicationSummary.trim()
        ? `start\n\nSelected medication(s): ${medicationSummary.trim()}`
        : message;

      const res = await fetch(`${API_BASE}/api/prescription/refill-chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          refill_id: refillId,
          message: outboundMessage,
          medications: medicationSummary.trim() || undefined,
        }),
      });
      if (!res.ok) {
        if (res.status >= 500) {
          await startFallbackScreening();
          return;
        }
        throw new Error(`Request failed (${res.status})`);
      }
      const data = (await res.json()) as RefillChatResponse;

      await new Promise((r) => setTimeout(r, 250));

      if (data.reply) pushAi(data.reply);

      if (data.consult_result) {
        if (data.consult_result.cleared) {
          setPhase("cleared");
          const token = data.consult_clearance_token || "";
          pushAi(t("pages.prescriptionRefill.chat.screeningCleared"));
          setTimeout(() => onCleared(token), 1400);
        } else {
          setPhase("flagged");
          const reason = data.consult_result.flag_reason?.trim();
          if (reason && reason !== data.reply) pushAi(reason);
          pushAi(t("pages.prescriptionRefill.chat.screeningRecommendation"));
        }
      }
      refocus();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("pages.prescriptionRefill.chat.screeningError");
      setError(message);
      setPhase("error");
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  // Kick off with hidden "start"
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void send("start", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const doScroll = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    doScroll();
    const t1 = setTimeout(doScroll, 120);
    const t2 = setTimeout(doScroll, 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [messages, typing, phase]);

  // Autosize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || sending || phase !== "chatting") return;
    setMessages((prev) => [...prev, { id: newId(), role: "user", text }]);
    setInput("");
    void send(text);
  };

  const handleBookDoctor = () => {
    const user = getUser();
    const deviceId = getDeviceId();
    const trackingData = {
      clicked_at: new Date().toISOString(),
      page: typeof window !== "undefined" ? window.location.pathname : "",
      source: "prescription_refill_screening",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      user_id: user?.id || null,
      user_email: user?.email || null,
      device_id: deviceId || null,
    };
    try {
      fetch(`${API_BASE}/api/tracking/airdoctor-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      }).catch(() => {});
    } catch { void 0; }
    try {
      const clicks = JSON.parse(localStorage.getItem("cira_airdoctor_clicks") || "[]");
      clicks.push(trackingData);
      localStorage.setItem("cira_airdoctor_clicks", JSON.stringify(clicks.slice(-100)));
    } catch { void 0; }
    window.open(AIR_DOCTOR_URL, "_blank", "noopener,noreferrer");
  };

  const handleRetry = () => {
    setError("");
    setPhase("chatting");
    void send(messages.length === 0 ? "start" : "continue");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-hide px-4 sm:px-6 py-4 space-y-3 w-full max-w-3xl mx-auto"
        style={{ minHeight: 0 }}
      >
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role}>
            {m.role === "ai" && m.animate ? (
              <TypewriterText text={m.text} />
            ) : m.role === "ai" ? (
              <span className="whitespace-pre-line">{renderFormatted(m.text)}</span>
            ) : (
              m.text
            )}
          </Bubble>
        ))}

        {typing && (
          <Bubble role="ai">
            <span className="inline-flex items-center gap-2">
              <TypingDots />
              <ThinkingLabel />
            </span>
          </Bubble>
        )}

        {phase === "error" && (
          <Bubble role="ai" wide>
            <div className="space-y-3">
              <p style={{ fontSize: 14.5 }}>{error || t("pages.prescriptionRefill.chat.screeningError")}</p>
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90"
              >
                {t("pages.prescriptionRefill.chat.screeningRetry")}
              </button>
            </div>
          </Bubble>
        )}

        {phase === "flagged" && (
          <Bubble role="ai" wide>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-foreground pt-1.5" style={{ fontSize: 16 }}>
                  {t("pages.prescriptionRefill.chat.flaggedTitle")}
                </h3>
              </div>
              <button
                onClick={handleBookDoctor}
                className="w-full rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                style={{ minHeight: 52, fontSize: 16 }}
              >
                <Stethoscope className="w-5 h-5" />
                {t("pages.prescriptionRefill.chat.bookDoctor")}
              </button>
              <button
                onClick={onStartOver}
                className="w-full rounded-full border border-border bg-background text-foreground font-medium hover:bg-accent transition-colors flex items-center justify-center gap-2"
                style={{ minHeight: 48, fontSize: 15 }}
              >
                <RotateCcw className="w-4 h-4" />
                {t("pages.prescriptionRefill.chat.startOver")}
              </button>
            </div>
          </Bubble>
        )}
      </div>

      {phase === "chatting" && (
        <div className="border-t border-border bg-background px-3 sm:px-5 py-3">
          <div className="flex gap-2 w-full max-w-3xl mx-auto items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={t("pages.prescriptionRefill.chat.screeningInputPlaceholder")}
              disabled={sending}
              autoFocus
              rows={1}
              className="flex-1 resize-none rounded-3xl border border-border bg-card px-5 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60 transition-shadow"
              style={{ fontSize: 16, minHeight: 48, maxHeight: 140, lineHeight: "1.4" }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || sending}
              aria-label={t("common.send", "Send")}
              className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-40 disabled:scale-95 flex items-center justify-center shrink-0 active:scale-95"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Bubble = ({
  role,
  children,
  wide,
}: {
  role: "ai" | "user";
  children: React.ReactNode;
  wide?: boolean;
}) => (
  <div className={`flex animate-fade-in ${role === "user" ? "justify-end" : "justify-start"}`}>
    <div
      className={`${wide ? "max-w-full w-full" : "max-w-[90%] md:max-w-[80%]"} px-4 py-2.5 leading-relaxed shadow-sm ${
        role === "user"
          ? "bg-primary text-primary-foreground rounded-[22px] rounded-tr-md"
          : "bg-secondary/80 text-foreground rounded-[22px] rounded-tl-md"
      }`}
      style={{ fontSize: 14.5 }}
    >
      {children}
    </div>
  </div>
);

const TypingDots = () => (
  <span className="inline-flex items-center gap-1 h-4">
    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
    <span className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
  </span>
);

export default HealthScreeningChat;
