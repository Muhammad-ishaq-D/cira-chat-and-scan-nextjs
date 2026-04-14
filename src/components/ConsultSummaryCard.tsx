import { AlertTriangle, Shield, Stethoscope, Sparkles, ChevronRight } from "lucide-react";
import type { ConsultSummary } from "@/lib/chatApi";

const formatText = (text: string) => {
  // Replace literal \n with real newlines, then parse markdown bold
  const cleaned = text.replace(/\\n/g, "\n");
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    return part;
  });
};

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

  const urgencyLevel = data.confidence_score >= 80 ? "high" : data.confidence_score >= 50 ? "moderate" : "low";
  const urgencyConfig = {
    high: { label: "Clear Finding", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
    moderate: { label: "Needs Attention", bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    low: { label: "Uncertain", bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
  };
  const urgency = urgencyConfig[urgencyLevel];

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/30 bg-gradient-to-r from-blue-50/80 via-cyan-50/60 to-emerald-50/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Stethoscope size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Quick Assessment
              </p>
              <p className="text-[9px] text-muted-foreground">AI Triage Summary</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${urgency.bg} ${urgency.border} ${urgency.text}`}>
                {urgency.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${confidenceColor}`}>
                {data.confidence_score}%
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-3 bg-accent/10">
          <p className="text-[12px] text-foreground leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {formatText(data.summary)}
          </p>
        </div>

        {/* Possible Conditions */}
        <div className="px-4 pb-3 pt-2">
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
        <div className="px-4 pb-3 border-t border-border/20 pt-3">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={12} className="text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                What to Do Next
              </p>
              <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {formatText(data.self_care_advice)}
              </p>
            </div>
          </div>
        </div>


        <div className="px-4 py-2 border-t border-border/20 bg-amber-50/50">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-amber-500" />
            <p className="text-[9px] text-amber-700">
              AI triage — not a diagnosis. Always consult a licensed healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultSummaryCard;
