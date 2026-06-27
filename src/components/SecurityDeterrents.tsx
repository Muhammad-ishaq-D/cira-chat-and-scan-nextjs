"use client";

import { useEffect, useState } from "react";

/**
 * SecurityDeterrents component adds light deterrents to prevent casual code inspection.
 * Note: These can be bypassed by determined users and are purely cosmetic.
 */
const SecurityDeterrents = () => {
  const [correctKey, setCorrectKey] = useState<string | null>(null);

  useEffect(() => {
    // Fetch developer key from backend
    const fetchDevKey = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://askainurse.com";
        const res = await fetch(`${API_BASE}/api/guest/dev-key`);
        const data = await res.json();
        if (data.developerKey) {
          setCorrectKey(data.developerKey);
        }
      } catch (err) {
        console.error("Failed to fetch developer key:", err);
      }
    };
    fetchDevKey();
  }, []);

  useEffect(() => {
    // Only run deterrents on the production domain. Skip in Lovable preview,
    // localhost, and any other host to avoid false positives from editor panels.
    const host = window.location.hostname;
    const isProductionDomain =
      host === "askainurse.com" || host === "www.askainurse.com";
    if (!isProductionDomain) return;

    let devToolsAlertShown = false;

    const isDevModeActive = () => {
      const storedKey = localStorage.getItem("cira_dev_key");
      return storedKey && storedKey === correctKey;
    };

    // ── DevTools detection (size-gap heuristic disabled — too many false positives) ──
    const isDevToolsOpen = (): boolean => false;

    const handleDevToolsDetected = (customMsg?: string) => {
      // Skip if developer mode is already active
      if (isDevModeActive()) return;

      if (!devToolsAlertShown) {
        devToolsAlertShown = true;

        // Inject a full-screen overlay to block all page interaction behind the alert
        const overlay = document.createElement("div");
        overlay.id = "devtools-block-overlay";
        overlay.style.cssText = `
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.92);
          z-index: 2147483647;
          pointer-events: all;
          cursor: not-allowed;
          user-select: none;
        `;
        document.body.appendChild(overlay);

        // Use prompt instead of alert to allow key entry
        const defaultMsg = "🚫 Developer Tools detected. Enter developer key to continue, or click Cancel to exit:";
        const devKey = prompt(customMsg || defaultMsg);

        // Use the key fetched from backend
        if (devKey === correctKey && correctKey) {
          localStorage.setItem("cira_dev_key", devKey);
          overlay.remove();
          devToolsAlertShown = false;
          return; // Allow access
        } else if (devKey !== null) {
          alert("❌ Incorrect developer key.");
        }

        // Redirect after OK is clicked or wrong key entered
        window.location.replace("about:blank");
      }
    };

    // Check immediately on page load (catches the case of pre-opened DevTools)
    if (isDevToolsOpen() && !isDevModeActive()) {
      handleDevToolsDetected();
    }

    // Poll every second to detect DevTools opened mid-session
    const pollInterval = setInterval(() => {
      if (isDevToolsOpen() && !isDevModeActive()) {
        handleDevToolsDetected();
      }
    }, 1000);

    // Also re-check whenever the window is resized (docking/undocking DevTools triggers resize)
    const handleResize = () => {
      if (isDevToolsOpen() && !isDevModeActive()) {
        handleDevToolsDetected();
      }
    };
    window.addEventListener("resize", handleResize);

    // ── Right-click ──────────────────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      if (isDevModeActive()) return;
      e.preventDefault();
      handleDevToolsDetected("🚫 Right-click is disabled. Enter developer key to continue:");
    };

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDevModeActive()) return;

      const isInspector =
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"));

      const isViewSource = (e.ctrlKey || e.metaKey) && e.key === "u";
      const isSavePage = (e.ctrlKey || e.metaKey) && e.key === "s";

      if (isInspector || isViewSource || isSavePage) {
        e.preventDefault();
        const msg = isInspector ? "🚫 Developer Tools are disabled." : (isViewSource ? "🚫 View Source is disabled." : "🚫 Saving is disabled.");
        handleDevToolsDetected(`${msg} Enter developer key to continue:`);
      }
    };


    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [correctKey]); // Re-bind listeners if key changes (though it shouldn't)

  return null;
};

export default SecurityDeterrents;
