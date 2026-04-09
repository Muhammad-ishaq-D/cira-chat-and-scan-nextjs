import { Printer, Download, ClipboardList, AlertTriangle, Stethoscope, Pill, ShieldCheck, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef } from "react";

export interface DoctorReportPayload {
  patient_name: string;
  date: string;
  summary: string;
  findings: string;
  recommendations: string;
  // Optional extended fields the agent may include
  chief_complaint?: string;
  vitals?: Record<string, string | number>;
  possible_conditions?: { name: string; percentage: number }[];
  medications?: string[];
  follow_up?: string;
  red_flags?: string[];
}

interface Props {
  data: DoctorReportPayload;
  onSaved?: () => void;
}

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

const DoctorReportCard = ({ data }: Props) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Cira Health Report — ${data.patient_name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 40px; color: #1a1a1a; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 24px; }
            .title { font-size: 20px; font-weight: 700; color: #6366f1; }
            .meta { font-size: 12px; color: #666; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6366f1; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
            .text { font-size: 13px; line-height: 1.6; color: #333; white-space: pre-line; }
            .condition { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 20px; background: #f0f0ff; font-size: 12px; margin: 3px 4px 3px 0; }
            .pct { font-weight: 700; color: #6366f1; }
            .med { display: inline-block; padding: 3px 10px; border-radius: 12px; background: #eff6ff; color: #2563eb; font-size: 11px; margin: 2px 4px 2px 0; }
            .redflag { padding: 3px 0; font-size: 12px; color: #dc2626; }
            .disclaimer { margin-top: 24px; padding: 12px; background: #fefce8; border-radius: 8px; font-size: 11px; color: #92400e; }
            .vitals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
            .vital { padding: 8px 12px; background: #f9fafb; border-radius: 8px; }
            .vital-label { font-size: 10px; color: #666; text-transform: uppercase; }
            .vital-value { font-size: 14px; font-weight: 600; }
            @media print { body { padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🩺 Cira Health Report</div>
            <div class="meta"><strong>${data.patient_name}</strong><br/>${data.date}</div>
          </div>
          <div class="section">
            <div class="section-title">Summary</div>
            <div class="text">${data.summary}</div>
          </div>
          ${data.chief_complaint ? `<div class="section"><div class="section-title">Chief Complaint</div><div class="text">${data.chief_complaint}</div></div>` : ""}
          ${data.vitals ? `<div class="section"><div class="section-title">Vitals</div><div class="vitals-grid">${Object.entries(data.vitals).map(([k, v]) => `<div class="vital"><div class="vital-label">${k.replace(/_/g, " ")}</div><div class="vital-value">${v}</div></div>`).join("")}</div></div>` : ""}
          <div class="section">
            <div class="section-title">Clinical Findings</div>
            <div class="text">${data.findings}</div>
          </div>
          ${data.possible_conditions?.length ? `<div class="section"><div class="section-title">Possible Conditions</div>${data.possible_conditions.map(c => `<span class="condition">${c.name} <span class="pct">${c.percentage}%</span></span>`).join("")}</div>` : ""}
          <div class="section">
            <div class="section-title">Recommendations</div>
            <div class="text">${data.recommendations}</div>
          </div>
          ${data.medications?.length ? `<div class="section"><div class="section-title">Suggested Medications</div>${data.medications.map(m => `<span class="med">${m}</span>`).join("")}</div>` : ""}
          ${data.follow_up ? `<div class="section"><div class="section-title">Follow-up</div><div class="text">${data.follow_up}</div></div>` : ""}
          ${data.red_flags?.length ? `<div class="section"><div class="section-title" style="color:#dc2626;border-color:#fecaca">⚠ Red Flags</div>${data.red_flags.map(r => `<div class="redflag">⚠ ${r}</div>`).join("")}</div>` : ""}
          <div class="disclaimer">⚕️ AI-generated report by Cira Health Nurse. Always consult a licensed healthcare provider for diagnosis and treatment.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    // Build plain-text report for download
    let text = `CIRA HEALTH REPORT\n${"=".repeat(40)}\n`;
    text += `Patient: ${data.patient_name}\nDate: ${data.date}\n\n`;
    text += `SUMMARY\n${"-".repeat(20)}\n${data.summary}\n\n`;
    if (data.chief_complaint) text += `CHIEF COMPLAINT\n${"-".repeat(20)}\n${data.chief_complaint}\n\n`;
    if (data.vitals) {
      text += `VITALS\n${"-".repeat(20)}\n`;
      Object.entries(data.vitals).forEach(([k, v]) => { text += `  ${k.replace(/_/g, " ")}: ${v}\n`; });
      text += "\n";
    }
    text += `FINDINGS\n${"-".repeat(20)}\n${data.findings}\n\n`;
    if (data.possible_conditions?.length) {
      text += `POSSIBLE CONDITIONS\n${"-".repeat(20)}\n`;
      data.possible_conditions.forEach(c => { text += `  • ${c.name}: ${c.percentage}%\n`; });
      text += "\n";
    }
    text += `RECOMMENDATIONS\n${"-".repeat(20)}\n${data.recommendations}\n\n`;
    if (data.medications?.length) text += `SUGGESTED MEDICATIONS\n${"-".repeat(20)}\n${data.medications.map(m => `  • ${m}`).join("\n")}\n\n`;
    if (data.follow_up) text += `FOLLOW-UP\n${"-".repeat(20)}\n${data.follow_up}\n\n`;
    if (data.red_flags?.length) text += `RED FLAGS\n${"-".repeat(20)}\n${data.red_flags.map(r => `  ⚠ ${r}`).join("\n")}\n\n`;
    text += `\n${"=".repeat(40)}\nAI-generated report by Cira. Consult a healthcare provider.\n`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cira-report-${data.patient_name.replace(/\s+/g, "-").toLowerCase()}-${data.date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-md animate-fade-in" ref={printRef}>
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50/80 via-blue-50/60 to-cyan-50/40 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center">
              <ClipboardList size={15} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">Cira Health Report</p>
              <p className="text-[9px] text-muted-foreground">For {data.patient_name} · {data.date}</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="px-4 py-3 bg-accent/20">
          <p className="text-[12px] text-foreground leading-relaxed">{data.summary}</p>
        </div>

        {/* Chief Complaint */}
        {data.chief_complaint && (
          <Section icon={Stethoscope} title="Chief Complaint">
            <p className="text-[12px] text-foreground leading-relaxed">{data.chief_complaint}</p>
          </Section>
        )}

        {/* Vitals */}
        {data.vitals && Object.keys(data.vitals).length > 0 && (
          <Section icon={TrendingUp} title="Vitals" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(data.vitals).map(([key, val]) => (
                <div key={key} className="bg-accent/30 rounded-lg p-2">
                  <p className="text-[9px] text-muted-foreground uppercase">{key.replace(/_/g, " ")}</p>
                  <p className="text-[13px] font-semibold text-foreground">{String(val)}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Findings */}
        <Section icon={ClipboardList} title="Clinical Findings">
          <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">{data.findings}</p>
        </Section>

        {/* Possible Conditions */}
        {data.possible_conditions && data.possible_conditions.length > 0 && (
          <Section icon={ShieldCheck} title="Possible Conditions">
            <div className="space-y-2">
              {data.possible_conditions.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-foreground">{c.name}</span>
                      <span className="text-[11px] font-bold text-primary">{c.percentage}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-accent overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all"
                        style={{ width: `${c.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Recommendations */}
        <Section icon={ShieldCheck} title="Recommendations">
          <p className="text-[12px] text-foreground leading-relaxed whitespace-pre-line">{data.recommendations}</p>
        </Section>

        {/* Medications */}
        {data.medications && data.medications.length > 0 && (
          <Section icon={Pill} title="Suggested Medications" defaultOpen={false}>
            <div className="flex flex-wrap gap-1.5">
              {data.medications.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium">{m}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Follow-up */}
        {data.follow_up && (
          <div className="px-4 py-2.5 bg-blue-50/50 border-t border-border/20">
            <p className="text-[10px] text-blue-700 font-medium">📅 Follow-up: {data.follow_up}</p>
          </div>
        )}

        {/* Red Flags */}
        {data.red_flags && data.red_flags.length > 0 && (
          <div className="px-4 py-3 bg-red-50/50 border-t border-red-100/50">
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertTriangle size={11} className="text-red-500" />
              <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Red Flags</p>
            </div>
            <ul className="space-y-1">
              {data.red_flags.map((rf, i) => (
                <li key={i} className="text-[11px] text-red-700 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">⚠</span>{rf}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-4 py-2 border-t border-border/20 bg-amber-50/50">
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-amber-500" />
            <p className="text-[9px] text-amber-700">AI-generated report. Always consult a licensed healthcare provider.</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-t border-border/30 flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 h-9 rounded-xl border border-border/60 text-xs font-medium text-foreground hover:bg-accent transition-all flex items-center justify-center gap-1.5"
          >
            <Printer size={13} /> Print Report
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 h-9 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <Download size={13} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorReportCard;
