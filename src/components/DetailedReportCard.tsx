import { AlertTriangle, Activity, Heart, Brain, Pill, Stethoscope, ClipboardList, ShieldCheck, TrendingUp, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import BookDoctorCTA from "./BookDoctorCTA";

export interface DetailedReport {
  patient_summary: string;
  chief_complaint: string;
  history_of_present_illness: string;
  review_of_systems: {
    system: string;
    findings: string;
  }[];
  assessment: {
    primary_diagnosis: string;
    differential_diagnoses: { name: string; likelihood: string }[];
    severity: "mild" | "moderate" | "severe";
  };
  plan: {
    immediate_actions: string[];
    medications_suggested: string[];
    lifestyle_recommendations: string[];
    follow_up: string;
  };
  red_flags: string[];
  confidence_score: number;
}

interface Props {
  data: DetailedReport;
}

const severityConfig = {
  mild: { color: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Mild" },
  moderate: { color: "text-amber-600 bg-amber-50 border-amber-200", label: "Moderate" },
  severe: { color: "text-red-600 bg-red-50 border-red-200", label: "Severe" },
};

const likelihoodColor = (l: string) => {
  const lower = l.toLowerCase();
  if (lower === "high" || lower === "likely") return "bg-red-100 text-red-700";
  if (lower === "moderate" || lower === "possible") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const Section = ({ icon: Icon, title, children, defaultOpen = true }: { icon: any; title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/20 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-accent/30 transition-colors"
      >
        <Icon size={13} className="text-primary shrink-0" />
        <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider flex-1 text-left">{title}</span>
        {open ? <ChevronUp size={12} className="text-muted-foreground" /> : <ChevronDown size={12} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
};

const DetailedReportCard = ({ data }: Props) => {
  const severity = severityConfig[data.assessment.severity] || severityConfig.moderate;
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
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-pink-50/40 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <ClipboardList size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                Detailed Health Assessment
              </p>
              <p className="text-[9px] text-muted-foreground">Comprehensive AI Clinical Report</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${severity.color}`}>
                {severity.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${confidenceColor}`}>
                {data.confidence_score}%
              </span>
            </div>
          </div>
        </div>

        {/* Patient Summary */}
        <div className="px-4 py-3 bg-accent/20">
          <p className="text-[12px] text-foreground leading-relaxed" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
            {data.patient_summary}
          </p>
        </div>

        {/* Chief Complaint */}
        <Section icon={Stethoscope} title="Chief Complaint">
          <p className="text-[12px] text-foreground leading-relaxed">{data.chief_complaint}</p>
        </Section>

        {/* History */}
        <Section icon={Activity} title="History of Present Illness" defaultOpen={false}>
          <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">{data.history_of_present_illness}</p>
        </Section>

        {/* Review of Systems */}
        {data.review_of_systems?.length > 0 && (
          <Section icon={Heart} title="Review of Systems" defaultOpen={false}>
            <div className="space-y-1.5">
              {data.review_of_systems.map((ros, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-[10px] font-semibold text-primary min-w-[80px] shrink-0">{ros.system}</span>
                  <span className="text-[11px] text-foreground">{ros.findings}</span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Assessment */}
        <Section icon={Brain} title="Assessment">
          <div className="space-y-2.5">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium mb-1">Primary Diagnosis</p>
              <p className="text-[13px] font-semibold text-foreground">{data.assessment.primary_diagnosis}</p>
            </div>
            {data.assessment.differential_diagnoses?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1.5">Differential Diagnoses</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.assessment.differential_diagnoses.map((dx, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${likelihoodColor(dx.likelihood)}`}>
                      {dx.name}
                      <span className="opacity-60">· {dx.likelihood}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Plan */}
        <Section icon={TrendingUp} title="Treatment Plan">
          <div className="space-y-3">
            {data.plan.immediate_actions?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Immediate Actions</p>
                <ul className="space-y-1">
                  {data.plan.immediate_actions.map((a, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="text-[11px] text-foreground">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.plan.medications_suggested?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1 flex items-center gap-1">
                  <Pill size={10} /> Suggested Medications
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.plan.medications_suggested.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}
            {data.plan.lifestyle_recommendations?.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">Lifestyle Recommendations</p>
                <ul className="space-y-1">
                  {data.plan.lifestyle_recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <ShieldCheck size={10} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-[11px] text-foreground">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.plan.follow_up && (
              <div className="bg-blue-50/50 rounded-lg p-2.5">
                <p className="text-[10px] text-blue-700 font-medium">📅 Follow-up: {data.plan.follow_up}</p>
              </div>
            )}
          </div>
        </Section>

        {/* Red Flags */}
        {data.red_flags?.length > 0 && (
          <div className="px-4 py-3 bg-red-50/50 border-t border-red-100/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={11} className="text-red-500" />
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Red Flags — Seek Immediate Care If</p>
            </div>
            <ul className="space-y-1">
              {data.red_flags.map((rf, i) => (
                <li key={i} className="text-[11px] text-red-700 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  {rf}
                </li>
              ))}
            </ul>
          </div>
        )}

        <BookDoctorCTA source="detailed_report_card" />

        {/* Disclaimer */}
        <div className="px-4 py-2 border-t border-border/20 bg-amber-50/50">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-amber-500" />
            <p className="text-[9px] text-amber-700">
              AI-generated report. Always consult a licensed healthcare provider for diagnosis and treatment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailedReportCard;