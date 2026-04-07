import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Menu, LogOut, Send, Plus, Sparkles, Clock, ScanFace, Activity, MessageCircle, FileText, Stethoscope, ShieldAlert, UserRound, Heart, Wind, Brain, Zap, Scale, X, Camera } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";

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
  { icon: UserRound, label: "Doctor", id: "doctor" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("chat");
  const [messages, setMessages] = useState<{ role: "user" | "cira" | "vitals"; text: string; vitalsData?: typeof scanVitals }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("none");
  const [pendingLandingMessage, setPendingLandingMessage] = useState<string | null>(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  // Pick up message from landing page
  useEffect(() => {
    const landingMsg = sessionStorage.getItem("cira_landing_message");
    if (landingMsg) {
      sessionStorage.removeItem("cira_landing_message");
      setPendingLandingMessage(landingMsg);
      // Show the user's message + Cira's response with mode selection
      setMessages([
        { role: "user", text: landingMsg },
        { role: "cira", text: `Thanks for sharing that — "${landingMsg}"\n\nBefore I dive in, I'd love to help you in the best way possible. How would you like to proceed?` },
      ]);
      setShowModeSelection(true);
    }
  }, []);

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

  const startScan = () => {
    setScanning(true);
    setScanComplete(false);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          setScanComplete(true);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  const completeScanAndChat = () => {
    setShowScanModal(false);
    setScanComplete(false);
    setScanProgress(0);
    
    // Build vitals summary text for Cira context
    const vitalsText = scanVitals.map(v => `${v.label}: ${v.value} ${v.unit}`).join("\n");
    
    const ciraResponse = "✨ Scan complete! I've captured all your vitals. Here's what I'm working with:\n\nNow I have a full picture of your body's current state. Combined with what you've told me, I can give you a much more informed assessment.\n\nWhat would you like help with today?";

    if (pendingLandingMessage) {
      setMessages((prev) => [
        ...prev,
        { role: "vitals", text: "Face Scan Results", vitalsData: scanVitals },
        { role: "cira", text: ciraResponse },
      ]);
      setPendingLandingMessage(null);
    } else {
      setMessages([
        { role: "cira", text: "📸 Starting your vital scan..." },
        { role: "vitals", text: "Face Scan Results", vitalsData: scanVitals },
        { role: "cira", text: ciraResponse },
      ]);
    }
  };

  const selectMode = (mode: ChatMode) => {
    if (mode === "vitals") {
      setChatMode(mode);
      setShowModeSelection(false);
      // Open scan modal instead of going straight to chat
      setShowScanModal(true);
      if (pendingLandingMessage) {
        setMessages((prev) => [
          ...prev,
          { role: "cira", text: "✨ Vital Scan + Assessment activated!\n\nLet me capture your vitals first — this will only take 30 seconds..." },
        ]);
      }
      return;
    }

    setChatMode(mode);
    setShowModeSelection(false);
    
    const modeConfirmations: Record<ChatMode, string> = {
      quick: "✨ Quick Assessment activated!\n\nI already know what's on your mind. Let me ask you a few focused follow-up questions to give you a fast, accurate assessment.",
      detailed: "✨ Detailed Assessment activated!\n\nI'll build a complete picture around what you've shared. At the end, I'll generate a comprehensive report for you and your doctor.\n\nLet me start with some deeper questions...",
      vitals: "",
      chat: "✨ Got it — let's just chat!\n\nI've noted what you shared. I'm here to help guide you with anything health-related.\n\n⚕️ *Remember: Always discuss my findings with a licensed medical professional.*\n\nTell me more about what's going on.",
      none: "",
    };

    if (pendingLandingMessage) {
      setMessages((prev) => [
        ...prev,
        { role: "cira", text: modeConfirmations[mode] },
      ]);
      setPendingLandingMessage(null);
    } else {
      const greetings: Record<ChatMode, string> = {
        quick: "👋 Quick Assessment mode activated!\n\nI'll ask you a few focused questions and give you a health assessment as quickly as possible. Tell me — what's bothering you today?",
        detailed: "👋 Detailed Assessment mode activated!\n\nI'll be asking you thorough questions to build a complete picture of your health concern. At the end, I'll generate a comprehensive report for you and your doctor.\n\nLet's start — what's your primary health concern right now?",
        vitals: "",
        chat: "👋 Hey there! I'm Cira, your AI health nurse.\n\nYou can ask me anything about your health — symptoms, medications, lifestyle, or general wellness. I'm here to help guide you.\n\n⚕️ *Remember: Always discuss my findings with a licensed medical professional.*\n\nWhat would you like to talk about?",
        none: "",
      };
      setMessages([{ role: "cira", text: greetings[mode] }]);
    }
  };

  const startChat = (title: string) => {
    setMessages([
      { role: "user", text: title },
      { role: "cira", text: "I understand. Let me look into this for you. Can you tell me more about when this started?" },
    ]);
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
        <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
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

               <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/40 flex items-center justify-center mb-4 md:mb-5 shadow-sm">
                  <img src={ciraLogo} alt="Cira" width={24} height={24} className="md:w-7 md:h-7" />
                </div>
                <h1 className="text-xl md:text-[32px] font-semibold text-foreground mb-1.5 md:mb-2 tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  How can Cira help?
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground mb-5 md:mb-10 text-center max-w-md">
                  Choose a consultation type or just start chatting.
                </p>

                {/* ✦ HERO — Vital Scan — compact on mobile */}
                <button
                  onClick={() => selectMode("vitals")}
                  className="group w-full max-w-2xl mb-3 md:mb-5 relative overflow-hidden rounded-xl md:rounded-2xl text-left transition-all active:scale-[0.98] hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-95" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute top-3 right-8 w-1 h-1 bg-white/40 rounded-full animate-pulse" />
                  <div className="absolute top-5 right-16 w-1.5 h-1.5 bg-white/30 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
                  
                  <div className="relative z-10 p-3.5 md:p-6 flex items-center gap-3 md:gap-5">
                    <div className="shrink-0">
                      <div className="w-11 h-11 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg relative">
                        <ScanFace size={20} className="text-white md:hidden" />
                        <ScanFace size={30} className="text-white hidden md:block" />
                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Sparkles size={7} className="text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[13px] md:text-lg font-bold text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Vital Scan + Assessment</p>
                        <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[7px] font-semibold text-white uppercase tracking-wider">AI</span>
                      </div>
                      <p className="text-[10px] md:text-sm text-white/75 leading-relaxed hidden md:block">
                        30-second face scan captures 30+ vitals — then Cira cross-references your symptoms with real clinical data.
                      </p>
                      <p className="text-[9px] text-white/70 leading-snug md:hidden">Face scan → 30+ vitals → AI analysis</p>
                      <div className="flex items-center gap-2 mt-1.5 md:mt-3">
                        <span className="text-[8px] md:text-[10px] text-white/60 flex items-center gap-0.5"><Camera size={8} /> Scan</span>
                        <span className="text-white/30">·</span>
                        <span className="text-[8px] md:text-[10px] text-white/60 flex items-center gap-0.5"><Activity size={8} /> 30+ Vitals</span>
                        <span className="text-white/30">·</span>
                        <span className="text-[8px] md:text-[10px] text-white/60">~4 min</span>
                      </div>
                    </div>
                    <div className="shrink-0 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    </div>
                  </div>
                </button>

                {/* Secondary modes — compact tiles */}
                <div className="grid grid-cols-2 gap-2 md:gap-3 w-full max-w-2xl mb-4 md:mb-8">
                  {chatModes.filter(m => m.id !== "vitals").map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => selectMode(mode.id)}
                        className="group bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl md:rounded-2xl p-3 md:p-5 text-left hover:shadow-lg hover:border-border/80 transition-all active:scale-[0.98]"
                      >
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${mode.bgGlow} flex items-center justify-center mb-2 md:mb-3`}>
                          <Icon size={15} className="md:hidden" style={{ color: mode.gradient.includes("blue") ? "#3b82f6" : "#a855f7" }} />
                          <Icon size={20} className="hidden md:block" style={{ color: mode.gradient.includes("blue") ? "#3b82f6" : "#a855f7" }} />
                        </div>
                        <p className="text-[11px] md:text-sm font-semibold text-foreground mb-0.5 md:mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{mode.title}</p>
                        <p className="text-[9px] md:text-[11px] text-muted-foreground leading-relaxed line-clamp-2 md:line-clamp-none mb-2 md:mb-3">{mode.desc}</p>
                        <span className="inline-block text-[8px] md:text-[9px] font-medium px-1.5 md:px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">
                          {mode.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Just chat option */}
                <button
                  onClick={() => selectMode("chat")}
                  className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-card/60 backdrop-blur-sm border border-border/30 hover:bg-card/90 hover:border-border/60 transition-all active:scale-[0.98]"
                >
                  <div className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center">
                    <MessageCircle size={14} className="text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-medium text-foreground">Just Chat with Cira</p>
                    <p className="text-[9px] text-muted-foreground">No assessment — ask anything</p>
                  </div>
                </button>

                <p className="text-[8px] md:text-[9px] text-muted-foreground/60 mt-5 md:mt-8 text-center max-w-sm leading-relaxed">
                  ⚕️ Cira is an AI health nurse. Always discuss findings with a doctor.
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
                    {/* Vitals card */}
                    {msg.role === "vitals" && msg.vitalsData ? (
                      <div className="flex items-start gap-3 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <ScanFace size={16} className="text-primary" />
                        </div>
                        <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl rounded-tl-sm shadow-sm overflow-hidden w-full">
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
                          <div className="grid grid-cols-3 gap-0.5 p-2">
                            {msg.vitalsData.map((vital) => {
                              const VIcon = vital.icon;
                              return (
                                <div key={vital.label} className="flex flex-col items-center p-3 rounded-xl hover:bg-accent/30 transition-colors">
                                  <div className={`w-8 h-8 rounded-lg ${vital.color} flex items-center justify-center mb-1.5`}>
                                    <VIcon size={14} />
                                  </div>
                                  <p className="text-sm font-bold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{vital.value}</p>
                                  <p className="text-[9px] text-muted-foreground text-center leading-tight mt-0.5">{vital.label}</p>
                                  <p className="text-[8px] text-muted-foreground/60">{vital.unit}</p>
                                </div>
                              );
                            })}
                          </div>
                          <div className="px-4 py-2 border-t border-border/20">
                            <p className="text-[9px] text-emerald-600 font-medium text-center">✓ All vitals within healthy range</p>
                          </div>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                ))}

                {/* Inline mode selection after landing message */}
                {showModeSelection && (
                  <div className="animate-fade-in">
                    <div className="flex justify-start">
                      <div className="flex items-start gap-3 max-w-[92%]">
                        <div className="w-8 h-8 rounded-full bg-card/90 backdrop-blur-sm border border-border/50 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <img src={ciraLogo} alt="" width={16} height={16} />
                        </div>
                        <div className="space-y-3 w-full">
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

                          {/* Secondary — Quick & Detailed (compact tiles) */}
                          <div className="grid grid-cols-2 gap-2">
                            {chatModes.filter(m => m.id !== "vitals").map((mode) => {
                              const Icon = mode.icon;
                              return (
                                <button
                                  key={mode.id}
                                  onClick={() => selectMode(mode.id)}
                                  className="group bg-card/90 backdrop-blur-sm border border-border/50 rounded-xl p-2.5 text-left active:scale-[0.98] transition-all"
                                >
                                  <div className={`w-7 h-7 rounded-lg ${mode.bgGlow} flex items-center justify-center mb-1.5`}>
                                    <Icon size={13} style={{ color: mode.gradient.includes("blue") ? "#3b82f6" : "#a855f7" }} />
                                  </div>
                                  <p className="text-[10px] font-semibold text-foreground mb-0.5" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{mode.title}</p>
                                  <p className="text-[8px] text-muted-foreground leading-snug line-clamp-2">{mode.desc}</p>
                                </button>
                              );
                            })}
                          </div>

                          {/* Just chat */}
                          <button
                            onClick={() => selectMode("chat")}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30 active:scale-[0.98] transition-all w-full"
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom input — always matches the aesthetic */}
        {messages.length > 0 && (
          <div className="relative border-t border-border/30 p-4 pb-20 md:pb-4 shrink-0">
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
