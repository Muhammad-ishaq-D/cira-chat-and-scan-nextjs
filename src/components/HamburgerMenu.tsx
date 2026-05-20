import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, Lock, Plus } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { isAuthenticated } from "@/lib/auth";

type Item = { label: string; path?: string; href?: string };

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Product",
    items: [
      { label: "How it works", path: "/how-it-works" },
      { label: "Technology", path: "/technology" },
      { label: "What Cira helps with", path: "/what-cira-helps-with" },
      { label: "Pricing", path: "/pricing" },
      { label: "Face Vital Scan", path: "/vitals-scan" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Our story", path: "/our-story" },
      { label: "Real doctors", path: "/real-doctors" },
      { label: "Blog", path: "/blog" },
      { label: "Contact", href: "mailto:hello@askainurse.com" },
    ],
  },
  {
    title: "Legal",
    items: [
      { label: "Security & Privacy", path: "/privacy" },
      { label: "Privacy Policy", path: "/privacy-policy" },
      { label: "Terms", path: "/terms" },
    ],
  },
];

const HamburgerMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const loggedIn = isAuthenticated();

  const go = (item: Item) => {
    setOpen(false);
    if (item.href) {
      window.location.href = item.href;
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-accent/60 transition-colors"
        >
          <Menu size={22} className="text-foreground" strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] sm:w-[380px] p-0 border-r border-border bg-background flex flex-col [&>button]:hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/");
            }}
            className="flex items-center gap-2"
          >
            <img src={ciraLogo} alt="Cira" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent/60 transition-colors"
          >
            <X size={16} className="text-foreground" />
          </button>
        </div>

        {/* Primary CTA */}
        <div className="px-6 pb-4">
          <button
          onClick={() => {
              setOpen(false);
              navigate("/chat");
            }}
            className="w-full flex items-center gap-3 py-3 text-primary font-body font-medium"
          >
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span>New Chat</span>
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title} className="border-t border-border/60 px-6 py-5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 font-body">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={() => go(item)}
                      className="w-full flex items-center justify-between py-2.5 text-[15px] font-body text-foreground hover:text-primary transition-colors"
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border/60 px-6 py-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <Lock size={11} />
            <span>HIPAA · Private</span>
          </div>
          {!loggedIn && (
            <button
              onClick={() => {
                setOpen(false);
                navigate("/login");
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-body font-medium text-foreground hover:bg-accent/60 transition-colors"
            >
              Log in
            </button>
          )}
          <p className="text-[10px] text-muted-foreground/70 font-body">v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
