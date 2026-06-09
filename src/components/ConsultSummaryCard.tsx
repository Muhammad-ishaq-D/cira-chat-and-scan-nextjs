import { AlertTriangle, Shield, Stethoscope, Sparkles, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ConsultSummary } from "@/lib/chatApi";
import BookDoctorCTA from "./BookDoctorCTA";

const renderInline = (text: string, keyPrefix = "") => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={`${keyPrefix}-${i}`} className="font-semibold">{part.slice(2, -2)}</strong>;
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
};

// Detect numbered list items: "1. ...", "2) ...", supports inline runs like "1. foo 2. bar"
const splitNumberedItems = (text: string): string[] | null => {
  const trimmed = text.trim();
  // Split on patterns like " 1. " / " 2) " preceded by start or space
  const regex = /(?:^|\s)(\d+)[.)]\s+/g;
  const matches: { index: number; len: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(trimmed)) !== null) {
    matches.push({ index: m.index + (m[0].startsWith(" ") ? 1 : 0), len: m[0].trimStart().length });
  }
  if (matches.length < 2) return null;
  const items: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].len;
    const end = i + 1 < matches.length ? matches[i + 1].index : trimmed.length;
    items.push(trimmed.slice(start, end).trim());
  }
  return items.filter(Boolean);
};

const formatText = (text: string | undefined | null) => {
  if (!text || typeof text !== "string") return null;
  const cleaned = text.replace(/\\n/g, "\n");

  // Split by blank lines into blocks; within each block detect lists
  const blocks = cleaned.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, bi) => {
        // First try newline-separated numbered items
        const lineItems = block.split(/\n+/).map((l) => l.trim()).filter(Boolean);
        const allNumbered = lineItems.length > 1 && lineItems.every((l) => /^\d+[.)]\s+/.test(l));
        let items: string[] | null = allNumbered
          ? lineItems.map((l) => l.replace(/^\d+[.)]\s+/, ""))
          : splitNumberedItems(block);

        if (items && items.length > 1) {
          return (
            <ol key={bi} className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex-none w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-[12px] leading-relaxed">{renderInline(item, `${bi}-${i}`)}</span>
                </li>
              ))}
            </ol>
          );
        }

        // Bullet list (-, •, *)
        const bulletItems = lineItems.filter((l) => /^[-•*]\s+/.test(l));
        if (bulletItems.length > 1 && bulletItems.length === lineItems.length) {
          return (
            <ul key={bi} className="space-y-1.5">
              {bulletItems.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <span className="flex-none w-1 h-1 rounded-full bg-primary mt-2" />
                  <span className="flex-1 text-[12px] leading-relaxed">
                    {renderInline(item.replace(/^[-•*]\s+/, ""), `${bi}-${i}`)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        // Plain paragraph (preserve internal single line breaks)
        return (
          <p key={bi} className="text-[12px] leading-relaxed whitespace-pre-line">
            {renderInline(block, `${bi}`)}
          </p>
        );
      })}
    </div>
  );
};

interface Props {
  data: ConsultSummary;
}

const ConsultSummaryCard = ({ data }: Props) => {
  const { t } = useTranslation();
  const confidenceColor =
    data.confidence_score >= 85
      ? "text-emerald-600 bg-emerald-50"
      : data.confidence_score >= 60
      ? "text-amber-600 bg-amber-50"
      : "text-red-500 bg-red-50";

  const urgencyLevel = data.confidence_score >= 80 ? "high" : data.confidence_score >= 50 ? "moderate" : "low";
  const urgencyConfig = {
    high: { label: t("components.consultSummary.clearFinding"), bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700" },
    moderate: { label: t("components.consultSummary.needsAttention"), bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700" },
    low: { label: t("components.consultSummary.uncertain"), bg: "bg-red-50", border: "border-red-200", text: "text-red-700" },
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
                {t("components.consultSummary.assessment")}
              </p>
              <p className="text-[9px] text-muted-foreground">{t("components.consultSummary.subtitle")}</p>
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
          <div className="text-[12px] text-foreground leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {formatText(data.summary)}
          </div>
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
              <div className="text-[12px] text-foreground leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                {formatText(data.self_care_advice)}
              </div>
            </div>
          </div>
        </div>


        <BookDoctorCTA source="consult_summary_card" />

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
