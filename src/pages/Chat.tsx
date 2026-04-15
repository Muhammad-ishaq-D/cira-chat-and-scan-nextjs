import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Menu, LogOut, Send, Plus, Sparkles, Clock, ScanFace, Activity, MessageCircle, FileText, Stethoscope, ShieldAlert, UserRound, Heart, Wind, Brain, Zap, Scale, X, Camera, RotateCcw, Trash2 } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import ConsultSummaryCard from "@/components/ConsultSummaryCard";
import DetailedReportCard from "@/components/DetailedReportCard";
import type { DetailedReport } from "@/components/DetailedReportCard";
import { extractText, extractToolCalls, type ChatMessage as ApiMessage, type ConsultSummary, type DetailedReportData, type ToolUse, type ClaudeResponse } from "@/lib/chatApi";
import { chatApi } from "@/lib/apiClient";
import { getUser, getToken, logout } from "@/lib/auth";
import { toast } from "sonner";

// Render basic markdown: **bold**, *italic*, `code`
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

const THINKING_PHRASES = ["Thinking...", "Looking into it...", "Processing...", "One moment..."];
const ThinkingLabel = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % THINKING_PHRASES.length), 2000);
    return () => clearInterval(t);
  }, []);
  return <p className="text-[11px] text-muted-foreground/50 mt-1.5 italic font-body">{THINKING_PHRASES[idx]}</p>;
};

// Typewriter component — types full text character by character
const TypewriterText = ({ text, speed = 18, onComplete, formatted = false }: { text: string; speed?: number; onComplete?: () => void; formatted?: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed("");
    indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className="whitespace-pre-line">
      {formatted ? renderFormattedText(displayed) : displayed}
    </span>
  );
};

const LiveTypewriterText = ({
  text,
  speed = 18,
  formatted = false,
  isComplete = false,
  onComplete,
}: {
  text: string;
  speed?: number;
  formatted?: boolean;
  isComplete?: boolean;
  onComplete?: () => void;
}) => {
  const [displayed, setDisplayed] = useState("");
  const targetRef = useRef(text);
  const completionFiredRef = useRef(false);

  useEffect(() => {
    targetRef.current = text;
    completionFiredRef.current = false;
    setDisplayed((prev) => (text.startsWith(prev) ? prev : ""));
  }, [text]);

  useEffect(() => {
    if (!isComplete || displayed.length < text.length || completionFiredRef.current) return;
    completionFiredRef.current = true;
    onComplete?.();
  }, [displayed, text, isComplete, onComplete]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setDisplayed((prev) => {
        const target = targetRef.current;
        if (prev.length >= target.length) return prev;
        return target.slice(0, prev.length + 1);
      });
    }, speed);

    return () => window.clearInterval(interval);
  }, [speed]);

  return (
    <span className="whitespace-pre-line">
      {formatted ? renderFormattedText(displayed) : displayed}
    </span>
  );
};



type ChatMode = "none" | "assessment" | "vitals" | "chat";

const chatModes = [
  {
    id: "assessment" as ChatMode,
    icon: Stethoscope,
    title: "Assessment",
    desc: "Cira adapts — quick triage or deep clinical intake based on your issue.",
    badge: "Adaptive · AI-Driven",
    gradient: "from-blue-500 to-purple-400",
    bgGlow: "bg-blue-100",
  },
  {
    id: "vitals" as ChatMode,
    icon: ScanFace,
    title: "Vital Scan + Assessment",
    desc: "30-second face scan captures real vitals — then Cira cross-references with your symptoms for a data-driven consultation.",
    badge: "~4 min · Scan Powered",
    gradient: "from-emerald-500 to-teal-400",
    bgGlow: "bg-emerald-100",
  },
];

const scanVitals = [
  { label: "Heart Rate", value: "72", unit: "bpm", icon: Heart, color: "text-red-500 bg-red-50" },
  { label: "Blood Pressure", value: "118/76", unit: "mmHg", icon: Activity, color: "text-pink-500 bg-pink-50" },
  { label: "Breathing Rate", value: "16", unit: "/min", icon: Wind, color: "text-cyan-500 bg-cyan-50" },
  { label: "Stress Index", value: "32", unit: "/100", icon: Brain, color: "text-purple-500 bg-purple-50" },
  { label: "HRV", value: "54", unit: "ms", icon: Zap, color: "text-amber-500 bg-amber-50" },
  { label: "BMI", value: "22.4", unit: "kg/m²", icon: Scale, color: "text-emerald-500 bg-emerald-50" },
];

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
];

const FREE_CHAT_WELCOME = "WELCOME_WITH_BUTTONS";

