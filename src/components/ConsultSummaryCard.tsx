import { Activity, AlertTriangle, Heart, Shield, Sparkles } from "lucide-react";
import type { ConsultSummary } from "@/lib/chatApi";

interface Props {
  data: ConsultSummary;
}

const ConsultSummaryCard = ({ data }: Props) => {
  const confidenceColor =
    data.confidence_score >= 85
      ? "text-emerald-600 bg-emerald-50"
      : data.confidence_score >= 60
      ? "text-amber-600 bg-amber-50"
      : "text-red-500 bg-red-50";

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 bg-gradient-to-r from-purple-50/80 to-pink-50/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                AI Consultation Summary
              </p>
              <p className="text-[9px] text-muted-foreground">Powered by Cira</p>
            </div>
            <div className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${confidenceColor}`}>
              {data.confidence_score}% confident
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-3">
          <p className="text-[13px] text-foreground leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {data.summary}
          </p>
        </div>

        {/* Possible Conditions */}
        <div className="px-4 pb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Possible Conditions
          </p>
          <div className="space-y-2">
            {data.possible_conditions.map((cond, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[12px] font-medium text-foreground">{cond.name}</p>
                    <p className="text-[11px] font-bold text-primary">{cond.percentage}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
                      style={{ width: `${cond.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Self-Care Advice */}
        <div className="px-4 pb-4 border-t border-border/20 pt-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={12} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Self-Care & Red Flags
              </p>
              <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {data.self_care_advice}
              </p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 border-t border-border/20 bg-amber-50/50">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-amber-500" />
            <p className="text-[9px] text-amber-700">
              Always discuss these findings with a licensed medical professional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultSummaryCard;
