/**
 * Generate a branded Cira PDF from report data
 * Uses jsPDF for client-side PDF generation
 */
import jsPDF from "jspdf";

// Cira brand colors (HSL converted to RGB)
const COLORS = {
  primary: [196, 64, 157] as [number, number, number],       // hsl(319,65%,56%) → pink
  primaryLight: [251, 100, 182] as [number, number, number],  // lighter pink
  foreground: [30, 20, 46] as [number, number, number],      // dark purple-black
  muted: [130, 117, 107] as [number, number, number],        // muted text
  border: [220, 213, 206] as [number, number, number],       // light border
  background: [247, 244, 239] as [number, number, number],   // cream bg
  cardBg: [252, 250, 248] as [number, number, number],       // slightly off-white card
  white: [255, 255, 255] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  emeraldLight: [209, 250, 229] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberLight: [254, 243, 199] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  redLight: [254, 226, 226] as [number, number, number],
  purple: [158, 29, 244] as [number, number, number],
  purpleLight: [243, 232, 255] as [number, number, number],
};

function drawLine(doc: jsPDF, y: number, x1 = 20, x2 = 190) {
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
}

function checkPage(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 275) {
    doc.addPage();
    return 20;
  }
  return y;
}

function addSection(doc: jsPDF, title: string, y: number): number {
  y = checkPage(doc, y, 15);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text(title.toUpperCase(), 20, y);
  y += 2;
  drawLine(doc, y, 20, 190);
  y += 6;
  doc.setTextColor(...COLORS.foreground);
  return y;
}

function addParagraph(doc: jsPDF, text: string, y: number, indent = 20): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.foreground);
  const lines = doc.splitTextToSize(text || "—", 165);
  for (const line of lines) {
    y = checkPage(doc, y);
    doc.text(line, indent, y);
    y += 4.5;
  }
  return y;
}

function addBullet(doc: jsPDF, text: string, y: number): number {
  y = checkPage(doc, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.foreground);
  doc.text("•", 24, y);
  const lines = doc.splitTextToSize(text, 155);
  for (const line of lines) {
    y = checkPage(doc, y);
    doc.text(line, 30, y);
    y += 4.5;
  }
  return y;
}

async function addHeader(doc: jsPDF, title: string, type: string, date: string) {
  // Top gradient bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 4, "F");
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(140, 0, 70, 4, "F");

  // Real Cira logo
  await drawCiraLogoImage(doc, 18, 8, 12);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.foreground);
  doc.text("Cira", 33, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  doc.text("AI Health Nurse", 33, 21);

  // Format date
  const formattedDate = (() => {
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch {}
    return date;
  })();

  // Right side: report type badge
  const badgeW = 40;
  drawRoundedRect(doc, 190 - badgeW, 8, badgeW, 7, 2, COLORS.purpleLight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.purple);
  doc.text(type.toUpperCase(), 190 - badgeW / 2, 13, { align: "center" });

  // Date below badge
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(formattedDate, 190 - badgeW / 2, 19, { align: "center" });

  // Separator
  drawLine(doc, 26, 18, 192);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.foreground);
  const titleLines = doc.splitTextToSize(title, 170);
  let y = 34;
  for (const line of titleLines) {
    doc.text(line, 20, y);
    y += 6;
  }

  return y + 2;
}

function addFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);

    // Disclaimer box
    const disclaimerY = 276;
    drawRoundedRect(doc, 15, disclaimerY, 180, 12, 2, COLORS.cardBg, COLORS.border);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.primary);
    doc.text("MEDICAL DISCLAIMER", 20, disclaimerY + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("Cira is an AI health nurse, not a licensed medical professional. This report is for informational purposes only.", 20, disclaimerY + 7.5);
    doc.text("Always discuss these findings with your doctor. Trained on peer-reviewed medical data worldwide.", 20, disclaimerY + 10.5);

    // Bottom bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 294, 210, 3, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("Generated by Cira  •  askainurse.com", 105, 292, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, 192, 292, { align: "right" });
  }
}

