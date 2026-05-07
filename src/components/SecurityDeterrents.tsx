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

    const handleDevToolsDetected = (customMsg?: string) => {
      // Skip if developer mode is already active
      if (sessionStorage.getItem("cira_dev_mode") === "true") return;

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
        
        const correctKey = import.meta.env.VITE_DEVELOPER_KEY;

        if (devKey === correctKey && correctKey) {
          sessionStorage.setItem("cira_dev_mode", "true");
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
    if (isDevToolsOpen() && sessionStorage.getItem("cira_dev_mode") !== "true") {
      handleDevToolsDetected();
    }

    // Poll every second to detect DevTools opened mid-session
    const pollInterval = setInterval(() => {
      if (isDevToolsOpen() && sessionStorage.getItem("cira_dev_mode") !== "true") {
        handleDevToolsDetected();
      }
    }, 1000);

    // Also re-check whenever the window is resized (docking/undocking DevTools triggers resize)
    const handleResize = () => {
      if (isDevToolsOpen() && sessionStorage.getItem("cira_dev_mode") !== "true") {
        handleDevToolsDetected();
      }
    };
    window.addEventListener("resize", handleResize);

    // ── Right-click ──────────────────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      if (sessionStorage.getItem("cira_dev_mode") === "true") return;
      e.preventDefault();
      handleDevToolsDetected("🚫 Right-click is disabled. Enter developer key to continue:");
    };

    // ── Keyboard shortcuts ───────────────────────────────────────────────────
    const handleKeyDown = (e: KeyboardEvent) => {
      if (sessionStorage.getItem("cira_dev_mode") === "true") return;

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
  }, []);

  return null;
};

export default SecurityDeterrents;
