import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cira_consent_v1";

const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, at: Date.now() }));
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50">
      <div className="rounded-xl border border-border bg-card/95 backdrop-blur p-3 shadow-lg">
        <div className="flex items-start gap-2">
          <p className="text-[11px] leading-relaxed text-muted-foreground flex-1">
            Cira stores your health data to power your assessments. By using Cira you consent to processing
            of your vitals & chats. Not a medical service.
          </p>
          <button
            onClick={accept}
            aria-label="Dismiss"
            className="text-muted-foreground hover:text-foreground -mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="mt-2 flex justify-end">
          <Button size="sm" onClick={accept} className="h-7 px-3 text-xs">
            Got it
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConsentBanner;