export async function generateQuickAssessmentPdf(report: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const data = report.data || {};
  const date = report.date || report.created_at || new Date().toLocaleDateString();

  let y = await addHeader(doc, report.title || "Quick Assessment Report", "Quick Assessment", date);

  // Summary
  y = addSection(doc, "Summary", y);
  y = addParagraph(doc, data.summary || report.summary || "", y);
  y += 4;

  // Possible Conditions — with progress bars
  if (data.possible_conditions?.length) {
    y = addSection(doc, "Possible Conditions", y);
    y += 2;
    for (const cond of data.possible_conditions) {
      y = checkPage(doc, y, 14);

      // Condition name — left
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.foreground);
      doc.text(cond.name || "", 20, y);

      // Percentage — right aligned
      const pct = cond.percentage ?? 0;
      const pctColor = pct >= 60 ? COLORS.emerald : pct >= 30 ? COLORS.amber : COLORS.red;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...pctColor);
      doc.text(`${pct}%`, 190, y, { align: "right" });

      // Progress bar
      y += 3;
      drawRoundedRect(doc, 20, y, 170, 2, 1, COLORS.background);
      if (pct > 0) {
        const fillW = Math.max(2, (pct / 100) * 170);
        drawRoundedRect(doc, 20, y, fillW, 2, 1, pctColor);
      }
      y += 5;

      if (cond.likelihood) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.muted);
        doc.text(`Likelihood: ${cond.likelihood}`, 20, y);
        y += 4;
      }

      if (cond.explanation) {
        y = addParagraph(doc, cond.explanation, y, 20);
      }
      y += 5;
    }
    y += 2;
  }

  // Recommended Actions
  if (data.recommended_actions?.length) {
    y = addSection(doc, "Recommended Actions", y);
    for (const action of data.recommended_actions) {
      y = addBullet(doc, action, y);
    }
    y += 4;
  }

  // Follow-up
  if (data.follow_up) {
    y = addSection(doc, "Follow-Up", y);
    y = addParagraph(doc, data.follow_up, y);
  }

  if (data.confidence_score != null) {
    y = checkPage(doc, y, 24);
    y += 6;

    const score = data.confidence_score;
    const scoreColor = score >= 80 ? COLORS.emerald : score >= 50 ? COLORS.amber : COLORS.red;
    const scoreBg = score >= 80 ? COLORS.emeraldLight : score >= 50 ? COLORS.amberLight : COLORS.redLight;

    // Centered confidence display
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text("AI CONFIDENCE", 105, y, { align: "center" });
    y += 6;

    // Large score number centered
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...scoreColor);
    doc.text(`${score}%`, 105, y, { align: "center" });
    y += 5;

    // Pill-shaped gauge bar centered
    const gaugeW = 80;
    const gaugeX = 105 - gaugeW / 2;
    drawRoundedRect(doc, gaugeX, y, gaugeW, 3, 1.5, scoreBg);
    const fillW = Math.max(3, (score / 100) * gaugeW);
    drawRoundedRect(doc, gaugeX, y, fillW, 3, 1.5, scoreColor);

    y += 10;
  }

  addFooter(doc);
  return doc;
}

