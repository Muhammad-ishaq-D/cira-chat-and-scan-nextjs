import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, MessageCircle, Clock, Activity, LogOut, Send, Plus, Sparkles } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";

const mockHistory = [
  { id: "1", title: "Chest tightness and fatigue", date: "Today" },
  { id: "2", title: "Headache for 3 days", date: "Yesterday" },
  { id: "3", title: "High blood pressure check", date: "Mar 30" },
  { id: "4", title: "Skin rash on arms", date: "Mar 28" },
  { id: "5", title: "Sleep issues and stress", date: "Mar 25" },
];

const quickActions = [
  { icon: <MessageCircle size={18} />, title: "Describe Symptoms", desc: "Tell Cira how you feel" },
  { icon: <Activity size={18} />, title: "Scan Vitals", desc: "Camera-based health scan" },
  { icon: <Clock size={18} />, title: "Review History", desc: "Past consultations" },
  { icon: <Sparkles size={18} />, title: "Health Insights", desc: "AI-powered analysis" },
];

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: MessageCircle, label: "Chat", id: "chat" },
  { icon: Clock, label: "History", id: "history" },
  { icon: Activity, label: "Vitals", id: "vitals" },
];

const Chat = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [activeNav, setActiveNav] = useState("chat");
  const [messages, setMessages] = useState<{ role: "user" | "cira"; text: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: message },
      { role: "cira", text: "I hear you. Let me ask a few follow-up questions to better understand what's going on.\n\nHow long have you been experiencing this? And on a scale of 1–10, how would you rate the severity?" },
    ]);
    setMessage("");
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
        <div className="mb-6">
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
                  if (item.id === "history") setShowHistory(!showHistory);
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  activeNav === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon size={18} strokeWidth={activeNav === item.id ? 2 : 1.5} />
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
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
            JM
          </div>
        </div>
      </div>

      {/* Expandable chat history panel */}
      <div className={`${showHistory ? "w-56" : "w-0"} transition-all duration-200 border-r border-border bg-card overflow-hidden shrink-0`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-medium text-foreground font-body">Chat History</p>
          <button
            onClick={() => { setActiveChat(null); setMessages([]); }}
            className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            title="New chat"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="p-2 space-y-0.5 overflow-y-auto">
          {mockHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => { setActiveChat(chat.id); startChat(chat.title); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-body transition-colors ${
                activeChat === chat.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <p className="truncate">{chat.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{chat.date}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
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
                <h1 className="text-[36px] font-semibold text-foreground mb-10 tracking-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  What's on your mind?
                </h1>

                {/* Input box — warm, rounded, minimal */}
                <div className="w-full max-w-xl mb-10">
                  <form onSubmit={handleSend} className="relative">
                    <div className="bg-card/90 backdrop-blur-md rounded-2xl shadow-lg border border-border/50 overflow-hidden">
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Tell Cira your symptoms, concerns, anything..."
                        className="w-full py-4 px-5 bg-transparent text-foreground text-[15px] outline-none placeholder:text-muted-foreground/60"
                        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                      />
                      <div className="flex items-center justify-between px-4 pb-3">
                        <button type="button" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
                          <Plus size={18} />
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            type="submit"
                            className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
                          >
                            <Send size={14} className="-ml-0.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Quick action cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-xl">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      onClick={() => startChat(action.title)}
                      className="group bg-card/70 backdrop-blur-sm border border-border/40 rounded-xl p-4 text-left hover:bg-card/90 hover:shadow-md hover:border-border transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground mb-2 group-hover:text-foreground transition-colors">
                        {action.icon}
                      </div>
                      <p className="text-xs font-medium text-foreground font-body">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{action.desc}</p>
                    </button>
                  ))}
                </div>
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
