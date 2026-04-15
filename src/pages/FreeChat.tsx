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

const TypewriterText = ({ text, speed = 3, onComplete, formatted = false }: { text: string; speed?: number; onComplete?: () => void; formatted?: boolean }) => {
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
  const [messages, setMessages] = useState<{ role: "user" | "cira" | "vitals" | "summary" | "detailed_report" | "action_buttons"; text: string; vitalsData?: any[]; summaryData?: ConsultSummary; detailedData?: DetailedReport; buttons?: Array<{ id: string; label: string; description?: string }> }[]>([]);
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
  const [guestRemaining, setGuestRemaining] = useState<number>(20);
  const [guestDailyLimit, setGuestDailyLimit] = useState<number>(20);
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
          // Only trigger report generation after real intake (at least 3 user messages)
          const userMsgCount = messages.filter(m => m.role === "user").length;
          if (payload?.reason && !prepPayloadSentRef.current && userMsgCount >= 3) {
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
        case "render_action_buttons": {
          const defaultButtons = [
            { id: "face_scan", label: "📸 Face Scan", description: "Capture your vitals in 30 seconds" },
            { id: "book_doctor", label: "🏥 Book a Doctor", description: "Connect with a licensed doctor near you" },
          ];
          const buttons = (tool.input?.buttons?.length ? tool.input.buttons : defaultButtons);
          setMessages(prev => [...prev, { role: "action_buttons" as const, text: "", buttons }]);
          break;
        }
      }
    }
  };

  const callClaude = async (userText: string, image?: string, hidden = false) => {
    if (guestRemaining <= 0) {
      toast.error("Daily free limit reached. Login and upgrade for unlimited access.", {
        action: { label: "Login", onClick: () => navigate("/login") },
        duration: 8000,
      });
      setMessages(prev => [...prev, { role: "cira", text: "⚠️ You've reached your daily free message limit. Please login and upgrade to continue." }]);
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
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Device-Id": deviceId.current,
      };
      const payloadBody = JSON.stringify({
        message: outboundText,
        sessionId: currentSessionIdRef.current || undefined,
        deviceId: deviceId.current,
        guest: true,
      });

      const res = await fetch(`${API_BASE}/api/anthropic/chat/stream`, {
        method: "POST",
        headers: { ...headers, Accept: "text/event-stream" },
        body: payloadBody,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || errorData?.error || `API error (${res.status})`;
        if (res.status === 429) {
          setGuestRemaining(0);
          throw new Error("RATE_LIMITED: " + errorMsg);
        }
        if (res.status === 402 || res.status === 403) {
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
      let pendingToolBlock: { type: "tool_use"; id: string; name: string; inputJson: string } | null = null;
      const msgIdx = { current: -1 };

      // Add empty placeholder message immediately
      setMessages(prev => {
        const updated = [...prev, { role: "cira" as const, text: "" }];
        msgIdx.current = updated.length - 1;
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

            if (event.sessionId && event.sessionId !== currentSessionIdRef.current) {
              syncCurrentSessionId(event.sessionId);
            }
            if (event.guest_remaining !== undefined) setGuestRemaining(event.guest_remaining);
            if (event.guest_daily_limit !== undefined) setGuestDailyLimit(event.guest_daily_limit);

            // Live text deltas — render as they arrive
            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              fullText += event.delta.text;
              setMessages(prev => {
                const updated = [...prev];
                if (msgIdx.current >= 0 && updated[msgIdx.current]) {
                  updated[msgIdx.current] = { ...updated[msgIdx.current], text: fullText };
                }
                return updated;
              });
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
                toolCalls.push(event.content_block as ToolUse);
              } else if (pendingToolBlock) {
                try {
                  const input = pendingToolBlock.inputJson ? JSON.parse(pendingToolBlock.inputJson) : {};
                  toolCalls.push({ type: "tool_use", id: pendingToolBlock.id, name: pendingToolBlock.name, input });
                } catch (e) {
                  console.error("[SSE] Failed to parse tool input JSON:", e);
                }
              }
              pendingToolBlock = null;
            }

            // Backend sends full message in message_stop (fallback if no deltas)
            if (event.type === "message_stop" && event.message) {
              const msg = event.message as ClaudeResponse;
              const finalTools = extractToolCalls(msg);
              if (finalTools.length > 0) toolCalls = finalTools;
              if (!fullText) {
                const msgText = extractText(msg);
                if (msgText) {
                  fullText = msgText;
                  // Use typewriter since we got the full text at once
                  setTypingMsgIndex(msgIdx.current);
                  setMessages(prev => {
                    const updated = [...prev];
                    if (msgIdx.current >= 0 && updated[msgIdx.current]) {
                      updated[msgIdx.current] = { ...updated[msgIdx.current], text: fullText };
                    }
                    return updated;
                  });
                }
              }
            }

            // Catch-all: backend may send tool_use as a standalone event
            if (event.type === "tool_use" && event.name && event.input) {
              toolCalls.push(event as ToolUse);
            }
            if (Array.isArray(event.toolCalls)) {
              for (const tc of event.toolCalls) {
                if (tc.type === "tool_use" && tc.name) toolCalls.push(tc);
              }
            }
          } catch { /* skip malformed SSE */ }
        }
      }

      if (fullText) {
        setConversationHistory(prev => [...prev, { role: "assistant", text: fullText }]);
        setMessages(prev => {
          setTimeout(() => persistSession(prev), 100);
          return prev;
        });
      }

      if (toolCalls.length > 0) {
        processToolCalls(toolCalls);
        if (!fullText) {
          setMessages(prev => [...prev, { role: "cira" as const, text: "I'm processing your information... 💙" }]);
        }
      }
    } catch (err: any) {
      const msg = err?.message || "Something went wrong";
      if (msg.startsWith("RATE_LIMITED")) {
        toast.error("Daily free limit reached. Sign up for unlimited access!", { action: { label: "Sign Up", onClick: () => navigate("/login") }, duration: 8000 });
        setMessages(prev => [...prev, { role: "cira", text: "⚠️ You've reached your daily free message limit. Sign up for unlimited access!" }]);
      } else if (msg.startsWith("CREDITS_EXHAUSTED")) {
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

  const selectMode = async (mode: ChatMode) => {
    if (mode === "vitals") {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
        const res = await fetch(`${API_BASE}/api/guest/scan-check`, {
          headers: { "X-Device-Id": deviceId.current },
        });
        const data = await res.json();
        if (!data.allowed) {
          toast.error("Daily free scan used. Login to get more scans.", { action: { label: "Login", onClick: () => navigate("/login") } });
          return;
        }
      } catch {
        toast.error("Could not verify scan eligibility.");
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
    
    prepPayloadSentRef.current = false;
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

            {/* Daily messages remaining */}
            <div className="px-3 pt-2 pb-1">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <Sparkles size={10} />
                <span>{guestRemaining}/{guestDailyLimit} messages today</span>
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
                                  const trackingData = { timestamp: new Date().toISOString(), deviceId: deviceId.current, page: window.location.pathname, source: "agent_button", userAgent: navigator.userAgent };
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
                            <button
                              onClick={() => selectMode("vitals")}
                              className="flex flex-col items-start px-3.5 py-2 rounded-xl border border-border/60 text-left hover:bg-accent transition-colors active:scale-95"
                            >
                              <span className="text-[12px] font-medium text-foreground">📸 Face Scan</span>
                              <span className="text-[10px] text-muted-foreground">30-second scan captures real vitals from your face</span>
                            </button>
                            <button
                              onClick={() => {
                                // Track the click
                                const trackingData = {
                                  timestamp: new Date().toISOString(),
                                  deviceId: deviceId.current,
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
                      <div className="max-w-[95%] md:max-w-[80%]">
                        <div className="mb-2"><AiSparkleIcon size={20} active /></div>
                        <div className="text-foreground">
                          <p className="text-[14px] md:text-[15px] leading-7 font-body">
                            {typingMsgIndex === i ? (
                              <TypewriterText text={msg.text} speed={15} onComplete={() => setTypingMsgIndex(null)} formatted />
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
                      <div className="mb-2"><AiSparkleIcon size={20} active thinking /></div>
                      
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Bottom input with floating mode buttons */}
        <div className="relative shrink-0 bg-white" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
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
              <button type="submit" disabled={isApiLoading || !message.trim()} className="w-10 h-10 flex items-center justify-center text-muted-foreground shrink-0 mr-1 hover:text-foreground transition-colors disabled:opacity-30">
                <Send size={18} strokeWidth={1.5} />
              </button>
            </div>
          </form>
          {/* Daily limit counter */}
          <div className="text-center">
            <p className="text-[9px] text-muted-foreground/50">{guestRemaining}/{guestDailyLimit} free messages today · <button onClick={() => navigate("/login")} className="text-primary hover:underline">Login for unlimited</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeChat;