const buildFreeChatPrompt = (userText: string) => [
  userText,
  "",
  "Just Chat mode selected.",
  "Reply conversationally as Cira.",
  "Do not ask the user to choose Assessment or Vital Scan.",
  "Do not call the openModal tool unless the user explicitly asks for an assessment or scan.",
  "Do not begin a structured intake unless the user asks for one.",
].join("\n");

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("chat");
  const [messages, setMessages] = useState<{ role: "user" | "cira" | "vitals" | "summary" | "detailed_report" | "action_buttons"; text: string; vitalsData?: typeof scanVitals; summaryData?: ConsultSummary; detailedData?: DetailedReport; buttons?: Array<{ id: string; label: string; description?: string }> }[]>([{ role: "cira", text: FREE_CHAT_WELCOME }]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("none");
  const [pendingLandingMessage, setPendingLandingMessage] = useState<string | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showFloatingModes, setShowFloatingModes] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMsgIndex, setTypingMsgIndex] = useState<number | null>(null);
  const [streamingMsgIndex, setStreamingMsgIndex] = useState<number | null>(null);
  const [completedStreamingMsgIndices, setCompletedStreamingMsgIndices] = useState<Record<number, true>>({});
  
  const [conversationHistory, setConversationHistory] = useState<ApiMessage[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatModeRef = useRef<ChatMode>("none");
  const currentSessionIdRef = useRef<string | null>(null);
  const prepPayloadSentRef = useRef(false);
  // Keep ref in sync with state so async callbacks always read latest value
  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  const syncChatMode = (mode: ChatMode) => {
    chatModeRef.current = mode;
    setChatMode(mode);
  };

  const syncCurrentSessionId = (sessionId: string | null) => {
    currentSessionIdRef.current = sessionId;
    setCurrentSessionId(sessionId);
    if (!sessionId) prepPayloadSentRef.current = false;
  };

  const clearLiveTypingState = () => {
    setStreamingMsgIndex(null);
    setTypingMsgIndex(null);
    setCompletedStreamingMsgIndices({});
  };

  // Load chat history from API
  const loadChatHistory = useCallback(async () => {
    try {
      const data = await chatApi.getHistory();
      console.log("[Chat History] Raw response:", data);
      const sessions = Array.isArray(data) ? data : data.history || data.sessions || data.data || [];
      setChatHistory(sessions);
    } catch (err: any) {
      console.error("[Chat History] Failed to load:", err);
      if (err.message !== "Session expired") {
        toast.error("Failed to load chat history");
      }
    }
  }, []);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Auto-scroll to bottom when messages change or typing starts
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      const doScroll = () => el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      doScroll();
      // Repeat to catch late renders / images loading
      const t1 = setTimeout(doScroll, 150);
      const t2 = setTimeout(doScroll, 400);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [messages, isTyping]);

  // Pick up message from landing page — send to Claude
  useEffect(() => {
    // Check for real scan vitals from VitalsScan page (Shen AI)
    const scanVitalsJson = sessionStorage.getItem("cira_scan_vitals");
    if (scanVitalsJson) {
      sessionStorage.removeItem("cira_scan_vitals");
      try {
        const realVitals = JSON.parse(scanVitalsJson);
        syncChatMode("vitals");
        setShowModeSelection(false);
        setMessages([
          { role: "vitals", text: "Face Scan Results", vitalsData: realVitals },
        ]);
        const vitalsText = realVitals.map((v: any) => `- ${v.label}: ${v.value} ${v.unit}`).join("\n");
        const vitalsMessage = `Here are my face scan vitals results:\n${vitalsText}\n\nPlease analyze these vitals and tell me what they mean for my health. Provide professional insights on each metric. Do NOT call any tools yet — just analyze and respond with your assessment of these numbers.`;
        callClaude(vitalsMessage);
      } catch (e) {
        console.error("[Chat] Error processing scan vitals:", e);
        toast.error("Failed to process scan vitals");
      }
      return;
    }

    const landingMsg = sessionStorage.getItem("cira_landing_message");
    if (landingMsg) {
      sessionStorage.removeItem("cira_landing_message");
      setPendingLandingMessage(landingMsg);
      setMessages([{ role: "user", text: landingMsg }]);
      // Send the initial symptom to Claude — it will trigger TRIGGER 2 + openModal
      callClaude(landingMsg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process Claude tool calls and render UI elements
  const processToolCalls = (toolCalls: ToolUse[], fallbackText = "") => {
    const normalizedFallbackText = fallbackText.toLowerCase();
    const defaultButtons = [
      { id: "face_scan", label: "📸 Face Scan", description: "Capture your vitals in 30 seconds" },
      { id: "book_doctor", label: "🏥 Book a Doctor", description: "Connect with a licensed doctor near you" },
    ];
    const scanOnlyButtons = [defaultButtons[0]];
    const doctorOnlyButtons = [defaultButtons[1]];
    const resolveButtons = (rawButtons: any[]) => {
      const isDoctorRequest = /\b(doctor|dr\.?|appointment|book|booking|specialist|clinic|physician)\b/i.test(normalizedFallbackText);
      const isScanRequest = /\b(scan|face\s*scan|vitals?|capture|measure|check\s*(my|your)?\s*(vitals?|health|blood\s*pressure|heart\s*rate))\b/i.test(normalizedFallbackText);
      if (!rawButtons?.length) {
        return isDoctorRequest ? doctorOnlyButtons : isScanRequest ? scanOnlyButtons : defaultButtons;
      }
      // If backend sent both but context is clearly one, filter
      if (rawButtons.length > 1) {
        if (isDoctorRequest && !isScanRequest) return rawButtons.filter((b: any) => b.id === "book_doctor");
        if (isScanRequest && !isDoctorRequest) return rawButtons.filter((b: any) => b.id === "face_scan");
      }
      return rawButtons;
    };

    for (const tool of toolCalls) {
      switch (tool.name) {
        case "openModal":
          // Only show mode selection if user hasn't already picked one (use ref for latest value)
          if (tool.input.select_care_pathway && chatModeRef.current === "none") {
            setShowModeSelection(true);
          }
          break;
        case "render_ai_consult_summary": {
          const summaryData = tool.input as ConsultSummary;
          setMessages((prev) => [
            ...prev,
            { role: "summary" as const, text: "", summaryData },
          ]);
          // Save quick assessment report to backend
          try {
            const token = getToken();
            if (token) {
              fetch(`${import.meta.env.VITE_API_URL || "https://askainurse.com"}/api/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  title: `Assessment — ${summaryData.possible_conditions?.[0]?.name || "Health Check"}`,
                  type: "Assessment",
                  summary: summaryData.summary,
                  data: summaryData,
                  chat_session_id: currentSessionIdRef.current || undefined,
                }),
              }).catch((e) => console.error("Failed to save report:", e));
            }
          } catch (e) { console.error("Report save error:", e); }
          break;
        }
        case "render_detailed_report": {
          const detailedData = tool.input as DetailedReport;
          setMessages((prev) => [
            ...prev,
            { role: "detailed_report" as const, text: "", detailedData },
          ]);
          // Save detailed assessment report to backend
          try {
            const token = getToken();
            if (token) {
              fetch(`${import.meta.env.VITE_API_URL || "https://askainurse.com"}/api/reports`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  title: `Assessment — ${detailedData.assessment?.primary_diagnosis || "Health Report"}`,
                  type: "Assessment",
                  summary: detailedData.patient_summary,
                  data: detailedData,
                  chat_session_id: currentSessionIdRef.current || undefined,
                }),
              }).catch((e) => console.error("Failed to save report:", e));
            }
          } catch (e) { console.error("Report save error:", e); }
          break;
        }
        case "disconnectAgent":
          if (tool.input.disconnect_now) {
            toast.info("Session ended. Start a new chat to continue.");
            syncChatMode("none");
          }
          break;
        case "prepare_consultation_payload":
          console.log(`[Tool: ${tool.name}]`, tool.input);
          // Send a follow-up ONCE so the agent generates the actual report
          if (!prepPayloadSentRef.current) {
            prepPayloadSentRef.current = true;
            setTimeout(() => {
              const pathway = tool.input?.consultation_payload?.pathway;
              const followUp = pathway === "detailed"
                ? "Tool result received. Now generate the detailed report using render_detailed_report."
                : "Tool result received. Now generate the quick assessment using render_ai_consult_summary.";
              callClaude(followUp, undefined, true);
            }, 500);
          }
          break;
        case "render_action_buttons": {
          const buttons = resolveButtons(tool.input?.buttons);
          setMessages(prev => [...prev, { role: "action_buttons" as const, text: "", buttons }]);
          break;
        }
      }
    }
  };

  // Call Claude API — tries streaming first, falls back to non-streaming
  const callClaude = async (userText: string, image?: string, hidden = false) => {
    const newUserMsg: ApiMessage = { role: "user", text: userText, ...(image ? { image, imageType: "image/png" } : {}) };
    const updatedHistory = [...conversationHistory, newUserMsg];
    const outboundText = chatModeRef.current === "chat" && !currentSessionIdRef.current
      ? buildFreeChatPrompt(userText)
      : userText;

    setConversationHistory(updatedHistory);
    if (!hidden) {
      setIsTyping(true);
    }
    setIsApiLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
      const token = getToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const payload = JSON.stringify({
        message: outboundText,
        sessionId: currentSessionIdRef.current || undefined,
      });

      const res = await fetch(`${API_BASE}/api/anthropic/chat/stream`, {
        method: "POST",
        headers: { ...headers, Accept: "text/event-stream" },
        body: payload,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || errorData?.error || `API error (${res.status})`;
        if (res.status === 402) throw new Error("BILLING_ERROR: " + errorMsg);
        if (res.status === 403 && (errorData?.code === "insufficient_credits" || errorMsg.includes("insufficient"))) {
          throw new Error("CREDITS_EXHAUSTED: " + errorMsg);
        }
        if (res.status === 529) throw new Error("OVERLOADED: " + errorMsg);
        throw new Error(errorMsg);
      }

      // ——— SSE streaming: show text word-by-word as it arrives ———
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";
      let toolCalls: ToolUse[] = [];
      // Accumulate tool_use blocks from streaming events
      let pendingToolBlock: { type: "tool_use"; id: string; name: string; inputJson: string } | null = null;
      const msgIdx = { current: -1 };

      // Add empty placeholder message immediately
      setMessages((prev) => {
        const updated = [...prev, { role: "cira" as const, text: "" }];
        msgIdx.current = updated.length - 1;
        setStreamingMsgIndex(updated.length - 1);
        return updated;
      });
      setIsTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;
          try {
            const event = JSON.parse(data);
            // Debug: log tool-related SSE events
            if (event.type?.includes("content_block") && (event.content_block?.type === "tool_use" || event.delta?.type === "input_json_delta")) {
              console.log("[SSE Tool Event]", event.type, event);
            }
            if (event.type === "message_stop") {
              console.log("[SSE message_stop]", JSON.stringify(event).slice(0, 500));
            }

            if (event.sessionId && event.sessionId !== currentSessionIdRef.current) {
              syncCurrentSessionId(event.sessionId);
            }

            // Live text deltas — render as they arrive
            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              fullText += event.delta.text;
              setMessages((prev) => {
                const updated = [...prev];
                if (msgIdx.current >= 0 && updated[msgIdx.current]) {
                  updated[msgIdx.current] = { ...updated[msgIdx.current], text: fullText };
                }
                return updated;
              });
              if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
              }
            }

            // Tool use streaming: start accumulating
            if (event.type === "content_block_start" && event.content_block?.type === "tool_use") {
              pendingToolBlock = { type: "tool_use", id: event.content_block.id, name: event.content_block.name, inputJson: "" };
            }

            // Tool use streaming: accumulate input JSON deltas
            if (event.type === "content_block_delta" && event.delta?.type === "input_json_delta" && pendingToolBlock) {
              pendingToolBlock.inputJson += event.delta.partial_json || "";
            }

             // Tool use streaming: finalize on content_block_stop
            if (event.type === "content_block_stop") {
              if (event.content_block?.type === "tool_use") {
                // Backend sent the full block in content_block_stop
                console.log("[SSE] Tool from content_block_stop:", event.content_block.name);
                toolCalls.push(event.content_block as ToolUse);
                pendingToolBlock = null;
              } else if (pendingToolBlock) {
                // Build tool from accumulated deltas
                console.log("[SSE] Tool from deltas:", pendingToolBlock.name, "json:", pendingToolBlock.inputJson.slice(0, 200));
                try {
                  const input = pendingToolBlock.inputJson ? JSON.parse(pendingToolBlock.inputJson) : {};
                  toolCalls.push({ type: "tool_use", id: pendingToolBlock.id, name: pendingToolBlock.name, input });
                } catch (e) {
                  console.error("[SSE] Failed to parse tool input JSON:", e);
                }
                pendingToolBlock = null;
              }
            }

            // Also finalize pending tool on message_delta with stop_reason
            if (event.type === "message_delta" && event.delta?.stop_reason && pendingToolBlock) {
              console.log("[SSE] Tool from message_delta fallback:", pendingToolBlock.name);
              try {
                const input = pendingToolBlock.inputJson ? JSON.parse(pendingToolBlock.inputJson) : {};
                toolCalls.push({ type: "tool_use", id: pendingToolBlock.id, name: pendingToolBlock.name, input });
              } catch (e) {
                console.error("[SSE] Failed to parse tool input JSON (fallback):", e);
              }
              pendingToolBlock = null;
            }

            // Backend sends full message in message_stop (fallback if no deltas)
            if (event.type === "message_stop" && event.message) {
              const msg = event.message as ClaudeResponse;
              const finalTools = extractToolCalls(msg);
              if (finalTools.length > 0) toolCalls = finalTools;
              const responseText = extractText(msg);
              if (!fullText) {
                const msgText = responseText;
                if (msgText) {
                  fullText = msgText;
                  setMessages((prev) => {
                    const updated = [...prev];
                    if (msgIdx.current >= 0 && updated[msgIdx.current]) {
                      updated[msgIdx.current] = { ...updated[msgIdx.current], text: fullText };
                    }
                    return updated;
                  });
                }
              }
            }

            // Catch-all: backend may send tool_use as a standalone event or nested differently
            if (event.type === "tool_use" && event.name && event.input) {
              toolCalls.push(event as ToolUse);
            }
            // Some backends send toolCalls array directly on an event
            if (Array.isArray(event.toolCalls)) {
              for (const tc of event.toolCalls) {
                if (tc.type === "tool_use" && tc.name) toolCalls.push(tc);
              }
            }

            if (event.credits) { /* credits available */ }
          } catch { /* skip malformed SSE */ }
        }
      }

      // Finalize any pending tool block that wasn't closed
      if (pendingToolBlock) {
        console.log("[SSE] Finalizing unclosed tool at stream end:", pendingToolBlock.name);
        try {
          const input = pendingToolBlock.inputJson ? JSON.parse(pendingToolBlock.inputJson) : {};
          toolCalls.push({ type: "tool_use", id: pendingToolBlock.id, name: pendingToolBlock.name, input });
        } catch (e) {
          console.error("[SSE] Failed to parse unclosed tool input JSON:", e);
        }
        pendingToolBlock = null;
      }

      console.log("[SSE] Stream complete. Tool calls found:", toolCalls.length, toolCalls.map(t => t.name));

      if (msgIdx.current >= 0) {
        setCompletedStreamingMsgIndices((prev) => ({ ...prev, [msgIdx.current]: true }));
      }
      setStreamingMsgIndex(null);
      if (fullText) {
        setConversationHistory((prev) => [...prev, { role: "assistant", text: fullText }]);
      }

      if (toolCalls.length > 0) {
        processToolCalls(toolCalls, fullText);
        if (!fullText) {
          setMessages((prev) => [
            ...prev,
            { role: "cira" as const, text: "I'm processing your information... Let me continue with my assessment. 💙" },
          ]);
        }
      }

    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      if (msg.startsWith("CREDITS_EXHAUSTED") || msg.startsWith("BILLING_ERROR")) {
        toast.error("You've run out of chat credits. Upgrade your plan to continue.", {
          action: { label: "Upgrade", onClick: () => navigate("/upgrade") },
          duration: 8000,
        });
        setMessages((prev) => [
          ...prev,
          { role: "cira" as const, text: "⚠️ You've used all your chat credits for this plan. Please upgrade to continue our conversation." },
        ]);
      } else if (msg.startsWith("OVERLOADED")) {
        toast.error("Claude is currently overloaded. Please try again in a few seconds.", {
          action: { label: "Retry", onClick: () => callClaude(userText, image) },
        });
      } else {
        toast.error("Failed to get response: " + msg);
      }
      console.error("[Claude Error]", err);
    } finally {
      setIsTyping(false);
      setIsApiLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isApiLoading) return;
    if (chatModeRef.current === "none") syncChatMode("chat");

    const userText = message.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setMessage("");

    callClaude(userText);
  };

  const startScan = () => {
    // Close the mock modal and navigate to real Shen AI scan page
    setShowScanModal(false);
    navigate("/vitals-scan");
  };

  const completeScanAndChat = () => {
    setShowScanModal(false);
    navigate("/vitals-scan");
  };

  const selectMode = (mode: ChatMode) => {
    if (mode === "vitals") {
      syncChatMode(mode);
      setShowModeSelection(false);
      // Navigate directly to the real Shen AI vitals scan page
      navigate("/vitals-scan");
      return;
    }

    syncChatMode(mode);
    setShowModeSelection(false);

    if (mode === "chat") {
      setActiveChat(null);
      syncCurrentSessionId(null);
      setConversationHistory([]);
      prepPayloadSentRef.current = false;
      clearLiveTypingState();

      if (pendingLandingMessage) {
        setMessages([{ role: "user", text: pendingLandingMessage }]);
        setPendingLandingMessage(null);
        void callClaude(pendingLandingMessage);
        return;
      }

      const userText = "💬 I just want to chat";
      setMessages([{ role: "user", text: userText }]);
      callClaude(userText);
      return;
    }

    setPendingLandingMessage(null);

    // Map mode selection to the text Claude expects
    const pathwayMessages: Record<ChatMode, string> = {
      assessment: "🩺 I'd like a health assessment",
      chat: "",
      vitals: "",
      none: "",
    };

    const pathwayText = pathwayMessages[mode];
    if (pathwayText) {
      // Send pathway selection to Claude as a user message
      setMessages((prev) => [...prev, { role: "user", text: pathwayText }]);
      callClaude(pathwayText);
    }
  };

  const startChat = async (title: string, sessionId?: string) => {
    if (sessionId) {
      // Load existing session messages via GET /api/chat/:chatId
      syncCurrentSessionId(sessionId);
      clearLiveTypingState();
      setConversationHistory([]);
      setMessages([]);
      syncChatMode("chat");
      try {
        const data = await chatApi.getSession(sessionId);
        console.log("[Load Session] Raw response:", data);
        const msgs = Array.isArray(data) ? data : data.messages || data.data || [];
        const uiMessages: typeof messages = [];
        const apiHistory: ApiMessage[] = [];
        for (const m of msgs) {
          const content = m.content || m.text || "";
          const role = m.role === "user" ? "user" : "assistant";
          apiHistory.push({ role, text: content });
          uiMessages.push({ role: m.role === "user" ? "user" : "cira", text: content });
        }
        setConversationHistory(apiHistory);
        setMessages(uiMessages);
        if (uiMessages.length === 0) {
          toast.info("No messages found in this session");
        }
      } catch (e: any) {
        console.error("[Load session messages failed]", e);
        toast.error("Failed to load messages: " + (e.message || "Unknown error"));
      }
    } else {
      syncCurrentSessionId(null);
      clearLiveTypingState();
      setMessages([{ role: "user", text: title }]);
      setConversationHistory([]);
      syncChatMode("chat");
      callClaude(title);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await chatApi.deleteSession(chatId);
      setChatHistory((prev) => prev.filter((c: any) => c.id !== chatId));
      if (currentSessionId === chatId) {
        syncCurrentSessionId(null);
        clearLiveTypingState();
        setMessages([]);
        setConversationHistory([]);
        syncChatMode("none");
        setActiveChat(null);
      }
      toast.success("Chat deleted");
    } catch (e: any) {
      console.error("[Delete chat failed]", e);
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Slim icon sidebar — hidden on mobile */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        {/* Logo */}

        {/* Logo */}
        <div className="mb-4">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>

        <div className="w-10 h-[1px] bg-border mb-3" />

        {/* Nav icons with labels */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveNav(item.id);
                  if (item.id === "home") navigate("/dashboard");
                  if (item.id === "chat") navigate("/chat");
                   if (item.id === "scan") navigate("/vitals-scan");
                   if (item.id === "reports") navigate("/reports");
                   if (item.id === "doctor") navigate("/doctor");
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  activeNav === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} active={activeNav === item.id} />
                ) : (
                  <Icon size={18} strokeWidth={activeNav === item.id ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-body font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Bottom */}
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
              {initials}
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Chat history drawer - slides from sidebar edge, no full overlay */}
      {showHistory && (
        <>
          {/* Click-away backdrop over main content only, not sidebar */}
          <div
            className="fixed inset-0 z-40 bg-black/10 md:left-[72px]"
            onClick={() => setShowHistory(false)}
          />
          {/* Drawer panel anchored to sidebar */}
          <div
            className="fixed top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out] left-0 md:left-[72px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Chat History</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setActiveChat(null); clearLiveTypingState(); setMessages([{ role: "cira", text: FREE_CHAT_WELCOME }]); setConversationHistory([]); syncCurrentSessionId(null); syncChatMode("none"); setPendingLandingMessage(null); setShowHistory(false); }}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  title="New chat"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body px-2 mb-2">Recent</p>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No chat history yet</p>
              ) : chatHistory.map((chat: any) => (
                <div
                  key={chat.id}
                  className={`group w-full flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-body transition-all cursor-pointer ${
                    activeChat === chat.id
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                  onClick={() => { setActiveChat(chat.id); startChat(chat.title || "Chat", chat.id); setShowHistory(false); }}
                >
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate font-medium">{chat.title || "Untitled chat"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{chat.date || chat.created_at}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all shrink-0"
                    title="Delete chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 relative">
        {/* Hamburger button outside navbar */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all bg-card/60 backdrop-blur-sm border border-border/40 shadow-sm"
          title="Chat History"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pb-4 md:pb-0">
            {/* Chat messages — white bg with soft gradients */}
            <div className="relative min-h-full bg-white">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gradient-to-bl from-pink-100/40 via-purple-100/20 to-transparent rounded-full blur-[80px]" />
                <div className="absolute bottom-0 -left-20 w-[250px] h-[250px] bg-gradient-to-tr from-blue-100/30 via-cyan-50/20 to-transparent rounded-full blur-[80px]" />
              </div>
              <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6 pt-16 md:pt-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    {/* Summary card */}
                    {msg.role === "summary" && msg.summaryData ? (
                      <ConsultSummaryCard data={msg.summaryData} />
                    ) : msg.role === "detailed_report" && msg.detailedData ? (
                      <DetailedReportCard data={msg.detailedData} />
                    ) : msg.role === "vitals" && msg.vitalsData ? (
                      <div className="w-full max-w-sm md:max-w-md">
                        <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
                          <div className="px-4 py-3 border-b border-border/30 bg-gradient-to-r from-emerald-50/80 to-teal-50/60">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                                <Activity size={12} className="text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Your Vitals</p>
                                <p className="text-[9px] text-muted-foreground">Captured via Face Scan · Just now</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                            {msg.vitalsData.map((vital) => {
                              // Map icon from label for vitals coming from sessionStorage (no icon property)
                              const iconMap: Record<string, any> = { "Heart Rate": Heart, "Blood Pressure": Activity, "Breathing Rate": Wind, "Stress Index": Brain, "HRV": Zap, "BMI": Scale };
                              const VIcon = vital.icon || iconMap[vital.label] || Activity;
                              return (
                                <div key={vital.label} className="flex flex-col items-center p-2.5 rounded-xl">
                                  <div className={`w-7 h-7 rounded-lg ${vital.color || "bg-primary/10 text-primary"} flex items-center justify-center mb-1`}>
                                    <VIcon size={13} />
                                  </div>
                                  <p className="text-[13px] font-bold text-foreground">{vital.value}</p>
                                  <p className="text-[8px] text-muted-foreground text-center leading-tight">{vital.label}</p>
                                  <p className="text-[7px] text-muted-foreground/60">{vital.unit}</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="px-4 py-2 border-t border-border/20">
                            <p className="text-[9px] text-emerald-600 font-medium text-center">✓ All vitals within healthy range</p>
                          </div>
                        </div>
                      </div>
                    ) : msg.role === "action_buttons" && msg.buttons ? (
                      <div className="max-w-[95%] md:max-w-[80%]">
                        <div className="mb-2"><AiSparkleIcon size={20} active /></div>
                        <div className="flex flex-col gap-2">
                          {msg.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => {
                                if (btn.id === "face_scan") selectMode("vitals");
                                else if (btn.id === "book_doctor") {
                                  const user = getUser();
                                  const trackingData = { timestamp: new Date().toISOString(), userId: user?.id || null, userName: user?.name || null, userEmail: user?.email || null, page: window.location.pathname, source: "agent_button", userAgent: navigator.userAgent };
                                  console.log("[AirDoctor] Referral click:", trackingData);
                                  try { const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com"; fetch(`${API_BASE}/api/tracking/airdoctor-click`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trackingData) }).catch(() => {}); } catch {}
                                  try { const clicks = JSON.parse(localStorage.getItem("cira_airdoctor_clicks") || "[]"); clicks.push(trackingData); localStorage.setItem("cira_airdoctor_clicks", JSON.stringify(clicks.slice(-100))); } catch {}
                                  window.open("https://airdoctor.biz/Cira", "_blank", "noopener,noreferrer");
                                }
                              }}
                              className={`flex flex-col items-start px-3.5 py-2 rounded-xl border text-left transition-colors active:scale-95 ${btn.id === "book_doctor" ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-border/60 hover:bg-accent"}`}
                            >
                              <span className="text-[12px] font-medium text-foreground">{btn.label}</span>
                              {btn.description && <span className="text-[10px] text-muted-foreground">{btn.description}</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : msg.role === "user" ? (
                      /* User bubble — light gray pill, right-aligned */
                      <div
                        className="bg-secondary/80 text-foreground rounded-[20px] rounded-tr-md px-4 py-2.5 max-w-[85%] md:max-w-[70%]"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                      >
                        <p className="text-[14px] leading-6 whitespace-pre-line">{renderFormattedText(msg.text)}</p>
                      </div>
                    ) : msg.text === "WELCOME_WITH_BUTTONS" ? (
                      <div className="max-w-[95%] md:max-w-[80%]">
                        <div className="mb-2"><AiSparkleIcon size={20} active /></div>
                        <div className="text-foreground">
                          <p className="text-[14px] md:text-[15px] leading-7 font-body whitespace-pre-line">
                            Hey there! 👋🏼{"\n\n"}I'm <strong>Cira</strong>, your personal AI health nurse 🩺✨{"\n\n"}How would you like to get started? 💙
                          </p>
                          <div className="flex flex-col gap-2 mt-3">
                            <button
                              onClick={() => selectMode("chat")}
                              className="flex flex-col items-start px-3.5 py-2 rounded-xl border border-border/60 text-left hover:bg-accent transition-colors active:scale-95"
                            >
                              <span className="text-[12px] font-medium text-foreground">💬 Just Chat</span>
                              <span className="text-[10px] text-muted-foreground">Ask anything — symptoms, wellness, or general health</span>
                            </button>
                            <button
                              onClick={() => selectMode("assessment")}
                              className="flex flex-col items-start px-3.5 py-2 rounded-xl border border-border/60 text-left hover:bg-accent transition-colors active:scale-95"
                            >
                              <span className="text-[12px] font-medium text-foreground">🩺 Health Assessment</span>
                              <span className="text-[10px] text-muted-foreground">Guided AI triage based on your symptoms</span>
                            </button>
                            <button
                              onClick={() => selectMode("vitals")}
                              className="flex flex-col items-start px-3.5 py-2 rounded-xl border border-border/60 text-left hover:bg-accent transition-colors active:scale-95"
                            >
                              <span className="text-[12px] font-medium text-foreground">📸 Face Scan</span>
                              <span className="text-[10px] text-muted-foreground">30-second scan captures real vitals from your face</span>
                            </button>
                            <button
                              onClick={() => {
                                const user = getUser();
                                const trackingData = {
                                  timestamp: new Date().toISOString(),
                                  userId: user?.id || null,
                                  userName: user?.name || null,
                                  userEmail: user?.email || null,
                                  userPlan: (user as any)?.plan || "free",
                                  page: window.location.pathname,
                                  source: "welcome_button",
                                  userAgent: navigator.userAgent,
                                  screenSize: `${window.innerWidth}x${window.innerHeight}`,
                                };
                                console.log("[AirDoctor] Referral click:", trackingData);
                                try {
                                  const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
                                  fetch(`${API_BASE}/api/tracking/airdoctor-click`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(trackingData) }).catch(() => {});
                                } catch {}
                                try {
                                  const clicks = JSON.parse(localStorage.getItem("cira_airdoctor_clicks") || "[]");
                                  clicks.push(trackingData);
                                  localStorage.setItem("cira_airdoctor_clicks", JSON.stringify(clicks.slice(-100)));
                                } catch {}
                                window.open("https://airdoctor.biz/Cira", "_blank", "noopener,noreferrer");
                              }}
                              className="flex flex-col items-start px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/5 text-left hover:bg-primary/10 transition-colors active:scale-95"
                            >
                              <span className="text-[12px] font-medium text-foreground">🏥 Book a Doctor</span>
                              <span className="text-[10px] text-muted-foreground">Connect with a real doctor near you via Air Doctor</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Cira response — no bubble, just text with sparkle icon */
                      <div className="max-w-[95%] md:max-w-[80%]">
                        <div className="mb-2">
                          <AiSparkleIcon size={20} active thinking={streamingMsgIndex === i && !msg.text} />
                        </div>
                        <div
                          className="text-foreground"
                          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                        >
                          <p className="text-[14px] md:text-[15px] leading-7">
                            {streamingMsgIndex === i || completedStreamingMsgIndices[i] ? (
                              <LiveTypewriterText
                                text={msg.text}
                                speed={13}
                                formatted
                                isComplete={streamingMsgIndex !== i}
                                onComplete={() => {
                                  setCompletedStreamingMsgIndices((prev) => {
                                    if (!prev[i]) return prev;
                                    const next = { ...prev };
                                    delete next[i];
                                    return next;
                                  });
                                }}
                              />
                            ) : typingMsgIndex === i ? (
                              <TypewriterText
                                text={msg.text}
                                speed={13}
                                onComplete={() => setTypingMsgIndex(null)}
                                formatted
                              />
                            ) : (
                              <span className="whitespace-pre-line">
                                {renderFormattedText(msg.text)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Inline mode selection after landing message */}
                {showModeSelection && (
                  <div className="animate-fade-in">
                    <div className="space-y-2.5 w-full">
                      {/* Hero — Vital Scan (compact) */}
                      <button
                        onClick={() => selectMode("vitals")}
                        className="group w-full relative overflow-hidden rounded-xl text-left transition-all active:scale-[0.98]"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-95" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                        <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                        <div className="relative z-10 p-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 relative">
                            <ScanFace size={18} className="text-white" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/20 flex items-center justify-center">
                              <Sparkles size={6} className="text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-[12px] font-bold text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Vital Scan + Assessment</p>
                              <span className="px-1 py-px rounded-full bg-white/20 text-[6px] font-semibold text-white uppercase tracking-wider">AI</span>
                            </div>
                            <p className="text-[9px] text-white/70 leading-snug mt-0.5">Face scan → 30+ vitals → AI analysis</p>
                          </div>
                          <div className="shrink-0 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                          </div>
                        </div>
                      </button>

                      {/* Assessment */}
                      {chatModes.filter(m => m.id !== "vitals").map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <button
                            key={mode.id}
                            onClick={() => selectMode(mode.id)}
                            className="group w-full bg-card border border-border/50 rounded-xl p-2.5 text-left active:scale-[0.98] transition-all"
                          >
                            <div className={`w-7 h-7 rounded-lg ${mode.bgGlow} flex items-center justify-center mb-1.5`}>
                              <Icon size={13} style={{ color: "#3b82f6" }} />
                            </div>
                            <p className="text-[10px] font-semibold text-foreground mb-0.5" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{mode.title}</p>
                            <p className="text-[8px] text-muted-foreground leading-snug line-clamp-2">{mode.desc}</p>
                          </button>
                        );
                      })}

                      {/* Just chat */}
                      <button
                        onClick={() => selectMode("chat")}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/30 active:scale-[0.98] transition-all w-full"
                      >
                        <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center">
                          <MessageCircle size={12} className="text-muted-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-medium text-foreground">Just Continue Chatting</p>
                          <p className="text-[8px] text-muted-foreground">No assessment — let's talk</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Thinking indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[95%] md:max-w-[80%]">
                      <div className="mb-2"><AiSparkleIcon size={20} active thinking /></div>
                      
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Bottom input — Gemini-style clean pill */}
          <div className="relative shrink-0 bg-white" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 68px)' }}>
            <form onSubmit={handleSend} className="relative z-10 max-w-2xl mx-auto px-3 py-2 md:px-4 md:py-3">
              <div className="bg-secondary/60 rounded-full flex items-center overflow-hidden border border-border/30">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={chatMode === "none" ? "Select an option above to start ☝️" : "Ask Cira anything..."}
                  className="flex-1 py-3 px-4 bg-transparent text-foreground text-[15px] outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 font-body"
                  disabled={isApiLoading || chatMode === "none"}
                />
                <button
                  type="submit"
                  disabled={isApiLoading || !message.trim()}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground shrink-0 mr-1 hover:text-foreground transition-colors disabled:opacity-30"
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </form>
          </div>
      </div>

      {/* Face Scan Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!scanning) { setShowScanModal(false); setScanComplete(false); setScanProgress(0); } }} />
          <div className="relative z-10 bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-md mx-4 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center">
                  <ScanFace size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Face Vital Scan</p>
                  <p className="text-[10px] text-muted-foreground">30 seconds · 100% on-device</p>
                </div>
              </div>
              {!scanning && (
                <button onClick={() => { setShowScanModal(false); setScanComplete(false); setScanProgress(0); }} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Camera Area */}
            <div className="px-6 pb-4">
              <div className="relative aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 overflow-hidden flex items-center justify-center">
                {!scanning && !scanComplete && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-teal-900/20" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-24 h-24 rounded-full border-2 border-dashed border-emerald-400/50 flex items-center justify-center">
                        <Camera size={32} className="text-emerald-400/70" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white/80 font-medium">Position your face in the frame</p>
                        <p className="text-[10px] text-white/50 mt-1">Ensure good lighting · Hold still</p>
                      </div>
                    </div>
                  </>
                )}

                {scanning && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 to-teal-900/30" />
                    {/* Animated scan lines */}
                    <div className="absolute inset-4 border-2 border-emerald-400/40 rounded-2xl">
                      <div
                        className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
                        style={{ top: `${scanProgress}%`, transition: "top 0.08s linear" }}
                      />
                    </div>
                    {/* Face outline */}
                    <div className="relative z-10 w-28 h-36 border-2 border-emerald-400/60 rounded-[50%] flex items-center justify-center">
                      <ScanFace size={40} className="text-emerald-400/60 animate-pulse" />
                    </div>
                    {/* Pulsing corners */}
                    <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-emerald-400 rounded-tl-lg animate-pulse" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-emerald-400 rounded-tr-lg animate-pulse" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-emerald-400 rounded-bl-lg animate-pulse" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-emerald-400 rounded-br-lg animate-pulse" />
                    {/* Progress text */}
                    <div className="absolute bottom-6 left-0 right-0 text-center">
                      <p className="text-emerald-400 text-xs font-medium">Scanning... {scanProgress}%</p>
                    </div>
                  </>
                )}

                {scanComplete && (
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center animate-fade-in">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <p className="text-white text-sm font-semibold">Scan Complete!</p>
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {scanning && (
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-100"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              )}

              {/* Vitals Preview (after scan) */}
              {scanComplete && (
                <div className="mt-4 animate-fade-in">
                  <div className="grid grid-cols-3 gap-2">
                    {scanVitals.map((vital) => {
                      const VIcon = vital.icon;
                      return (
                        <div key={vital.label} className="bg-accent/30 rounded-xl p-2.5 text-center">
                          <div className={`w-7 h-7 rounded-lg ${vital.color} flex items-center justify-center mx-auto mb-1`}>
                            <VIcon size={13} />
                          </div>
                          <p className="text-xs font-bold text-foreground">{vital.value}</p>
                          <p className="text-[8px] text-muted-foreground leading-tight">{vital.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="px-6 pb-5">
              {!scanning && !scanComplete && (
                <button
                  onClick={startScan}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-white text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Camera size={16} />
                  Start Face Scan
                </button>
              )}
              {scanComplete && (
                <button
                  onClick={completeScanAndChat}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  Continue to Assessment
                </button>
              )}
              <p className="text-[9px] text-muted-foreground/60 text-center mt-3">
                🔒 Camera feed is never recorded or transmitted. 100% on-device processing.
              </p>
            </div>
          </div>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
};

export default Chat;
