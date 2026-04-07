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
                  if (item.id === "home") navigate("/");
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
            /* Welcome screen */
            <div className="h-full flex flex-col items-center justify-center px-6 relative">
              {/* Ambient gradient background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-r from-primary/8 via-purple-500/6 to-blue-500/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/3 left-1/3 w-[300px] h-[300px] bg-gradient-to-br from-primary/5 to-pink-500/5 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex flex-col items-center">
                {/* Logo with glow */}
                <div className="relative mb-4">
                  <div className="absolute inset-0 blur-2xl opacity-30 bg-gradient-to-r from-primary via-purple-400 to-blue-400 rounded-full scale-[2]" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 flex items-center justify-center backdrop-blur-sm">
                    <img src={ciraLogo} alt="Cira" width={32} height={32} />
                  </div>
                </div>

                <h1 className="font-heading text-2xl font-semibold text-foreground mb-1">Cira</h1>
                <p className="text-sm text-muted-foreground font-body mb-8">Your AI health assistant</p>

                {/* Input box with gradient border */}
                <div className="w-full max-w-xl mb-8">
                  <form onSubmit={handleSend} className="relative group">
                    <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/40 via-purple-500/30 to-blue-500/40 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-[1px]" />
                    <div className="relative">
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                        placeholder="Tell Cira what's going on — symptoms, concerns, anything."
                        rows={3}
                        className="w-full py-4 px-5 pr-14 rounded-2xl border border-border bg-card/80 backdrop-blur-sm text-foreground font-body text-sm outline-none placeholder:text-muted-foreground resize-none shadow-sm"
                      />
                      <button
                        type="submit"
                        className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all"
                      >
                        <Send size={15} />
                      </button>
                    </div>
                  </form>
                </div>

                {/* Quick action cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl w-full">
                  {quickActions.map((action) => (
                    <button
                      key={action.title}
                      onClick={() => startChat(action.title)}
                      className="group bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center text-primary mb-2 group-hover:from-primary/20 group-hover:to-purple-500/20 transition-colors">
                        {action.icon}
                      </div>
                      <p className="text-xs font-medium text-foreground font-body group-hover:text-primary transition-colors">{action.title}</p>
                      <p className="text-[10px] text-muted-foreground font-body mt-0.5">{action.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Chat messages with AI styling */
            <div className="max-w-2xl mx-auto p-6 space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                  <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "cira" ? (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/15 to-purple-500/15 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-primary/10">
                        <img src={ciraLogo} alt="" width={14} height={14} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 mt-0.5 text-primary-foreground text-[10px] font-bold">
                        JM
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground rounded-tr-md shadow-md shadow-primary/10"
                          : "bg-card border border-border text-foreground rounded-tl-md shadow-sm"
                      }`}
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
          )}
        </div>

        {/* Bottom input when in conversation */}
        {messages.length > 0 && (
          <div className="border-t border-border p-4 bg-card/80 backdrop-blur-sm shrink-0">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3 relative group">
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/20 via-purple-500/15 to-blue-500/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-[1px]" />
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell Cira what's going on..."
                className="relative flex-1 py-3 px-4 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="relative px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-body text-sm font-medium hover:shadow-lg hover:shadow-primary/20 transition-all"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
