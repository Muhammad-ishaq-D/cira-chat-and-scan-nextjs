"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function CoiScripts() {
  const pathname = usePathname();
  // Don't load COI service worker on auth pages to avoid breaking Google Sign-In
  const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname?.startsWith("/login") || pathname?.startsWith("/register");
  
  if (isAuthPage) {
    return null;
  }
  
  return <Script src="/coi-serviceworker.js" strategy="beforeInteractive" />;
}
