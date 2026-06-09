import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logout, isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

/**
 * HIPAA Compliance: Automatic Logoff
 * Logs out the user after 15 minutes of inactivity.
 */
const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes in milliseconds

const InactivityTimeout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    if (isAuthenticated()) {
      logout();
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity for your protection.",
      });
      navigate("/login");
    }
  }, [navigate, toast]);

  useEffect(() => {
    // Only track inactivity if the user is logged in
    if (!isAuthenticated()) return;

    // Public pages don't need timeout (privacy, terms, etc.)
    const publicPaths = ["/", "/login", "/register", "/privacy", "/terms", "/how-it-works", "/technology"];
    if (publicPaths.includes(location.pathname)) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    // Events that signify "activity"
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click"
    ];

    // Initial start
    resetTimer();

    // Add listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [location.pathname, handleLogout]);

  return null; // This is a logic-only component
};

export default InactivityTimeout;
