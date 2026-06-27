"use client";

import { Link, useLocation } from '@/lib/react-router-compat';
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft, Search } from "lucide-react";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <>
      <SEO path="/404" />
      <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted px-6 py-16">
        {/* Decorative blurred orbs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -left-32 h-80 w-80 rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-pink-400/20 blur-3xl"
        />

        <section className="relative z-10 mx-auto max-w-xl text-center">
          <p className="font-serif text-[7rem] leading-none tracking-tight text-foreground sm:text-[9rem]">
            <span className="bg-gradient-to-br from-primary via-pink-500 to-orange-400 bg-clip-text text-transparent">
              404
            </span>
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
            {t("notFound.title", "Page not found")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t(
              "notFound.message",
              "The page you're looking for doesn't exist or has been moved."
            )}
          </p>
          <p className="mt-2 break-all font-mono text-xs text-muted-foreground/70">
            {location.pathname}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                {t("notFound.returnHome", "Back to home")}
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link to="/free-chat">
                <Search className="mr-2 h-4 w-4" />
                {t("notFound.askCira", "Ask Cira")}
              </Link>
            </Button>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              {t("notFound.goBack", "Go back")}
            </button>
          </div>
        </section>
      </main>
    </>
  );
};

export default NotFound;
