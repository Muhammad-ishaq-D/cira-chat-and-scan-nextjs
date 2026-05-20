import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, Plus, Lock } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { isAuthenticated, getUser } from "@/lib/auth";

type Item = { label: string; path: string; external?: boolean };

const explore: Item[] = [
  { label: "Ask Cira (AI Nurse)", path: "/chat" },
  { label: "Face Scan", path: "/vitals-scan" },
  { label: "How it works", path: "/how-it-works" },
  { label: "Technology", path: "/technology" },
  { label: "What Cira helps with", path: "/what-cira-helps-with" },
  { label: "Pricing", path: "/pricing" },
];

const company: Item[] = [
  { label: "Our Story", path: "/our-story" },
  { label: "Real Doctors", path: "/real-doctors" },
  { label: "Blog", path: "/blog" },
  { label: "Contact", path: "mailto:hello@askainurse.com", external: true },
];

const legal: Item[] = [
  { label: "Security & Privacy", path: "/privacy" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Terms", path: "/terms" },
];

const LandingMenu = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const authed = isAuthenticated();
  const user = getUser();

  const go = (item: Item) => {
    setOpen(false);
    if (item.external) {
      window.location.href = item.path;
    } else {
      navigate(item.path);
    }
  };

  const Section = ({ title, items }: { title: string; items: Item[] }) => (
    <div className="px-6 py-4 border-t border-border/50">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70 mb-3">{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <button
              onClick={() => go(item)}
              className="w-full flex items-center justify-between py-2.5 text-[15px] text-foreground hover:text-primary transition-colors group"
            >
              <span>{item.label}</span>
              <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="w-10 h-10 -ml-2 mr-1 rounded-full flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
        >
          <Menu size={22} strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="p-0 w-[88%] sm:max-w-sm bg-background flex flex-col gap-0 border-r border-border/60"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <button onClick={() => { setOpen(false); navigate("/"); }} className="flex items-center gap-2">
            <img src={ciraLogo} alt="Cira" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* CTA */}
        <div className="px-6 pb-4">
          <button
            onClick={() => { setOpen(false); navigate("/chat"); }}
            className="w-full flex items-center gap-2 text-primary font-medium text-[15px] py-2 hover:opacity-80 transition-opacity"
          >
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus size={13} strokeWidth={2.5} />
            </span>
            New Consult
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto">
          <Section title="Explore" items={explore} />
          <Section title="Company" items={company} />
          <Section title="Legal" items={legal} />
        </div>

        {/* Footer */}
        <div className="border-t border-border/50 px-6 py-5 space-y-3">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
            <Lock size={11} />
            <span>HIPAA · Private</span>
          </div>
          {authed ? (
            <button
              onClick={() => { setOpen(false); navigate("/dashboard"); }}
              className="w-full h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Go to Dashboard
            </button>
          ) : (
            <button
              onClick={() => { setOpen(false); navigate("/login"); }}
              className="w-full h-10 rounded-full border border-border bg-background text-foreground text-sm font-medium hover:bg-foreground/5 transition-colors"
            >
              Log in
            </button>
          )}
          <p className="text-[10px] text-muted-foreground/50">v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LandingMenu;
