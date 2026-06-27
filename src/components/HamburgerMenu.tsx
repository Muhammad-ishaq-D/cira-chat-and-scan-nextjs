"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/react-router-compat";
import { useTranslation } from "react-i18next";
import { Menu, X, ChevronRight, Lock, Plus } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { isAuthenticated } from "@/lib/auth";
import { Globe, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, changeLanguage } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Item = { tKey: string; path?: string; href?: string };

const sections: { titleKey: string; items: Item[] }[] = [
  {
    titleKey: "menu.product",
    items: [
      { tKey: "nav.howItWorks", path: "/how-it-works" },
      { tKey: "nav.technology", path: "/technology" },
      { tKey: "nav.whatCiraHelpsWith", path: "/what-cira-helps-with" },
      // { tKey: "nav.prescriptionRefill", path: "/prescription-refill" },
      { tKey: "nav.pricing", path: "/pricing" },
      { tKey: "menu.faceVitalScan", path: "/vitals-scan" },
    ],
  },
  {
    titleKey: "menu.company",
    items: [
      { tKey: "menu.ourStory", path: "/our-story" },
      { tKey: "nav.realDoctors", path: "/real-doctors" },
      { tKey: "nav.blog", path: "/blog" },
      { tKey: "nav.contact", href: "mailto:hello@askainurse.com" },
    ],
  },
  {
    titleKey: "menu.legal",
    items: [
      { tKey: "footer.security", path: "/privacy" },
      { tKey: "footer.privacyPolicy", path: "/privacy-policy" },
      { tKey: "footer.terms", path: "/terms" },
    ],
  },
];

const HamburgerMenu = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const loggedIn = isAuthenticated();

  const go = (item: Item) => {
    setOpen(false);
    if (item.href) window.location.href = item.href;
    else if (item.path) navigate(item.path);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={t("menu.openMenu")}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-accent/60 transition-colors"
        >
          <Menu size={22} className="text-foreground" strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] sm:w-[380px] p-0 border-r border-border bg-background flex flex-col [&>button]:hidden"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <button
            onClick={() => { setOpen(false); navigate("/"); }}
            className="flex items-center gap-2"
          >
            <img src={ciraLogo.src} alt="Cira" width={28} height={28} />
            <span className="font-heading text-xl font-semibold text-foreground">Cira</span>
          </button>
          <button
            onClick={() => setOpen(false)}
            aria-label={t("menu.closeMenu")}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent/60 transition-colors"
          >
            <X size={16} className="text-foreground" />
          </button>
        </div>

        <div className="px-6 pb-4">
          <button
            onClick={() => { setOpen(false); navigate(loggedIn ? "/chat" : "/free-chat"); }}
            className="w-full flex items-center gap-3 py-3 text-primary font-body font-medium"
          >
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Plus size={14} strokeWidth={2.5} />
            </span>
            <span>{t("menu.newChat")}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {sections.map((section) => (
            <div key={section.titleKey} className="border-t border-border/60 px-6 py-5">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3 font-body">
                {t(section.titleKey)}
              </h4>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.tKey}>
                    <button
                      onClick={() => go(item)}
                      className="w-full flex items-center justify-between py-2.5 text-[15px] font-body text-foreground hover:text-primary transition-colors"
                    >
                      <span>{t(item.tKey)}</span>
                      <ChevronRight size={16} className="text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border/60 px-6 py-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
            <Lock size={11} />
            <span>{t("menu.hipaaPrivate")}</span>
          </div>
          {!loggedIn && (
            <button
              onClick={() => { setOpen(false); navigate("/login"); }}
              className="px-4 py-2 rounded-lg border border-border text-sm font-body font-medium text-foreground hover:bg-accent/60 transition-colors"
            >
              {t("nav.login")}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-border text-sm font-body text-foreground hover:bg-accent/60 transition-colors">
                <span className="flex items-center gap-2">
                  <Globe size={14} className="text-muted-foreground" />
                  <span>{t("footer.language")}</span>
                </span>
                <span className="text-muted-foreground text-xs">
                  {SUPPORTED_LANGUAGES.find((l) => l.code === (i18n.language || "en").split("-")[0])?.label}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[240px] z-[100]">
              {SUPPORTED_LANGUAGES.map((l) => {
                const active = (i18n.language || "en").split("-")[0] === l.code;
                return (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <span>{l.label}</span>
                    {active && <Check size={14} className="text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-[10px] text-muted-foreground/70 font-body">v1.0.0</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HamburgerMenu;
