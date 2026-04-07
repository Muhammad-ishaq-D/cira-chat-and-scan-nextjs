import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ciraLogo from "@/assets/cira-logo.svg";

const mockHistory = [
  { id: "1", title: "Chest tightness and fatigue", date: "Today" },
  { id: "2", title: "Headache for 3 days", date: "Yesterday" },
  { id: "3", title: "High blood pressure check", date: "Mar 30" },
  { id: "4", title: "Skin rash on arms", date: "Mar 28" },
  { id: "5", title: "Sleep issues and stress", date: "Mar 25" },
];

const quickActions = [
  { icon: "💬", title: "Describe Symptoms", desc: "Tell Cira how you feel" },
  { icon: "📷", title: "Scan Vitals", desc: "Camera-based health scan" },
  { icon: "📋", title: "Review History", desc: "Past consultations" },
  { icon: "🩺", title: "Book a Doctor", desc: "Connect with a physician" },
];

const navItems = [
  { icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ), label: "Home", id: "home" },
  { icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
  ), label: "Chat", id: "chat" },
  { icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ), label: "History", id: "history" },
  { icon: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
  ), label: "Vitals", id: "vitals" },
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
      {/* Slim icon sidebar */}
      <div className="w-[60px] border-r border-border bg-card flex flex-col items-center py-4 shrink-0">
        {/* Collapse toggle */}
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 rounded-lg hover:bg-accent transition-colors mb-4"
          title="Toggle sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showHistory ? <><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></> : <><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></>}
          </svg>
        </button>

        <div className="w-8 h-[1px] bg-border mb-4" />

        {/* Nav icons */}
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveNav(item.id);
                if (item.id === "home") navigate("/");
                if (item.id === "history") setShowHistory(!showHistory);
              }}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors group relative ${
                activeNav === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
              title={item.label}
            >
              {item.icon}
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-foreground text-background text-xs font-body whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom: profile */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Back to home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer">
            JM
          </div>
        </div>
      </div>

      {/* Expandable chat history panel */}
      <div className={`${showHistory ? "w-56" : "w-0"} transition-all duration-200 border-r border-border bg-card overflow-hidden shrink-0`}>
        <div className="p-3 border-b border-border">
          <p className="text-xs font-medium text-foreground font-body">Chat History</p>
        </div>
        <div className="p-2 space-y-0.5 overflow-y-auto">
          {mockHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setActiveChat(chat.id);
                startChat(chat.title);
              }}
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
        {/* Chat messages or welcome */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen like ClickUp Brain */
            <div className="h-full flex flex-col items-center justify-center px-6">
              {/* Gradient glow behind logo */}
              <div className="relative mb-6">
                <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-pink-400 via-primary to-blue-400 rounded-full scale-150" />
                <img src={ciraLogo} alt="Cira" width={48} height={48} className="relative" />
              </div>

              <h1 className="font-heading text-3xl font-semibold text-foreground mb-8">Cira</h1>

              {/* Input box */}
              <div className="w-full max-w-xl mb-8">
                <form onSubmit={handleSend} className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                    placeholder="Tell Cira what's going on — symptoms, concerns, anything."
                    rows={3}
                    className="w-full py-4 px-5 pr-24 rounded-2xl border border-border bg-card text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground resize-none shadow-sm"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="submit"
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Quick action cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl w-full">
                {quickActions.map((action) => (
                  <button
                    key={action.title}
                    onClick={() => {
                      if (action.title === "Describe Symptoms") {
                        // focus the textarea
                      } else {
                        startChat(action.title);
                      }
                    }}
                    className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
                  >
                    <span className="text-lg mb-2 block">{action.icon}</span>
                    <p className="text-sm font-medium text-foreground font-body group-hover:text-primary transition-colors">{action.title}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="max-w-2xl mx-auto p-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-start gap-3 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "cira" && (
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <img src={ciraLogo} alt="" width={16} height={16} />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-card border border-border text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom input (shown when in conversation) */}
        {messages.length > 0 && (
          <div className="border-t border-border p-4 bg-card shrink-0">
            <form onSubmit={handleSend} className="max-w-2xl mx-auto flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell Cira what's going on..."
                className="flex-1 py-3 px-4 rounded-xl border border-border bg-background text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="px-4 py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
