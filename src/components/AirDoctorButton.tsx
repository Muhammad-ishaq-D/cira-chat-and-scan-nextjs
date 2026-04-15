import { Stethoscope } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getDeviceId } from "@/lib/freeCredits";

const AIR_DOCTOR_URL = "https://airdoctor.biz/Cira";

const AirDoctorButton = () => {
  const handleClick = () => {
    // Collect tracking details
    const user = getUser();
    const trackingData = {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      userName: user?.name || null,
      userEmail: user?.email || null,
      userPlan: (user as any)?.plan || "free",
      deviceId: getDeviceId(),
      page: window.location.pathname,
      source: "floating_button",
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    };

    // Log to console for debugging & analytics
    console.log("[AirDoctor] Referral click:", trackingData);

    // Send tracking event to backend (fire-and-forget)
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
      fetch(`${API_BASE}/api/tracking/airdoctor-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      }).catch(() => {/* silent fail */});
    } catch {/* silent */}

    // Also store in localStorage for local analytics
    try {
      const clicks = JSON.parse(localStorage.getItem("cira_airdoctor_clicks") || "[]");
      clicks.push(trackingData);
      localStorage.setItem("cira_airdoctor_clicks", JSON.stringify(clicks.slice(-100)));
    } catch {/* silent */}

    // Open in new tab
    window.open(AIR_DOCTOR_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 animate-fade-in"
      title="Book a Doctor Appointment"
    >
      <Stethoscope size={16} />
      <span className="hidden sm:inline">Book a Doctor</span>
      <span className="sm:hidden">Doctor</span>
    </button>
  );
};

export default AirDoctorButton;
