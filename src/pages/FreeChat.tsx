import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Menu, Send, Plus, Sparkles, ScanFace, Activity, MessageCircle, FileText, Stethoscope, Heart, Wind, Brain, Zap, Scale, X, Camera, Trash2, LogIn, AlertTriangle, SlidersHorizontal } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import ConsultSummaryCard from "@/components/ConsultSummaryCard";
import DetailedReportCard from "@/components/DetailedReportCard";
import type { DetailedReport } from "@/components/DetailedReportCard";
import { extractText, extractToolCalls, type ChatMessage as ApiMessage, type ConsultSummary, type ToolUse, type ClaudeResponse } from "@/lib/chatApi";
import { toast } from "sonner";
import {
  getDeviceId,
  getFreeCredits,
  deductFreeCredits,
  getFreeScans,
  getFreeChatHistory,
  saveFreeChatSession,
  deleteFreeChatSession,
  type FreeChatSession,
} from "@/lib/freeCredits";

// Render basic markdown: **bold**, *italic*, `code`
const renderFormattedText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith("`") && part.endsWith("`")) return <code key={i} className="bg-muted px-1 py-0.5 rounded text-[13px]">{part.slice(1, -1)}</code>;
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

const TypewriterText = ({ text, speed = 18, onComplete, formatted = false }: { text: string; speed?: number; onComplete?: () => void; formatted?: boolean }) => {
  const [displayed, setDisplayed] = useState("");
  const indexRef = useRef(0);
  useEffect(() => {
    setDisplayed(""); indexRef.current = 0;
    const interval = setInterval(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      if (indexRef.current >= text.length) { clearInterval(interval); onComplete?.(); }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);
  return (
    <span className="whitespace-pre-line">
      {formatted ? renderFormattedText(displayed) : displayed}
      {displayed.length < text.length && <span className="inline-block w-[2px] h-[1em] bg-foreground/40 ml-0.5 align-text-bottom animate-pulse" />}
    </span>
  );
};

type ChatMode = "none" | "assessment" | "vitals" | "chat";

const chatModes = [
  { id: "assessment" as ChatMode, icon: Stethoscope, title: "Assessment", desc: "Cira adapts — quick triage or deep clinical intake based on your issue.", badge: "Adaptive · AI-Driven", gradient: "from-blue-500 to-purple-400", bgGlow: "bg-blue-100" },
  { id: "vitals" as ChatMode, icon: ScanFace, title: "Vital Scan + Assessment", desc: "30-second face scan captures real vitals — then AI cross-references with symptoms.", badge: "~4 min · Scan Powered", gradient: "from-emerald-500 to-teal-400", bgGlow: "bg-emerald-100" },
];

const FREE_CHAT_WELCOME = "WELCOME_WITH_BUTTONS";

const buildFreeChatPrompt = (userText: string) => [
  userText, "", "Just Chat mode selected.", "Reply conversationally as Cira.",
  "Do not ask the user to choose Quick Assessment, Detailed Assessment, or Vital Scan.",
  "Do not call the openModal tool unless the user explicitly asks for an assessment or scan.",
  "Do not begin a structured intake unless the user asks for one.",
].join("\n");

const FreeChat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "cira" | "vitals" | "summary" | "detailed_report"; text: string; vitalsData?: any[]; summaryData?: ConsultSummary; detailedData?: DetailedReport }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("none");
  const [pendingLandingMessage, setPendingLandingMessage] = useState<string | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showFloatingModes, setShowFloatingModes] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingMsgIndex, setTypingMsgIndex] = useState<number | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ApiMessage[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<FreeChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [credits, setCredits] = useState(getFreeCredits());
  const [scansLeft, setScansLeft] = useState(getFreeScans());
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatModeRef = useRef<ChatMode>("none");
  const currentSessionIdRef = useRef<string | null>(null);
  const prepPayloadSentRef = useRef(false);
  const deviceId = useRef(getDeviceId());

  useEffect(() => { chatModeRef.current = chatMode; }, [chatMode]);
  useEffect(() => { currentSessionIdRef.current = currentSessionId; }, [currentSessionId]);
  useEffect(() => { if (showTooltip) { const t = setTimeout(() => setShowTooltip(false), 2000); return () => clearTimeout(t); } }, [showTooltip]);

  const syncChatMode = (mode: ChatMode) => { chatModeRef.current = mode; setChatMode(mode); };
  const syncCurrentSessionId = (id: string | null) => {
    currentSessionIdRef.current = id; setCurrentSessionId(id);
    if (!id) prepPayloadSentRef.current = false;
  };

  // Load local chat history
  useEffect(() => { setChatHistory(getFreeChatHistory()); }, []);

  // Auto-start with welcome message in chat mode
  useEffect(() => {
    const scanVitalsJson = sessionStorage.getItem("cira_scan_vitals");
    if (scanVitalsJson) {
      sessionStorage.removeItem("cira_scan_vitals");
      try {
        const realVitals = JSON.parse(scanVitalsJson);
        syncChatMode("vitals");
        setMessages([{ role: "vitals", text: "Face Scan Results", vitalsData: realVitals }]);
        const vitalsText = realVitals.map((v: any) => `- ${v.label}: ${v.value} ${v.unit}`).join("\n");
        callClaude(`Here are my face scan vitals results:\n${vitalsText}\n\nPlease analyze these vitals. Do NOT call any tools yet — just analyze and respond.`);
      } catch (e) { console.error("[FreeChat] Error processing scan vitals:", e); }
      return;
    }
    const landingMsg = sessionStorage.getItem("cira_landing_message");
    if (landingMsg) {
      sessionStorage.removeItem("cira_landing_message");
      setPendingLandingMessage(landingMsg);
      setMessages([{ role: "user", text: landingMsg }, { role: "cira", text: FREE_CHAT_WELCOME }]);
      callClaude(landingMsg);
      return;
    }
    // Default: start with welcome message directly
    setMessages([{ role: "cira", text: FREE_CHAT_WELCOME }]);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [messages, isTyping]);

  // Save current session to localStorage
  const persistSession = useCallback((msgs: typeof messages) => {
    if (!currentSessionIdRef.current) return;
    const session: FreeChatSession = {
      id: currentSessionIdRef.current,
      title: msgs.find(m => m.role === "user")?.text.slice(0, 60) || "Chat",
      created_at: new Date().toISOString(),
      messages: msgs.filter(m => m.role === "user" || m.role === "cira").map(m => ({ role: m.role, text: m.text })),
    };
    saveFreeChatSession(session);
    setChatHistory(getFreeChatHistory());
  }, []);

  const processToolCalls = (toolCalls: ToolUse[]) => {
    for (const tool of toolCalls) {
      switch (tool.name) {
        case "openModal":
          if (tool.input.select_care_pathway && chatModeRef.current === "none") setShowModeSelection(true);
          break;
        case "render_ai_consult_summary": {
          const summaryData = tool.input as ConsultSummary;
          setMessages(prev => [...prev, { role: "summary" as const, text: "", summaryData }]);
          break;
        }
        case "render_detailed_report": {
          const detailedData = tool.input as DetailedReport;
          setMessages(prev => [...prev, { role: "detailed_report" as const, text: "", detailedData }]);
          break;
        }
        case "disconnectAgent":
          if (tool.input.disconnect_now) { toast.info("Session ended."); syncChatMode("none"); }
          break;
        case "prepare_consultation_payload": {
          const payload = tool.input?.consultation_payload;
          // Only trigger report generation when we have a reason (final payload after full intake)
          if (payload?.reason && !prepPayloadSentRef.current) {
            prepPayloadSentRef.current = true;
            setTimeout(() => {
              const pathway = payload?.pathway;
              const payloadJson = JSON.stringify(payload, null, 2);
              const followUp = pathway === "detailed"
                ? `Tool result for prepare_consultation_payload received successfully. Here is the consultation payload:\n${payloadJson}\n\nNow you MUST call the render_detailed_report tool to generate the detailed clinical report. Do NOT call prepare_consultation_payload again. Use the render_detailed_report tool NOW.`
                : `Tool result for prepare_consultation_payload received successfully. Here is the consultation payload:\n${payloadJson}\n\nNow you MUST call the render_ai_consult_summary tool to generate the quick assessment summary. Do NOT call prepare_consultation_payload again. Use the render_ai_consult_summary tool NOW.`;
              callClaude(followUp, undefined, true);
            }, 500);
          }
          break;
        }
      }
    }
  };

  const callClaude = async (userText: string, image?: string, hidden = false) => {
    if (credits <= 0) {
      toast.error("Free credits exhausted. Login and upgrade to continue.", {
        action: { label: "Login", onClick: () => navigate("/login") },
        duration: 8000,
      });
      setMessages(prev => [...prev, { role: "cira", text: "⚠️ You've used all your free credits. Please login and upgrade to continue." }]);
      return;
    }

    const newUserMsg: ApiMessage = { role: "user", text: userText, ...(image ? { image, imageType: "image/png" } : {}) };
    const updatedHistory = [...conversationHistory, newUserMsg];
    const outboundText = chatModeRef.current === "chat" && !currentSessionIdRef.current ? buildFreeChatPrompt(userText) : userText;

    setConversationHistory(updatedHistory);
    if (!hidden) setIsTyping(true);
    setIsApiLoading(true);

    // Ensure a session ID exists
    if (!currentSessionIdRef.current) {
      const newId = `free_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      syncCurrentSessionId(newId);
    }

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
      const res = await fetch(`${API_BASE}/api/anthropic/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": deviceId.current,
        },
        body: JSON.stringify({
          message: outboundText,
          sessionId: currentSessionIdRef.current || undefined,
          deviceId: deviceId.current,
          guest: true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || errorData?.error || `API error (${res.status})`;
        if (res.status === 402 || res.status === 403) {
          throw new Error("CREDITS_EXHAUSTED: " + errorMsg);
        }
        if (res.status === 529) throw new Error("OVERLOADED: " + errorMsg);
        throw new Error(errorMsg);
      }

      const responseData = await res.json();
      // Deduct credits
      const remaining = deductFreeCredits(1);
      setCredits(remaining);

      const nextSessionId = responseData.sessionId || (Array.isArray(responseData) ? responseData[0]?.sessionId : undefined);
      if (nextSessionId && nextSessionId !== currentSessionIdRef.current) {
        syncCurrentSessionId(nextSessionId);
      }

      const claudeResponse: ClaudeResponse = responseData.response || responseData;
      const textContent = extractText(claudeResponse);
      const toolCalls = extractToolCalls(claudeResponse);

      if (textContent) {
        setConversationHistory(prev => [...prev, { role: "assistant", text: textContent }]);
        setMessages(prev => {
          const newMessages = [...prev, { role: "cira" as const, text: textContent }];
          setTypingMsgIndex(newMessages.length - 1);
          // Persist to localStorage
          setTimeout(() => persistSession(newMessages), 100);
          return newMessages;
        });
      }

      if (toolCalls.length > 0) {
        processToolCalls(toolCalls);
        if (!textContent) {
          setMessages(prev => [...prev, { role: "cira" as const, text: "I'm processing your information... 💙" }]);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      if (msg.startsWith("CREDITS_EXHAUSTED")) {
        toast.error("Credits exhausted. Login to continue.", { action: { label: "Login", onClick: () => navigate("/login") } });
        setMessages(prev => [...prev, { role: "cira", text: "⚠️ Free credits used up. Please login and upgrade to continue." }]);
      } else if (msg.startsWith("OVERLOADED")) {
        toast.error("Service busy. Try again shortly.", { action: { label: "Retry", onClick: () => callClaude(userText, image) } });
      } else {
        toast.error("Failed: " + msg);
      }
      console.error("[FreeChat Claude Error]", err);
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
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setMessage("");
    callClaude(userText);
  };

  const selectMode = (mode: ChatMode) => {
    if (mode === "vitals") {
      if (scansLeft <= 0) {
        toast.error("Free scan used. Login to get more scans.", { action: { label: "Login", onClick: () => navigate("/login") } });
        return;
      }
      syncChatMode(mode);
      setShowModeSelection(false);
      sessionStorage.setItem("cira_free_scan_return", "/free-chat");
      navigate("/vitals-scan?guest=1");
      return;
    }

    // Reset for a fresh conversation
    syncCurrentSessionId(null);
    setConversationHistory([]);
    syncChatMode(mode);
    setShowModeSelection(false);
    setPendingLandingMessage(null);

    const userText = mode === "chat"
      ? "💬 I just want to chat"
      : "🩺 I'd like a health assessment";

    // Replace welcome message with user's selection + send to AI
    setMessages([{ role: "user", text: userText }]);
    callClaude(userText);
  };

  const loadSession = (session: FreeChatSession) => {
    syncCurrentSessionId(session.id);
    setConversationHistory([]);
    syncChatMode("chat");
    const uiMessages = session.messages.map(m => ({
      role: (m.role === "user" ? "user" : "cira") as "user" | "cira",
      text: m.text,
    }));
    setMessages(uiMessages);
    setConversationHistory(session.messages.map(m => ({ role: m.role === "user" ? "user" : "assistant" as any, text: m.text })));
    setShowHistory(false);
  };

  const handleDeleteChat = (id: string) => {
    deleteFreeChatSession(id);
    setChatHistory(getFreeChatHistory());
    if (currentSessionId === id) {
      syncCurrentSessionId(null);
      setMessages([]);
      setConversationHistory([]);
      syncChatMode("none");
    }
    toast.success("Chat deleted");
  };

  return (
    <div className="flex bg-background" style={{ height: "100dvh" }}>
      {/* Chat history drawer */}
      {showHistory && (
        <>
          <div className="fixed inset-0 z-40 bg-black/10" onClick={() => setShowHistory(false)} />
          <div className="fixed top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out] left-0" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground font-heading">Chat History</p>
              <div className="flex items-center gap-2">
                <button onClick={() => { syncCurrentSessionId(null); setMessages([{ role: "cira", text: FREE_CHAT_WELCOME }]); setConversationHistory([]); syncChatMode("none"); setShowHistory(false); }} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground" title="New chat">
                  <Plus size={16} />
                </button>
                <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Login CTA */}
            <div className="px-3 pt-3">
              <button onClick={() => navigate("/login")} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-medium hover:bg-primary/20 transition-all">
                <LogIn size={14} />
                <div className="text-left">
                  <p className="font-semibold text-[11px]">Login to save your data</p>
                  <p className="text-[9px] text-primary/70">Chat & scan history won't be saved without an account</p>
                </div>
              </button>
            </div>

            {/* Credits remaining */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Sparkles size={10} />
                <span>{credits.toLocaleString()} credits · {scansLeft} scan{scansLeft !== 1 ? "s" : ""} remaining</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body px-2 mb-2">Recent</p>
              {chatHistory.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No chat history yet</p>
              ) : chatHistory.map((chat) => (
                <div key={chat.id} className="group w-full flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-body transition-all cursor-pointer text-muted-foreground hover:bg-accent/50 hover:text-foreground" onClick={() => loadSession(chat)}>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="truncate font-medium">{chat.title || "Untitled"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(chat.created_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteChat(chat.id); }} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all shrink-0" title="Delete">
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
        {/* Top bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <button onClick={() => setShowHistory(!showHistory)} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all bg-card/60 backdrop-blur-sm border border-border/40 shadow-sm" title="Chat History">
            <Menu size={18} strokeWidth={1.5} />
          </button>
        </div>
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button onClick={() => navigate("/login")} className="px-3 h-9 rounded-xl flex items-center gap-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-all bg-card/60 backdrop-blur-sm border border-primary/20 shadow-sm">
            <LogIn size={14} />
            Login
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto pb-4">
            {/* Chat messages */}
            <div className="relative min-h-full bg-white">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-gradient-to-bl from-pink-100/40 via-purple-100/20 to-transparent rounded-full blur-[80px]" />
                <div className="absolute bottom-0 -left-20 w-[250px] h-[250px] bg-gradient-to-tr from-blue-100/30 via-cyan-50/20 to-transparent rounded-full blur-[80px]" />
              </div>
              <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-6 space-y-6 pt-16 md:pt-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
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
                                <p className="text-xs font-semibold text-foreground font-heading">Your Vitals</p>
                                <p className="text-[9px] text-muted-foreground">Captured via Face Scan · Just now</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 p-2">
                            {msg.vitalsData.map((vital: any) => {
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
                        </div>
                      </div>
                    ) : msg.role === "user" ? (
                      <div className="bg-secondary/80 text-foreground rounded-[20px] rounded-tr-md px-4 py-2.5 max-w-[85%] md:max-w-[70%]">
                        <p className="text-[14px] leading-6 whitespace-pre-line font-body">{renderFormattedText(msg.text)}</p>
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
                        </div>
                        </div>
                      </div>
                    ) : (
                      <div className="max-w-[95%] md:max-w-[80%]">
                        <div className="mb-2"><AiSparkleIcon size={20} active /></div>
                        <div className="text-foreground">
                          <p className="text-[14px] md:text-[15px] leading-7 font-body">
                            {typingMsgIndex === i ? (
                              <TypewriterText text={msg.text} speed={15} onComplete={() => setTypingMsgIndex(null)} formatted />
                            ) : (
                              <span className="whitespace-pre-line">{renderFormattedText(msg.text)}</span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Inline mode selection */}
                {showModeSelection && (
                  <div className="animate-fade-in space-y-2.5 w-full">
                    <button onClick={() => selectMode("vitals")} className="group w-full relative overflow-hidden rounded-xl text-left transition-all active:scale-[0.98]">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-95" />
                      <div className="relative z-10 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center shrink-0 relative">
                          <ScanFace size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-white font-heading">Vital Scan + Assessment</p>
                          <p className="text-[9px] text-white/70 mt-0.5">Face scan → 30+ vitals → AI analysis</p>
                        </div>
                      </div>
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      {chatModes.filter(m => m.id !== "vitals").map((mode) => {
                        const Icon = mode.icon;
                        return (
                          <button key={mode.id} onClick={() => selectMode(mode.id)} className="group bg-card border border-border/50 rounded-xl p-2.5 text-left active:scale-[0.98] transition-all">
                            <div className={`w-7 h-7 rounded-lg ${mode.bgGlow} flex items-center justify-center mb-1.5`}>
                              <Icon size={13} style={{ color: mode.gradient.includes("blue") ? "#3b82f6" : "#a855f7" }} />
                            </div>
                            <p className="text-[10px] font-semibold text-foreground mb-0.5 font-heading">{mode.title}</p>
                            <p className="text-[8px] text-muted-foreground leading-snug line-clamp-2 font-body">{mode.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={() => selectMode("chat")} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/30 active:scale-[0.98] transition-all w-full">
                      <div className="w-6 h-6 rounded-md bg-muted/50 flex items-center justify-center">
                        <MessageCircle size={12} className="text-muted-foreground" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-medium text-foreground">Just Continue Chatting</p>
                        <p className="text-[8px] text-muted-foreground">No assessment — let's talk</p>
                      </div>
                    </button>
                  </div>
                )}

                {/* Thinking indicator */}
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="max-w-[95%] md:max-w-[80%]">
                      <div className="mb-2 animate-pulse"><AiSparkleIcon size={20} active /></div>
                      <div className="flex flex-col gap-1.5 py-1">
                        <div className="h-2.5 w-32 rounded-full bg-muted-foreground/15 animate-pulse" />
                        <div className="h-2.5 w-20 rounded-full bg-muted-foreground/10 animate-pulse" style={{ animationDelay: "200ms" }} />
                      </div>
                      <ThinkingLabel />
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Bottom input with floating mode buttons */}
        <div className="relative shrink-0 bg-white" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          {/* Floating mode buttons */}
          {showFloatingModes && (
            <div className="absolute bottom-full left-0 right-0 z-20 px-3 pb-2 animate-fade-in">
              <div className="max-w-2xl mx-auto flex items-center gap-2 overflow-x-auto py-2">
                <button
                  onClick={() => { selectMode("vitals"); setShowFloatingModes(false); }}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[11px] font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
                >
                  <ScanFace size={14} />
                  Face Scan
                </button>
              </div>
            </div>
          )}

          {/* Tooltip above input */}
          {showTooltip && (
            <div className="max-w-2xl mx-auto px-3 flex justify-start pl-6 pb-1">
              <div className="relative whitespace-nowrap bg-foreground text-background text-[10px] font-medium px-2.5 py-1 rounded-lg shadow-lg animate-bounce pointer-events-none">
                📸 Tap for Face Scan
                <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-foreground" />
              </div>
            </div>
          )}

          <form onSubmit={handleSend} className="relative z-10 max-w-2xl mx-auto px-3 py-2 md:px-4 md:py-3">
            <div className="bg-secondary/60 rounded-full flex items-center overflow-hidden border border-border/30">
              <button
                type="button"
                onClick={() => {
                  setShowFloatingModes(!showFloatingModes);
                  setShowTooltip(false);
                }}
                className={`w-10 h-10 flex items-center justify-center shrink-0 ml-1 transition-all ${showFloatingModes ? "text-primary" : "text-muted-foreground"}`}
              >
                <ScanFace size={18} strokeWidth={1.5} />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={chatMode === "none" ? "Select an option above to start ☝️" : "Ask Cira anything..."}
                className="flex-1 py-3 px-1 bg-transparent text-foreground text-[15px] outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 font-body"
                disabled={isApiLoading || chatMode === "none"}
              />
              <button type="submit" disabled={isApiLoading || !message.trim()} className="w-10 h-10 flex items-center justify-center text-muted-foreground shrink-0 mr-1 hover:text-foreground transition-colors disabled:opacity-30">
                <Send size={18} strokeWidth={1.5} />
              </button>
            </div>
          </form>
          {/* Credits counter */}
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground/50">{credits.toLocaleString()} credits remaining · <button onClick={() => navigate("/login")} className="text-primary hover:underline">Login to save</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeChat;
