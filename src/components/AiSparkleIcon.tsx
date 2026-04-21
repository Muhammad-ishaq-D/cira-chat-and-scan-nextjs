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
      <svg width={0} height={0} className="absolute">
        <defs>
          <linearGradient id="ai-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
      </svg>
      <Sparkles
        size={size}
        strokeWidth={active ? 2 : 1.5}
        style={{ stroke: "url(#ai-sparkle-grad)" }}
      />
    </span>
  )
);

AiSparkleIcon.displayName = "AiSparkleIcon";

export default AiSparkleIcon;
