import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Menu, LogOut, Send, Plus, Sparkles, Clock, ScanFace, Activity, MessageCircle, FileText, Stethoscope, ShieldAlert, UserRound } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";

const mockHistory = [
  { id: "1", title: "Chest tightness and fatigue", date: "Today" },
  { id: "2", title: "Headache for 3 days", date: "Yesterday" },
  { id: "3", title: "High blood pressure check", date: "Mar 30" },
  { id: "4", title: "Skin rash on arms", date: "Mar 28" },
  { id: "5", title: "Sleep issues and stress", date: "Mar 25" },
];

type ChatMode = "none" | "quick" | "detailed" | "vitals" | "chat";

const chatModes = [
  {
    id: "quick" as ChatMode,
    icon: Stethoscope,
    title: "Quick Assessment",
    desc: "Cira asks focused questions and gives you fast health advice with good accuracy.",
    badge: "~2 min",
    gradient: "from-blue-500 to-cyan-400",
    bgGlow: "bg-blue-100",
  },
  {
    id: "detailed" as ChatMode,
    icon: FileText,
    title: "Detailed Assessment",
    desc: "Cira asks in-depth questions, gathers full insight, and generates a comprehensive health report.",
    badge: "~8 min · Highest Accuracy",
    gradient: "from-purple-500 to-pink-400",
    bgGlow: "bg-purple-100",
  },
  {
    id: "vitals" as ChatMode,
    icon: ScanFace,
    title: "Vital Scan + Assessment",
    desc: "Quick face scan captures your vitals first, then Cira uses that data for a more informed consultation.",
    badge: "~4 min · Scan Powered",
    gradient: "from-emerald-500 to-teal-400",
    bgGlow: "bg-emerald-100",
  },
];

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("chat");
  const [messages, setMessages] = useState<{ role: "user" | "cira"; text: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("none");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (chatMode === "none") setChatMode("chat");
    const modeResponses: Record<ChatMode, string> = {
      quick: "I hear you. Let me do a quick assessment.\n\nHow long have you been experiencing this? And on a scale of 1–10, how would you rate the severity?",
      detailed: "I'll conduct a thorough assessment. Let's start from the beginning.\n\nFirst, can you describe your primary concern in detail? When did it first start, and has it changed over time?",
      vitals: "I've noted your vitals from the scan. Now let me combine that data with your symptoms.\n\nWhat's been bothering you? I'll cross-reference with your vital readings.",
      chat: "I hear you. Let me ask a few follow-up questions to better understand what's going on.\n\nHow long have you been experiencing this? And on a scale of 1–10, how would you rate the severity?",
      none: "",
    };
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message },
      { role: "cira", text: modeResponses[chatMode] || modeResponses.chat },
    ]);
    setMessage("");
  };

  const selectMode = (mode: ChatMode) => {
    setChatMode(mode);
    const greetings: Record<ChatMode, string> = {
      quick: "👋 Quick Assessment mode activated!\n\nI'll ask you a few focused questions and give you a health assessment as quickly as possible. Tell me — what's bothering you today?",
      detailed: "👋 Detailed Assessment mode activated!\n\nI'll be asking you thorough questions to build a complete picture of your health concern. At the end, I'll generate a comprehensive report for you and your doctor.\n\nLet's start — what's your primary health concern right now?",
      vitals: "👋 Vital Scan + Assessment mode!\n\nI'll use your latest face scan data to inform my analysis. Combined with your symptoms, this gives me the most complete picture.\n\nFirst, tell me — what would you like help with today?",
      chat: "👋 Hey there! I'm Cira, your AI health nurse.\n\nYou can ask me anything about your health — symptoms, medications, lifestyle, or general wellness. I'm here to help guide you.\n\n⚕️ *Remember: Always discuss my findings with a licensed medical professional.*\n\nWhat would you like to talk about?",
      none: "",
    };
    setMessages([{ role: "cira", text: greetings[mode] }]);
  };

  const startChat = (title: string) => {
    setMessages([
      { role: "user", text: title },
      { role: "cira", text: "I understand. Let me look into this for you. Can you tell me more about when this started?" },
    ]);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Slim icon sidebar with labels */}
      <div className="w-[72px] border-r border-border bg-card flex flex-col items-center py-4 shrink-0">
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
            onClick={() => navigate("/")}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
              JM
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Chat history drawer - slides from sidebar edge, no full overlay */}
      {showHistory && (
        <>
          {/* Click-away backdrop over main content only, not sidebar */}
          <div
            className="fixed inset-0 z-40 bg-black/10"
            style={{ left: 72 }}
            onClick={() => setShowHistory(false)}
          />
          {/* Drawer panel anchored to sidebar */}
          <div
            className="fixed top-0 bottom-0 z-50 w-72 bg-card border-r border-border shadow-2xl flex flex-col animate-[slide-in-left_0.2s_ease-out]"
            style={{ left: 72 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Chat History</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setActiveChat(null); setMessages([]); setShowHistory(false); }}
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
              {mockHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => { setActiveChat(chat.id); startChat(chat.title); setShowHistory(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-body transition-all ${
                    activeChat === chat.id
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  }`}
                >
                  <p className="truncate font-medium">{chat.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{chat.date}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Hamburger button outside navbar */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-accent/80 hover:text-foreground transition-all bg-card/60 backdrop-blur-sm border border-border/40 shadow-sm"
          title="Chat History"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen — Lovable-style soft gradient */
            <div className="h-full flex flex-col items-center justify-center px-6 relative overflow-hidden">
              {/* Full-screen pastel gradient background */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-pink-100/40 to-orange-100/50" />
                <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-gradient-to-br from-blue-200/50 to-purple-200/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-gradient-to-tl from-orange-200/50 via-pink-200/40 to-rose-200/30 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-gradient-to-r from-pink-200/30 to-purple-200/20 rounded-full blur-[100px]" />
              </div>

              <div className="relative z-10 flex flex-col items-center w-full max-w-2xl">
                <div className="w-14 h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 flex items-center justify-center mb-5 shadow-sm">
                  <img src={ciraLogo} alt="Cira" width={28} height={28} />
                </div>
                <h1 className="text-[32px] font-semibold text-foreground mb-2 tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  How can Cira help you?
                </h1>
                <p className="text-sm text-muted-foreground mb-10 text-center max-w-md">
                  Choose a consultation type below, or just start chatting with your AI health nurse.
                </p>

                {/* Mode selection cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
                  {chatModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => selectMode(mode.id)}
                        className="group bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-5 text-left hover:shadow-lg hover:border-border/80 transition-all hover:-translate-y-0.5"
                      >
                        <div className={`w-10 h-10 rounded-xl ${mode.bgGlow} flex items-center justify-center mb-3`}>
                          <Icon size={20} className={`bg-gradient-to-r ${mode.gradient} bg-clip-text`} style={{ color: mode.gradient.includes("blue") ? "#3b82f6" : mode.gradient.includes("purple") ? "#a855f7" : "#10b981" }} />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{mode.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">{mode.desc}</p>
                        <span className="inline-block text-[9px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">
                          {mode.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Just chat option */}
                <button
                  onClick={() => selectMode("chat")}
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-card/60 backdrop-blur-sm border border-border/30 hover:bg-card/90 hover:border-border/60 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <MessageCircle size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-foreground">Just Chat with Cira</p>
                    <p className="text-[10px] text-muted-foreground">No assessment — ask anything, get guided advice</p>
                  </div>
                </button>

                {/* Disclaimer */}
                <p className="text-[9px] text-muted-foreground/60 mt-8 text-center max-w-sm leading-relaxed">
                  ⚕️ Cira is an AI health nurse, not a licensed medical professional. Always discuss Cira's findings with a doctor.
                </p>
              </div>
            </div>
          ) : (
            /* Chat messages — keep same gradient bg */
            <div className="relative min-h-full">
              {/* Same gradient as welcome */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 via-pink-100/40 to-orange-100/50" />
                <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-gradient-to-br from-blue-200/50 to-purple-200/30 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-gradient-to-tl from-orange-200/50 via-pink-200/40 to-rose-200/30 rounded-full blur-[120px]" />
              </div>

              <div className="relative z-10 max-w-2xl mx-auto p-6 space-y-5">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                      {msg.role === "cira" ? (
                        <div className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <img src={ciraLogo} alt="" width={16} height={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 mt-0.5 text-primary-foreground text-[10px] font-bold shadow-sm">
                          JM
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-tr-sm shadow-md"
                            : "bg-card/90 backdrop-blur-sm border border-border/50 text-foreground rounded-tl-sm shadow-sm"
                        }`}
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                      >
                        {msg.role === "cira" && (
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Sparkles size={10} className="text-primary" />
                            <p className="text-[10px] text-primary font-medium">Cira</p>
                          </div>
                        )}
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom input — always matches the aesthetic */}
        {messages.length > 0 && (
          <div className="relative border-t border-border/30 p-4 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-50/80 via-pink-50/40 to-transparent pointer-events-none" />
            <form onSubmit={handleSend} className="relative z-10 max-w-2xl mx-auto">
              <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 flex items-center overflow-hidden">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell Cira what's going on..."
                  className="flex-1 py-3.5 px-5 bg-transparent text-foreground text-[15px] outline-none placeholder:text-muted-foreground/60"
                  style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center mr-3 hover:opacity-80 transition-opacity shrink-0"
                >
                  <Send size={14} className="-ml-0.5" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
