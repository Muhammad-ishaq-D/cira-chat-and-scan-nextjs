import { useEffect } from "react";

/**
 * SecurityDeterrents component adds light deterrents to prevent casual code inspection.
 * Note: These can be bypassed by determined users and are purely cosmetic.
 */
const SecurityDeterrents = () => {
  useEffect(() => {
    let devToolsAlertShown = false;

    // ── DevTools detection ───────────────────────────────────────────────────
    // Technique: docked DevTools reduces window.innerWidth/Height compared to outerWidth/Height.
    // Threshold of 160px covers typical DevTools panel widths/heights.
    const isDevToolsOpen = (): boolean => {
      const widthGap = window.outerWidth - window.innerWidth > 160;
      const heightGap = window.outerHeight - window.innerHeight > 160;
      return widthGap || heightGap;
    };

    const handleDevToolsDetected = () => {
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

        // alert() is synchronous — overlay renders first, blocks everything beneath
        alert("🚫 Developer Tools detected. This page is not accessible with DevTools open.");

        // Redirect after OK is clicked — replace() removes page from history
        window.location.replace("about:blank");
      }
    };

    // Check immediately on page load (catches the case of pre-opened DevTools)
    if (isDevToolsOpen()) {
      handleDevToolsDetected();
    }

    // Poll every second to detect DevTools opened mid-session
    const pollInterval = setInterval(() => {
      if (isDevToolsOpen()) {
        handleDevToolsDetected();
      }
    }, 1000);

    // Also re-check whenever the window is resized (docking/undocking DevTools triggers resize)
    const handleResize = () => {
      if (isDevToolsOpen()) {
        handleDevToolsDetected();
      }
    };
    window.addEventListener("resize", handleResize);

    // ── Right-click ──────────────────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      alert("🚫 Right-click is disabled on this page.");
    };

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        alert("🚫 Developer Tools are disabled on this page.");
      }

      // Ctrl+Shift+I or Cmd+Option+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        alert("🚫 Developer Tools are disabled on this page.");
      }

      // Ctrl+Shift+J or Cmd+Option+J
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        alert("🚫 Developer Tools are disabled on this page.");
      }

      // Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        alert("🚫 Developer Tools are disabled on this page.");
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === "u") {
        e.preventDefault();
        alert("🚫 View Source is disabled on this page.");
      }

      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        alert("🚫 Saving is disabled on this page.");
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
  }, []);

  return null;
};

export default SecurityDeterrents;
