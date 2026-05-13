import { forwardRef } from "react";
import { Sparkles } from "lucide-react";

interface AiSparkleIconProps {
  size?: number;
  active?: boolean;
  thinking?: boolean;
}

const AiSparkleIcon = forwardRef<HTMLSpanElement, AiSparkleIconProps>(
  ({ size = 18, active = false, thinking = false }, ref) => (
    <span ref={ref} className={`relative inline-flex items-center justify-center icon-ai-glow ${thinking ? "animate-ai-thinking" : ""}`}>
      <Sparkles
        size={size}
        strokeWidth={active ? 2 : 1.5}
        className={active ? "text-primary" : "text-muted-foreground"}
        style={{ stroke: active ? "url(#ai-sparkle-grad)" : "currentColor" }}
      />
    </span>
  )
);

AiSparkleIcon.displayName = "AiSparkleIcon";

export default AiSparkleIcon;
