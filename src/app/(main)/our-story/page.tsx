"use client";

import { useTranslation } from "react-i18next";
import ciraLogo from "@/assets/cira-logo.svg";
import founderPhoto from "@/assets/founder-jeanmarc.webp";
import realScan from "@/assets/real-scan.webp";
import { useNavigate } from '@/lib/react-router-compat';
import SEO from "@/components/SEO";

const OurStory = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <SEO path="/our-story" />
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-center gap-3 px-6 py-8">
        <img src={ciraLogo.src} alt="Cira health logo" width={28} height={28} />
        <span className="font-heading text-xl font-semibold text-foreground">{t("ourStory.header")}</span>
      </nav>

      <main className="max-w-[640px] mx-auto px-6 pb-24">
        <p className="text-xs text-primary text-center font-body mb-4 tracking-wide uppercase">
          {t("ourStory.label")}
        </p>

        <h1 className="font-heading text-[44px] font-semibold text-foreground leading-tight text-center mb-10 whitespace-pre-line">
          {t("ourStory.title")}
        </h1>

        <div className="flex flex-col items-center mb-12">
          <img
            src={founderPhoto}
            alt="Jean-Marc, Founder of Cira"
            className="w-32 h-32 rounded-full object-cover mb-4"
          />
          <p className="text-sm text-muted-foreground font-body text-center whitespace-pre-line">
            {t("ourStory.founderCaption")}
          </p>
        </div>

        <div className="max-w-[580px] mx-auto text-[17px] text-foreground font-body leading-[1.8] mb-16 whitespace-pre-line">
          {t("ourStory.body")}
        </div>

        <div className="max-w-[320px] mx-auto mb-4">
          <img
            src={realScan}
            alt="Real scan"
            className="w-full rounded-2xl shadow-lg"
          />
        </div>
        <p className="text-xs text-muted-foreground text-center font-body mb-10 whitespace-pre-line">
          {t("ourStory.scanCaption")}
        </p>

        <div className="border-l-4 border-primary bg-primary/5 rounded-r-2xl p-6 max-w-[560px] mx-auto text-left mb-16">
          <p className="text-sm text-foreground font-body leading-relaxed italic whitespace-pre-line">
            {t("ourStory.ciraQuote")}
          </p>
          <p className="text-xs text-primary font-body mt-3 font-medium">{t("ourStory.ciraAuthor")}</p>
        </div>

        <div className="border-t border-border mb-16" />

        <div className="text-center mb-16">
          <h2 className="font-heading text-[36px] font-semibold text-foreground leading-tight mb-6 whitespace-pre-line">
            {t("ourStory.wallTitle")}
          </h2>

          <p className="text-base text-muted-foreground leading-relaxed max-w-[480px] mx-auto font-body whitespace-pre-line mb-10">
            {t("ourStory.wallBody")}
          </p>

          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-3 px-8 rounded-xl text-base font-medium hover:opacity-90 transition-opacity font-body"
          >
            {t("ourStory.wallCta")}
          </button>
        </div>
      </main>

      <footer className="max-w-xl mx-auto px-6 pb-12 text-center text-xs text-muted-foreground space-y-2 font-body">
        <p>{t("ourStory.footer1")}</p>
        <p>{t("ourStory.footer2")}</p>
      </footer>
    </div>
    </>
  );
};

export default OurStory;
