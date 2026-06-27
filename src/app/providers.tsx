"use client";

import { useEffect, useState } from "react";
import "@/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SecurityDeterrents from "@/components/SecurityDeterrents";
import InactivityTimeout from "@/components/InactivityTimeout";
import { initActivityTracker } from "@/lib/activityTracker";
import { initConsentSync } from "@/lib/consent";

import { HelmetProvider } from "react-helmet-async";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    initActivityTracker();
    initConsentSync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <TooltipProvider>
          {children}
          <Toaster />
          <Sonner />
          <SecurityDeterrents />
          <InactivityTimeout />
          <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
            <defs>
              <linearGradient id="ai-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f97316" />
              </linearGradient>
            </defs>
          </svg>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
