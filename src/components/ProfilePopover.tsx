import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CreditCard, Scan, MessageCircle, Crown, ChevronRight, History, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { userApi } from "@/lib/apiClient";
import { getUser } from "@/lib/auth";

interface ProfilePopoverProps {
  children: React.ReactNode;
}

const ProfilePopover = ({ children }: ProfilePopoverProps) => {
  const navigate = useNavigate();
  const localUser = getUser();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await userApi.getProfile();
      setProfile(data);
    } catch {
      // fallback to local user
    } finally {
      setLoading(false);
    }
  };

  const name = profile?.name || localUser?.name || "User";
  const email = profile?.email || localUser?.email || "";
  const plan = profile?.plan || "Basic";
  const initials = name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const faceScans = profile?.credits?.face_scans ?? 2;
  const chatCredits = profile?.credits?.chat_credits ?? 100000;
  const chatDisplay = chatCredits >= 1000 ? `${Math.round(chatCredits / 1000)}K` : chatCredits;

  return (
    <Popover onOpenChange={(open) => open && loadProfile()}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent side="top" align="end" sideOffset={12} className="w-72 p-0 rounded-2xl border-border/60 shadow-xl bg-card/95 backdrop-blur-md">
        {/* User Info */}
        <div className="p-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-sm font-semibold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{name}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">{plan} Plan</span>
          </div>
        </div>

        {/* Credits */}
        <div className="p-4 space-y-3 border-b border-border/40">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Credits</p>
          {loading ? (
            <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Scan size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Face Scans</p>
                    <p className="text-[10px] text-muted-foreground">{faceScans === "Unlimited" ? "Unlimited" : `${faceScans} scans remaining`}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{faceScans}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                    <MessageCircle size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Chat Credits</p>
                    <p className="text-[10px] text-muted-foreground">{chatCredits >= 1000 ? `${chatDisplay} credits remaining` : `${chatCredits} credits remaining`}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{chatDisplay}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-2">
          <button
            onClick={() => navigate("/upgrade")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <Crown size={14} className="text-amber-600" />
            </div>
            <span className="text-xs font-medium text-foreground flex-1 text-left">Upgrade Plan</span>
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
          <button
            onClick={() => navigate("/payment-history")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
              <History size={14} className="text-emerald-600" />
            </div>
            <span className="text-xs font-medium text-foreground flex-1 text-left">Payment History</span>
            <ChevronRight size={14} className="text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProfilePopover;