export async function generateDetailedReportPdf(report: any) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const data = report.data || {};
  const date = report.date || report.created_at || new Date().toLocaleDateString();

  let y = await addHeader(doc, report.title || "Detailed Assessment Report", "Detailed Assessment", date);

  // Patient Summary
  if (data.patient_summary) {
    y = addSection(doc, "Patient Summary", y);
    y = addParagraph(doc, data.patient_summary, y);
    y += 4;
  }

  // Chief Complaint
  if (data.chief_complaint) {
    y = addSection(doc, "Chief Complaint", y);
    y = addParagraph(doc, data.chief_complaint, y);
    y += 4;
  }

  // HPI
  if (data.history_of_present_illness) {
    y = addSection(doc, "History of Present Illness", y);
    y = addParagraph(doc, data.history_of_present_illness, y);
    y += 4;
  }

  // Review of Systems
  if (data.review_of_systems?.length) {
    y = addSection(doc, "Review of Systems", y);
    for (const ros of data.review_of_systems) {
      y = checkPage(doc, y, 10);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.text(ros.system || "", 24, y);
      y += 4.5;
      y = addParagraph(doc, ros.findings || "", y, 28);
      y += 2;
    }
    y += 2;
  }

  // Assessment
  if (data.assessment) {
    y = addSection(doc, "Assessment", y);
    if (data.assessment.primary_diagnosis) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Primary Diagnosis:", 24, y);
      doc.setFont("helvetica", "normal");
      doc.text(data.assessment.primary_diagnosis, 60, y);
      y += 5;
    }
    if (data.assessment.severity) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Severity:", 24, y);
      doc.setFont("helvetica", "normal");
      const sev = data.assessment.severity;
      const sevColor = sev === "severe" ? COLORS.red : sev === "moderate" ? COLORS.amber : COLORS.emerald;
      doc.setTextColor(...sevColor);
      doc.text(sev.charAt(0).toUpperCase() + sev.slice(1), 45, y);
      doc.setTextColor(...COLORS.foreground);
      y += 5;
    }
    if (data.assessment.differential_diagnoses?.length) {
      y += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Differential Diagnoses:", 24, y);
      y += 5;
      for (const dd of data.assessment.differential_diagnoses) {
        y = addBullet(doc, `${dd.name}${dd.likelihood ? ` — ${dd.likelihood}` : ""}`, y);
      }
    }
    y += 4;
  }

  // Plan
  if (data.plan) {
    y = addSection(doc, "Treatment Plan", y);

    if (data.plan.immediate_actions?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Immediate Actions", 24, y);
      y += 5;
      for (const a of data.plan.immediate_actions) y = addBullet(doc, a, y);
      y += 3;
    }
    if (data.plan.medications_suggested?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Medications Suggested", 24, y);
      y += 5;
      for (const m of data.plan.medications_suggested) y = addBullet(doc, m, y);
      y += 3;
    }
    if (data.plan.lifestyle_recommendations?.length) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Lifestyle Recommendations", 24, y);
      y += 5;
      for (const l of data.plan.lifestyle_recommendations) y = addBullet(doc, l, y);
      y += 3;
    }
    if (data.plan.follow_up) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      y = checkPage(doc, y);
      doc.text("Follow-Up", 24, y);
      y += 5;
      y = addParagraph(doc, data.plan.follow_up, y, 28);
    }
    y += 4;
  }

  // Red Flags
  if (data.red_flags?.length) {
    y = addSection(doc, "⚠ Red Flags", y);
    for (const flag of data.red_flags) {
      y = checkPage(doc, y);
      doc.setTextColor(...COLORS.red);
      y = addBullet(doc, flag, y);
      doc.setTextColor(...COLORS.foreground);
    }
    y += 4;
  }

  // Confidence Score — graphical gauge
  if (data.confidence_score != null) {
    y = checkPage(doc, y, 20);
    y += 4;
    drawRoundedRect(doc, 20, y - 2, 170, 14, 2, COLORS.cardBg, COLORS.border);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.foreground);
    doc.text("AI Confidence Score", 24, y + 3);

    const score = data.confidence_score;
    const scoreColor = score >= 80 ? COLORS.emerald : score >= 50 ? COLORS.amber : COLORS.red;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...scoreColor);
    doc.text(`${score}%`, 186, y + 3, { align: "right" });

    const gaugeY = y + 7;
    drawRoundedRect(doc, 24, gaugeY, 162, 2, 1, COLORS.background);
    const fillW = Math.max(3, (score / 100) * 162);
    drawRoundedRect(doc, 24, gaugeY, fillW, 2, 1, scoreColor);

    y += 16;
  }

  addFooter(doc);
  return doc;
}

export async function downloadReportPdf(report: any) {
  const isDetailed = (report.type || "").toLowerCase().includes("detailed");
  const doc = isDetailed
    ? await generateDetailedReportPdf(report)
    : await generateQuickAssessmentPdf(report);

  const filename = `Cira_${(report.type || "Report").replace(/\s+/g, "_")}_${report.id || Date.now()}.pdf`;
  doc.save(filename);
}

// ─── Vitals Scan PDF ────────────────────────────────────────────

interface VitalScanData {
  id?: string;
  created_at?: string;
  date?: string;
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  hrv_sdnn?: number;
  breathing_rate?: number;
  stress_index?: number;
  cardiac_workload?: number;
  parasympathetic_activity?: number;
  bmi?: number;
  vascular_age?: number;
  wellness_score?: number;
  waist_to_height_ratio?: number;
  body_fat_percentage?: number;
  basal_metabolic_rate?: number;
  body_shape_index?: number;
  total_daily_energy_expenditure?: number;
  cv_disease_risk?: number;
  coronary_heart_disease_risk?: number;
  stroke_risk?: number;
  heart_failure_risk?: number;
  diabetes_risk?: number;
  fatty_liver_risk?: number;
  hard_cv_event_risk?: number;
  [key: string]: any;
}

