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

const Chat = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "cira"; text: string }[]>([]);

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

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-200 border-r border-border bg-card flex flex-col overflow-hidden`}
      >
        {/* Sidebar header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img src={ciraLogo} alt="Cira" width={22} height={22} />
            <span className="font-heading text-base font-semibold text-foreground">Cira</span>
          </div>
          <button
            onClick={() => {
              setActiveChat(null);
              setMessages([]);
            }}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="New chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-body px-2 mb-2">Recent</p>
          {mockHistory.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                setActiveChat(chat.id);
                setMessages([
                  { role: "user", text: chat.title },
                  { role: "cira", text: "I understand. Let me look into this for you. Can you tell me more about when this started?" },
                ]);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-body transition-colors ${
                activeChat === chat.id
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <p className="truncate text-sm">{chat.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{chat.date}</p>
            </button>
          ))}
        </div>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={() => navigate("/")}
            className="w-full text-left px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-accent hover:text-foreground font-body transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <span className="text-sm font-body text-muted-foreground">
              {activeChat ? mockHistory.find((c) => c.id === activeChat)?.title : "New conversation"}
            </span>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors" title="Scan vitals">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body">
              JM
            </div>
          </div>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <img src={ciraLogo} alt="Cira" width={40} height={40} className="mb-4 opacity-30" />
              <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                Hi — I'm Cira.
              </h2>
              <p className="text-sm text-muted-foreground font-body max-w-sm">
                Tell me what's going on. I'll ask a few questions, and if I need more information, I can scan your vitals through your camera.
              </p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-body leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-card border border-border text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "cira" && (
                      <p className="text-xs text-primary font-medium mb-1">Cira</p>
                    )}
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
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
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
