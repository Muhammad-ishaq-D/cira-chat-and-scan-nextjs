import { Stethoscope, Calendar, ChevronRight } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getDeviceId } from "@/lib/freeCredits";

const AIR_DOCTOR_URL = "https://airdoctor.biz/Cira";

interface Props {
  source?: string;
}

const BookDoctorCTA = ({ source = "report_card" }: Props) => {
  const handleClick = () => {
    const user = getUser();
    const trackingData = {
      timestamp: new Date().toISOString(),
      userId: user?.id || null,
      userName: user?.name || null,
      userEmail: user?.email || null,
      userPlan: (user as any)?.plan || "free",
      deviceId: getDeviceId(),
      page: window.location.pathname,
      source,
      referrer: document.referrer || null,
      userAgent: navigator.userAgent,
    };

    try {
      const API_BASE = import.meta.env.VITE_API_URL || "https://askainurse.com";
      fetch(`${API_BASE}/api/tracking/airdoctor-click`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trackingData),
      }).catch(() => {});
    } catch {}

    try {
      const clicks = JSON.parse(localStorage.getItem("cira_airdoctor_clicks") || "[]");
      clicks.push(trackingData);
      localStorage.setItem("cira_airdoctor_clicks", JSON.stringify(clicks.slice(-100)));
    } catch {}

    window.open(AIR_DOCTOR_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="px-4 py-3 border-t border-border/20 bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-emerald-50/40">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
          <Calendar size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground leading-tight">
            Talk to a licensed doctor
          </p>
          <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
            Online consultation, available now
          </p>
        </div>
      </div>
      <button
        onClick={handleClick}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[11px] font-semibold shadow-sm hover:shadow-md hover:scale-[1.01] transition-all active:scale-[0.99]"
      >
        <Stethoscope size={13} />
        <span>Book a Doctor Online</span>
        <ChevronRight size={13} />
      </button>
    </div>
  );
};

export default BookDoctorCTA;