function formatScanDate(d?: string): string {
  if (!d) return "N/A";
  try {
    const date = new Date(d);
    if (!isNaN(date.getTime())) return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {}
  return d;
}

function formatShortDate(d?: string): string {
  if (!d) return "N/A";
  try {
    const date = new Date(d);
    if (!isNaN(date.getTime())) return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {}
  return d;
}

function val(v: number | null | undefined, decimals = 0): string {
  if (v == null) return "—";
  return decimals > 0 ? Number(v).toFixed(decimals) : String(Math.round(v));
}

function riskLabel(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v < 10) return "Low";
  if (v < 25) return "Moderate";
  return "High";
}

function fattyLiverLabel(v: number | null | undefined): string {
  if (v == null) return "—";
  if (v === 0) return "Low";
  if (v === 1) return "Moderate";
  if (v === 2) return "High";
  return riskLabel(v);
}

function riskBadgeColors(level: string): { text: [number, number, number]; bg: [number, number, number] } {
  if (level === "Low") return { text: COLORS.emerald, bg: COLORS.emeraldLight };
  if (level === "Moderate") return { text: COLORS.amber, bg: COLORS.amberLight };
  if (level === "High") return { text: COLORS.red, bg: COLORS.redLight };
  return { text: COLORS.muted, bg: COLORS.cardBg };
}

// ─── Drawing helpers for professional cards ─────────────────────

function drawRoundedRect(doc: jsPDF, x: number, y: number, w: number, h: number, r: number, fillColor: [number, number, number], borderColor?: [number, number, number]) {
  doc.setFillColor(...fillColor);
  if (borderColor) {
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
  }
  doc.roundedRect(x, y, w, h, r, r, borderColor ? "FD" : "F");
}

function drawCiraLogoImage(doc: jsPDF, x: number, y: number, size: number) {
  // Render the Cira SVG logo as an inline image via canvas
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="49" height="46" viewBox="0 0 49 46" fill="none"><path d="M20.0544 45.9035C13.9619 45.1493 8.4424 41.9869 4.67089 37.0912C2.5602 34.3495 0.935763 30.7375 0.362708 27.5247C0.0871653 25.9507 0 24.8629 0 23.0425C0 18.9375 0.718211 15.833 2.45863 12.3879C5.52669 6.3173 11.3653 1.83478 18.0309 0.449507C19.8225 0.0723926 20.6203 -4.3968e-06 22.9194 -4.3968e-06C24.5658 0.00719931 25.2692 0.0363743 25.9654 0.130383C30.6147 0.790243 34.6402 2.6398 38.1142 5.70066C39.0715 6.54205 39.6082 7.10034 39.7822 7.42703C39.8765 7.61577 39.8982 7.81135 39.8765 8.27563C39.8549 8.92108 39.7386 9.13143 39.2963 9.36375C39.0643 9.47973 38.1794 9.5017 37.889 9.39293C37.7803 9.34934 37.316 8.95062 36.8517 8.50074C36.3874 8.05123 35.7492 7.47097 35.43 7.20984C31.9197 4.34492 27.3284 2.6913 22.8823 2.69851C17.5515 2.69851 12.4235 4.8816 8.60124 8.77665C7.09278 10.3143 6.01907 11.7939 5.03288 13.7087C3.87956 15.9425 3.2053 18.0604 2.857 20.5627C2.68303 21.8028 2.68303 24.189 2.857 25.3859C3.56764 30.2671 5.65672 34.3798 9.0947 37.6578C12.7502 41.1394 17.4283 43.1337 22.3387 43.3152C27.7131 43.504 33.1965 41.2337 37.1784 37.1647C38.4041 35.9098 39.028 35.1048 40.1593 33.3352C40.4712 32.8493 40.7396 32.7333 41.501 32.7622C42.0521 32.7838 42.065 32.8111 42.2318 32.9707C42.5365 33.2607 42.682 33.493 42.7195 34.0315C42.7195 34.6405 42.5671 34.9888 41.8565 36.0334C39.3615 39.6961 35.9163 42.5174 31.7965 44.2798C30.3024 44.9253 28.3077 45.5055 26.5381 45.8102C25.7695 45.9482 25.3052 45.9698 23.2817 45.9914C21.5193 46.0058 20.7067 45.9842 20.0541 45.9043L20.0544 45.9035Z" fill="url(#paint0_linear)"/><path d="M23.6465 38.273C23.5133 38.1102 23.0716 37.169 21.9159 34.5536C20.3609 31.0373 18.9995 28.0094 18.9489 27.9475C18.9168 27.9082 17.7751 27.4176 16.4042 26.8526C15.0331 26.2873 13.3705 25.5951 12.7024 25.317C11.6041 24.8566 10.975 24.6029 9.14779 23.8579C8.76648 23.7012 8.50884 23.5466 8.3987 23.412C8.24705 23.2266 8.24452 23.2007 8.39061 23.0812C8.47481 23.0123 10.1116 22.264 12.0304 21.4251C13.9392 20.5855 16.2469 19.569 17.1533 19.165L18.7992 18.4278L20.7897 13.5293C21.8796 10.8295 22.8195 8.49585 22.8709 8.34126C22.927 8.19203 23.0663 7.98457 23.1842 7.8881C23.3752 7.73189 23.4011 7.72936 23.5205 7.87545C23.594 7.96522 23.8513 8.48577 24.0906 9.03037C24.3299 9.57496 24.906 10.8748 25.3634 11.9153C25.8266 12.9515 26.4444 14.348 26.7338 15.0112C27.0285 15.6696 27.4735 16.683 27.7209 17.2489L28.1841 18.2851L31.6275 19.7226C33.5221 20.5154 35.6832 21.4275 36.4299 21.7447C37.1765 22.0618 37.9685 22.3884 38.1869 22.4722C38.4053 22.556 38.6528 22.7096 38.7308 22.8049C38.8685 22.9733 38.8619 22.988 38.6428 23.1672C38.5193 23.2683 37.9389 23.5554 37.3629 23.8018C36.2704 24.2645 30.3522 26.8471 29.1168 27.3984L28.4155 27.7096L27.8617 29.0714C27.5549 29.8188 27.0846 30.9624 26.8187 31.6113C26.5526 32.2599 26.1709 33.1905 25.9733 33.6708C24.2432 37.925 24.1693 38.0981 23.9727 38.2588C23.7932 38.4057 23.7569 38.4079 23.6465 38.273Z" fill="url(#paint1_linear)"/><path d="M9.48549 33.0524C9.59445 32.9678 10.0017 32.7711 10.4051 32.6047L11.1298 32.3082L11.4968 31.5276C11.9281 30.6048 12.2018 30.3189 12.4019 30.5767C12.4686 30.6626 12.6597 31.0742 12.8248 31.4878L13.1379 32.2456L13.9664 32.6032C14.4821 32.818 14.8495 33.0193 14.9341 33.1282C15.0587 33.2887 15.0549 33.319 14.8828 33.4527C14.7855 33.5282 14.3609 33.7384 13.9417 33.908L13.1939 34.2223L12.844 34.9897C12.6119 35.5188 12.4416 35.8075 12.2982 35.9188C12.0919 36.079 12.0818 36.0777 11.9217 35.8715C11.8282 35.7511 11.6372 35.3395 11.4884 34.9588L11.2187 34.2685L10.4137 33.9295C9.85844 33.6995 9.55404 33.5318 9.44734 33.3944C9.30508 33.2112 9.3074 33.1907 9.4852 33.0527L9.48549 33.0524Z" fill="url(#paint2_linear)"/><path d="M38.5454 19.2787C38.6019 19.2341 39.1826 18.9799 39.8404 18.7072C41.3834 18.0664 41.7584 17.8904 41.8559 17.7641C41.8978 17.71 42.0729 17.3254 42.2516 16.9095C43.1072 14.8894 43.206 14.6846 43.3576 14.5649C43.5052 14.4484 43.5129 14.4493 43.6328 14.6012C43.7389 14.7356 44.226 15.8789 44.8712 17.5171L45.0079 17.8598L46.04 18.2842C47.9388 19.0664 48.1512 19.1662 48.271 19.3181C48.3805 19.4568 48.3789 19.4725 48.227 19.5923C48.1402 19.6609 47.4867 19.9655 46.7777 20.2717C44.8807 21.0792 45.0365 20.9913 44.8725 21.3811C44.3356 22.699 43.6399 24.1988 43.5313 24.2845C43.4055 24.3838 43.3944 24.3786 43.2403 24.1834C43.1478 24.0662 43.031 23.8557 42.9742 23.7036C42.9164 23.5591 42.6514 22.9022 42.3823 22.249L41.9008 21.0592L41.6099 20.9228C41.4489 20.8526 40.7338 20.5441 40.021 20.248C38.9554 19.8078 38.6991 19.6793 38.5861 19.5361C38.4628 19.3799 38.4585 19.3479 38.5453 19.2794L38.5454 19.2787Z" fill="url(#paint3_linear)"/><defs><linearGradient id="paint0_linear" x1="58.5" y1="48" x2="55.5062" y2="-4.24799" gradientUnits="userSpaceOnUse"><stop stop-color="#9E1DF4"/><stop offset="0.754808" stop-color="#FB64B6"/></linearGradient><linearGradient id="paint1_linear" x1="38.0016" y1="52.4109" x2="28.8497" y2="1.40323" gradientUnits="userSpaceOnUse"><stop stop-color="#9E1DF4"/><stop offset="0.754808" stop-color="#FB64B6"/></linearGradient><linearGradient id="paint2_linear" x1="6.64307" y1="35.8413" x2="16.1963" y2="34.4781" gradientUnits="userSpaceOnUse"><stop stop-color="#9E1DF4"/><stop offset="0.754808" stop-color="#FB64B6"/></linearGradient><linearGradient id="paint3_linear" x1="33.8969" y1="23.9136" x2="50.4009" y2="21.2045" gradientUnits="userSpaceOnUse"><stop stop-color="#9E1DF4"/><stop offset="0.754808" stop-color="#FB64B6"/></linearGradient></defs></svg>`;
  try {
    const canvas = document.createElement("canvas");
    const scale = 4;
    canvas.width = 49 * scale;
    canvas.height = 46 * scale;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    return new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const dataUrl = canvas.toDataURL("image/png");
        doc.addImage(dataUrl, "PNG", x, y, size, size * (46 / 49));
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        // Fallback: pink circle with C
        doc.setFillColor(...COLORS.primary);
        doc.circle(x + size / 2, y + size / 2, size / 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size * 0.6);
        doc.setTextColor(255, 255, 255);
        doc.text("C", x + size / 2, y + size / 2 + size * 0.12, { align: "center" });
        resolve();
      };
      img.src = url;
    });
  } catch {
    // Fallback
    doc.setFillColor(...COLORS.primary);
    doc.circle(x + size / 2, y + size / 2, size / 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size * 0.6);
    doc.setTextColor(255, 255, 255);
    doc.text("C", x + size / 2, y + size / 2 + size * 0.12, { align: "center" });
    return Promise.resolve();
  }
}

async function drawScanHeader(doc: jsPDF, title: string, subtitle: string, date: string): Promise<number> {
  // Top gradient bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, 210, 4, "F");
  doc.setFillColor(...COLORS.primaryLight);
  doc.rect(140, 0, 70, 4, "F");

  // Real Cira logo
  await drawCiraLogoImage(doc, 18, 8, 12);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.foreground);
  doc.text("Cira", 33, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.primary);
  doc.text("AI Health Nurse", 33, 21);

  // Right side: report type badge
  const badgeW = 40;
  drawRoundedRect(doc, 190 - badgeW, 8, badgeW, 7, 2, COLORS.purpleLight);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.purple);
  doc.text(subtitle.toUpperCase(), 190 - badgeW / 2, 13, { align: "center" });

  // Date below badge
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...COLORS.muted);
  doc.text(formatShortDate(date), 190 - badgeW / 2, 19, { align: "center" });

  // Separator
  drawLine(doc, 26, 18, 192);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.foreground);
  const titleLines = doc.splitTextToSize(title, 170);
  let y = 34;
  for (const line of titleLines) {
    doc.text(line, 20, y);
    y += 6;
  }

  return y + 2;
}

function drawScanFooter(doc: jsPDF) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    
    // Disclaimer box
    const disclaimerY = 276;
    drawRoundedRect(doc, 15, disclaimerY, 180, 12, 2, COLORS.cardBg, COLORS.border);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.primary);
    doc.text("MEDICAL DISCLAIMER", 20, disclaimerY + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(5.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("Cira is an AI health nurse, not a licensed medical professional. This report is for informational purposes only.", 20, disclaimerY + 7.5);
    doc.text("Always discuss these findings with your doctor. Trained on peer-reviewed medical data worldwide.", 20, disclaimerY + 10.5);

    // Bottom bar
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 294, 210, 3, "F");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...COLORS.muted);
    doc.text("Generated by Cira  •  askainurse.com", 105, 292, { align: "center" });
    doc.text(`Page ${i} of ${pages}`, 192, 292, { align: "right" });
  }
}


function drawSectionTitle(doc: jsPDF, title: string, y: number): number {
  y = checkPage(doc, y, 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLORS.primary);
  doc.text(title, 20, y);
  y += 2;
  
  // Thin accent line
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(20, y, 70, y);
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.15);
  doc.line(70, y, 192, y);
  
  return y + 5;
}

function drawVitalCard(doc: jsPDF, label: string, value: string, unit: string, x: number, y: number, w: number, h: number): void {
  drawRoundedRect(doc, x, y, w, h, 2.5, COLORS.cardBg, COLORS.border);
  
  // Label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.muted);
  const truncLabel = doc.splitTextToSize(label, w - 6)[0] || label;
  doc.text(truncLabel, x + 3, y + 5);
  
  // Value + unit on same baseline but unit smaller — check fit
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.foreground);
  doc.text(value, x + 3, y + 12);
  
  // Unit below value to avoid overlap
  if (unit && value !== "—") {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.muted);
    doc.text(unit, x + 3, y + 15.5);
  }
}

function drawRiskBadge(doc: jsPDF, label: string, level: string, x: number, y: number, w: number, h: number): void {
  drawRoundedRect(doc, x, y, w, h, 2.5, COLORS.cardBg, COLORS.border);
  
  // Label
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.muted);
  const truncRiskLabel = doc.splitTextToSize(label, w - 8)[0] || label;
  doc.text(truncRiskLabel, x + 3.5, y + 5);
  
  // Risk badge pill
  const { text, bg } = riskBadgeColors(level);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  const badgeW = Math.max(doc.getTextWidth(level) + 5, 14);
  drawRoundedRect(doc, x + 3.5, y + 7.5, badgeW, 5, 1.5, bg);
  doc.setTextColor(...text);
  doc.text(level, x + 3.5 + badgeW / 2, y + 11, { align: "center" });
}

function addScanBlockPro(doc: jsPDF, scan: VitalScanData, y: number, showDate = true): number {
  if (showDate) {
    y = checkPage(doc, y, 12);
    // Date banner
    drawRoundedRect(doc, 20, y - 3, 172, 8, 2, COLORS.purpleLight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.purple);
    doc.text(formatScanDate(scan.created_at || scan.date), 26, y + 2);
    y += 10;
  }

  // Vital Signs cards
  const vitals = ([
    ["Blood Pressure", scan.systolic_bp && scan.diastolic_bp ? `${Math.round(scan.systolic_bp)}/${Math.round(scan.diastolic_bp)}` : "—", "mmHg"],
    ["Heart Rate", val(scan.heart_rate), "bpm"],
    ["HRV (SDNN)", val(scan.hrv_sdnn), "ms"],
    ["Breathing Rate", val(scan.breathing_rate), "/min"],
    ["Stress Index", val(scan.stress_index), "/100"],
    ["Cardiac Workload", val(scan.cardiac_workload), ""],
    ["Parasympathetic", val(scan.parasympathetic_activity), ""],
  ] as [string, string, string][]).filter(([, v]) => v !== "—");

  if (vitals.length > 0) {
    y = drawSectionTitle(doc, "Vital Signs", y);
    const cardW = 40;
    const cardH = 19;
    const gap = 3;
    const cols = 4;
    for (let i = 0; i < vitals.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = 20 + col * (cardW + gap);
      const cy = y + row * (cardH + gap);
      if (i === 0 || col === 0) {
        const neededY = cy + cardH;
        if (neededY > 270) {
          doc.addPage();
          y = 20;
        }
      }
      drawVitalCard(doc, vitals[i][0], vitals[i][1], vitals[i][2], cx, y + row * (cardH + gap), cardW, cardH);
    }
    y += Math.ceil(vitals.length / cols) * (cardH + gap) + 4;
  }

  // Health Indices cards
  const indices = ([
    ["BMI", val(scan.bmi, 1), "kg/m²"],
    ["Vascular Age", val(scan.vascular_age), "yrs"],
    ["Wellness Score", val(scan.wellness_score), "/100"],
    ["Waist:Height", val(scan.waist_to_height_ratio, 2), ""],
    ["Body Fat", val(scan.body_fat_percentage, 1), "%"],
    ["BMR", val(scan.basal_metabolic_rate), "kcal"],
    ["Body Shape", val(scan.body_shape_index, 3), ""],
    ["Daily Energy", val(scan.total_daily_energy_expenditure), "kcal"],
  ] as [string, string, string][]).filter(([, v]) => v !== "—");

  if (indices.length > 0) {
    y = drawSectionTitle(doc, "Health Indices", y);
    const cardW = 40;
    const cardH = 19;
    const gap = 3;
    const cols = 4;
    for (let i = 0; i < indices.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      if (col === 0 && y + row * (cardH + gap) + cardH > 270) {
        doc.addPage();
        y = 20;
      }
      drawVitalCard(doc, indices[i][0], indices[i][1], indices[i][2], 20 + col * (cardW + gap), y + row * (cardH + gap), cardW, cardH);
    }
    y += Math.ceil(indices.length / cols) * (cardH + gap) + 4;
  }

  // Health Risks badges
  const risks = ([
    ["Cardiovascular", riskLabel(scan.cv_disease_risk)],
    ["Coronary Heart", riskLabel(scan.coronary_heart_disease_risk)],
    ["Stroke", riskLabel(scan.stroke_risk)],
    ["Heart Failure", riskLabel(scan.heart_failure_risk)],
    ["Diabetes", riskLabel(scan.diabetes_risk)],
    ["Fatty Liver", fattyLiverLabel(scan.fatty_liver_risk)],
    ["CV Event", riskLabel(scan.hard_cv_event_risk)],
  ] as [string, string][]).filter(([, v]) => v !== "—");

  if (risks.length > 0) {
    y = drawSectionTitle(doc, "Health Risks", y);
    const cardW = 40;
    const cardH = 19;
    const gap = 3;
    const cols = 4;
    for (let i = 0; i < risks.length; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      if (col === 0 && y + row * (cardH + gap) + cardH > 270) {
        doc.addPage();
        y = 20;
      }
      drawRiskBadge(doc, risks[i][0], risks[i][1], 20 + col * (cardW + gap), y + row * (cardH + gap), cardW, cardH);
    }
    y += Math.ceil(risks.length / cols) * (cardH + gap) + 4;
  }

  return y;
}

export async function generateSingleScanPdf(scan: VitalScanData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = await drawScanHeader(doc, "Face Scan Report", "Vital Scan", scan.created_at || scan.date || new Date().toISOString());
  y = addScanBlockPro(doc, scan, y, false);
  drawScanFooter(doc);
  return doc;
}

export async function generateCombinedScansPdf(scans: VitalScanData[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const sorted = [...scans].sort((a, b) => new Date(b.created_at || b.date || 0).getTime() - new Date(a.created_at || a.date || 0).getTime());

  let y = await drawScanHeader(doc, "Face Scan History", "Combined Report", new Date().toISOString());

  // Patient summary line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${sorted.length} scans included  |  Most recent first`, 20, y);
  y += 8;

  // Comparison Table — dates as rows, metrics as columns
  if (sorted.length > 1) {
    y = drawSectionTitle(doc, "Scan Comparison", y);

    const metrics: [string, (s: VitalScanData) => string][] = [
      ["HR", s => val(s.heart_rate)],
      ["BP", s => s.systolic_bp && s.diastolic_bp ? `${Math.round(s.systolic_bp)}/${Math.round(s.diastolic_bp)}` : "—"],
      ["BR", s => val(s.breathing_rate)],
      ["Stress", s => val(s.stress_index)],
      ["HRV", s => val(s.hrv_sdnn)],
      ["BMI", s => val(s.bmi, 1)],
      ["Wellness", s => val(s.wellness_score)],
      ["Vasc Age", s => val(s.vascular_age)],
    ];

    const tableX = 20;
    const dateColW = 30;
    const metricColW = Math.min(20, (172 - dateColW) / metrics.length);
    const startX = tableX + dateColW;
    const tableW = dateColW + metrics.length * metricColW;

    // Header row — metric names
    drawRoundedRect(doc, tableX, y - 1, tableW, 7, 1.5, COLORS.purpleLight);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...COLORS.purple);
    doc.text("Date", tableX + 2, y + 3);
    metrics.forEach(([label], i) => {
      doc.text(label, startX + i * metricColW + metricColW / 2, y + 3, { align: "center" });
    });
    y += 9;

    // Data rows — one per scan
    sorted.forEach((scan, rowIdx) => {
      y = checkPage(doc, y, 6);
      if (rowIdx % 2 === 0) {
        doc.setFillColor(...COLORS.cardBg);
        doc.rect(tableX, y - 3, tableW, 5.5, "F");
      }

      // Date label
      const d = new Date(scan.created_at || scan.date || "");
      const dateLabel = !isNaN(d.getTime())
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
        : `Scan ${rowIdx + 1}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(dateLabel, tableX + 2, y);

      // Metric values
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...COLORS.foreground);
      metrics.forEach(([, getter], i) => {
        doc.text(getter(scan), startX + i * metricColW + metricColW / 2, y, { align: "center" });
      });
      y += 5.5;
    });
    y += 6;
  }


  drawScanFooter(doc);
  return doc;
}

export async function downloadSingleScanPdf(scan: VitalScanData) {
  const doc = await generateSingleScanPdf(scan);
  const d = new Date(scan.created_at || scan.date || "");
  const dateStr = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "scan";
  doc.save(`Cira_Vital_Scan_${dateStr}.pdf`);
}

export async function downloadCombinedScansPdf(scans: VitalScanData[]) {
  const doc = await generateCombinedScansPdf(scans);
  doc.save(`Cira_Combined_Scans_${scans.length}_${Date.now()}.pdf`);
}
