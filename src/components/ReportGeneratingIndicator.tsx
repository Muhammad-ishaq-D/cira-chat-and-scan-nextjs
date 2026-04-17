import { FileText } from "lucide-react";
import AiSparkleIcon from "./AiSparkleIcon";

/**
 * Animated indicator shown while Cira is generating an assessment report.
 * Replaces the previous static "processing your information..." text with a
 * friendlier, shimmering progress card.
 */
export const ReportGeneratingIndicator = () => {
  return (
    <div className="max-w-[95%] md:max-w-[80%] animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <AiSparkleIcon size={20} active />
        <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          Cira
        </span>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm">
        {/* Shimmer overlay */}
        <div
          className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.08) 50%, transparent 100%)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <FileText size={16} className="text-primary animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] md:text-[15px] font-medium text-foreground">
              Generating your assessment report
              <span className="inline-flex ml-0.5">
                <span className="animate-[bounce_1.4s_infinite] [animation-delay:0ms]">.</span>
                <span className="animate-[bounce_1.4s_infinite] [animation-delay:200ms]">.</span>
                <span className="animate-[bounce_1.4s_infinite] [animation-delay:400ms]">.</span>
              </span>
            </p>
            {/* Progress bar */}
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 animate-[slide-progress_1.6s_ease-in-out_infinite]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
