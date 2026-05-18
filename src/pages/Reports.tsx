import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Home, LogOut, ScanFace, Sparkles, FileText, Download, Eye, Calendar, Search, UserRound, Loader2, CheckSquare, Square, Lock } from "lucide-react";
import ciraLogo from "@/assets/cira-logo.svg";
import ProfilePopover from "@/components/ProfilePopover";
import AiSparkleIcon from "@/components/AiSparkleIcon";
import MobileBottomNav from "@/components/MobileBottomNav";
import { reportsApi, vitalsApi, billingApi } from "@/lib/apiClient";
import { getUser, logout } from "@/lib/auth";
import { downloadReportPdf, downloadSingleScanPdf, downloadCombinedScansPdf } from "@/lib/reportPdf";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit";

const navItems = [
  { icon: Home, label: "Home", id: "home" },
  { icon: Sparkles, label: "Ask Cira", id: "chat" },
  { icon: ScanFace, label: "Scan", id: "scan" },
  { icon: FileText, label: "Reports", id: "reports" },
];

const Reports = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [scans, setScans] = useState<any[]>([]);
  const [selectedScans, setSelectedScans] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [scansLoading, setScansLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assessments" | "scans">("assessments");
  // Downloads available on all plans (including Basic)
  const [isBasicPlan, setIsBasicPlan] = useState(false);
  const localUser = getUser();
  const initials = localUser?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U";

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await reportsApi.getAll();
        setReports(Array.isArray(data) ? data : data.reports || []);
      } catch (e) {
        console.error("Failed to load reports:", e);
      } finally {
        setLoading(false);
      }
    };
    const loadScans = async () => {
      try {
        const data = await vitalsApi.getHistory();
        const list = Array.isArray(data) ? data : data.scans || data.history || [];
        setScans(list);
      } catch (e) {
        console.error("Failed to load scans:", e);
      } finally {
        setScansLoading(false);
      }
    };
    loadReports();
    loadScans();
    // Downloads are available on all plans — no plan check needed
  }, []);

  const filteredReports = reports.filter((r: any) =>
    (r.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async (report: any) => {
    if (isBasicPlan) {
      toast.error("Upgrade to Pro to download reports", { action: { label: "Upgrade", onClick: () => navigate("/upgrade") }, duration: 5000 });
      return;
    }
    try {
      await downloadReportPdf(report);
      logAuditEvent("DOWNLOAD_REPORT_PDF", report.id);
      toast.success("PDF downloaded");
    } catch (e) {
      console.error("PDF generation failed:", e);
      toast.error("Failed to generate PDF");
    }
  };

  const toggleScan = (id: string) => {
    setSelectedScans(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllScans = () => {
    if (selectedScans.size === scans.length) {
      setSelectedScans(new Set());
    } else {
      setSelectedScans(new Set(scans.map(s => s.id || s._id)));
    }
  };

  const handleDownloadCombined = async () => {
    if (isBasicPlan) {
      toast.error("Upgrade to Pro to download reports", { action: { label: "Upgrade", onClick: () => navigate("/upgrade") }, duration: 5000 });
      return;
    }
    const selected = scans.filter(s => selectedScans.has(s.id || s._id));
    if (selected.length === 0) {
      toast.error("Select at least one scan");
      return;
    }
    try {
      await downloadCombinedScansPdf(selected);
      logAuditEvent("DOWNLOAD_COMBINED_SCANS_PDF", Array.from(selectedScans).join(","));
      toast.success(`Combined report (${selected.length} scans) downloaded`);
    } catch (e) {
      console.error("Combined PDF failed:", e);
      toast.error("Failed to generate PDF");
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return "N/A";
    try {
      const date = new Date(d);
      if (!isNaN(date.getTime())) return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {}
    return d;
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex bg-background" style={{ height: '100dvh' }}>
      {/* Sidebar */}
      <div className="hidden md:flex w-[72px] border-r border-border bg-card flex-col items-center py-4 shrink-0">
        <div className="mb-4">
          <img src={ciraLogo} alt="Cira" width={28} height={28} />
        </div>
        <div className="w-10 h-[1px] bg-border mb-3" />
        <div className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === "home") navigate("/dashboard");
                  if (item.id === "chat") navigate("/chat");
                  if (item.id === "scan") navigate("/vitals-scan");
                  if (item.id === "reports") navigate("/reports");
                  if (item.id === "doctor") navigate("/doctor");
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all ${
                  item.id === "reports"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {item.id === "chat" ? (
                  <AiSparkleIcon size={18} />
                ) : (
                  <Icon size={18} strokeWidth={item.id === "reports" ? 2 : 1.5} />
                )}
                <span className="text-[9px] font-body font-medium leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-auto flex flex-col items-center gap-2">
          <button
            onClick={handleLogout}
            className="w-14 py-2 rounded-xl flex flex-col items-center gap-0.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
          >
            <LogOut size={18} strokeWidth={1.5} />
            <span className="text-[9px] font-body font-medium leading-none">Logout</span>
          </button>
          <ProfilePopover>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xs font-medium font-body cursor-pointer ring-2 ring-primary/20">
              {initials}
            </div>
          </ProfilePopover>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto relative">
        <div className="fixed inset-0 pointer-events-none md:left-[72px]">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-pink-50/30 to-orange-50/40" />
          <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-gradient-to-br from-blue-200/40 to-purple-100/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gradient-to-tl from-orange-200/40 via-pink-100/30 to-rose-100/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground mb-1" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              Reports
            </h1>
            <p className="text-sm text-muted-foreground font-body">View, download, and manage your health reports</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("assessments")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "assessments"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Assessments
              {reports.length > 0 && <span className="ml-1.5 text-xs opacity-70">{reports.length}</span>}
            </button>
            <button
              onClick={() => setActiveTab("scans")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === "scans"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            >
              Vital Scans
              {scans.length > 0 && <span className="ml-1.5 text-xs opacity-70">{scans.length}</span>}
            </button>
          </div>

          {/* ── Assessments Tab ── */}
          {activeTab === "assessments" && (
            <>
              <div className="mb-6">
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search reports..."
                    className="w-full h-10 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="text-center py-16">
                  <FileText size={40} className="text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No reports found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Complete a detailed assessment to generate your first report</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredReports.map((report: any) => (
                    <div
                      key={report.id}
                      className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:shadow-md hover:border-border transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-lg shrink-0">📋</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h3 className="text-sm font-semibold text-foreground truncate" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                              {report.title}
                            </h3>
                            <span className="shrink-0 text-[10px] font-medium px-2.5 py-0.5 rounded-full text-purple-600 bg-purple-50">
                              {report.type || "Detailed Assessment"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{report.summary}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar size={12} />{report.date || report.created_at}</span>
                              {report.size && <span>{report.size}</span>}
                              <span className="text-emerald-600 font-medium">{report.status || "Ready"}</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => {
                                  const isOpening = previewId !== report.id;
                                  setPreviewId(isOpening ? report.id : null);
                                  if (isOpening) {
                                    logAuditEvent("PREVIEW_REPORT", report.id);
                                  }
                                }}
                                className="h-8 px-3 rounded-lg border border-border/60 text-xs font-medium text-foreground hover:bg-accent transition-all flex items-center gap-1.5"
                              >
                                <Eye size={13} />Preview
                              </button>
                              <button
                                onClick={() => handleDownload(report)}
                                className={`h-8 px-3 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 ${isBasicPlan ? "bg-muted text-muted-foreground" : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"}`}
                              >
                                {isBasicPlan ? <Lock size={13} /> : <Download size={13} />}
                                {isBasicPlan ? "Upgrade to Download" : "Download"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {previewId === report.id && (
                        <div className="mt-4 pt-4 border-t border-border/40">
                          <div className="bg-secondary/30 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <FileText size={14} className="text-muted-foreground" />
                              <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>Report Preview</p>
                            </div>
                            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                              <p><span className="font-medium text-foreground">Report ID:</span> {report.id}</p>
                              <p><span className="font-medium text-foreground">Type:</span> {report.type || "Detailed Assessment"}</p>
                              <p><span className="font-medium text-foreground">Generated:</span> {report.date || report.created_at}</p>
                              <p><span className="font-medium text-foreground">Summary:</span> {report.summary}</p>
                              <p className="pt-2 text-[10px] text-muted-foreground/60">⚕️ This report was generated by Cira AI Health Nurse.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Vital Scans Tab ── */}
          {activeTab === "scans" && (
            <>
              {/* Combined download bar */}
              {scans.length > 0 && (
                <div className="flex items-center justify-between mb-4 bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllScans}
                      className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {selectedScans.size === scans.length ? (
                        <CheckSquare size={16} className="text-primary" />
                      ) : (
                        <Square size={16} />
                      )}
                      {selectedScans.size === scans.length ? "Deselect all" : "Select all"}
                    </button>
                    {selectedScans.size > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedScans.size} selected
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleDownloadCombined}
                    disabled={selectedScans.size === 0}
                    className={`h-8 px-4 rounded-lg text-xs font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${isBasicPlan ? "bg-muted text-muted-foreground" : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"}`}
                  >
                    {isBasicPlan ? <Lock size={13} /> : <Download size={13} />}
                    {isBasicPlan ? "Upgrade to Download" : "Download Combined Report"}
                  </button>
                </div>
              )}

              {scansLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : scans.length === 0 ? (
                <div className="text-center py-16">
                  <ScanFace size={40} className="text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">No vital scans yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Complete a face scan to see your vitals here</p>
                  <button
                    onClick={() => navigate("/vitals-scan")}
                    className="mt-4 h-9 px-5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium shadow-sm hover:shadow-md transition-all"
                  >
                    Start a Scan
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {scans.map((scan: any) => {
                    const scanId = scan.id || scan._id;
                    const isSelected = selectedScans.has(scanId);
                    const hr = scan.heart_rate ? `${Math.round(scan.heart_rate)} bpm` : null;
                    const bp = scan.systolic_bp && scan.diastolic_bp ? `${Math.round(scan.systolic_bp)}/${Math.round(scan.diastolic_bp)}` : null;
                    const stress = scan.stress_index != null ? `Stress: ${Math.round(scan.stress_index)}/100` : null;
                    const wellness = scan.wellness_score != null ? `Wellness: ${Math.round(scan.wellness_score)}/100` : null;

                    return (
                      <div
                        key={scanId}
                        className={`bg-card/80 backdrop-blur-sm border rounded-2xl p-4 hover:shadow-md transition-all group ${
                          isSelected ? "border-primary/50 ring-1 ring-primary/20" : "border-border/50 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleScan(scanId)}
                            className="shrink-0"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-primary" />
                            ) : (
                              <Square size={18} className="text-muted-foreground/40 hover:text-muted-foreground" />
                            )}
                          </button>

                          {/* Scan icon */}
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                            <ScanFace size={18} className="text-emerald-600" />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                                Face Scan
                              </p>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Calendar size={10} />
                                {formatDate(scan.created_at || scan.date)}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                              {hr && <span>HR: {hr}</span>}
                              {bp && <span>BP: {bp}</span>}
                              {stress && <span>{stress}</span>}
                              {wellness && <span>{wellness}</span>}
                            </div>
                          </div>

                          {/* Download single */}
                          <button
                            onClick={async () => {
                              if (isBasicPlan) {
                                toast.error("Upgrade to Pro to download reports", { action: { label: "Upgrade", onClick: () => navigate("/upgrade") }, duration: 5000 });
                                return;
                              }
                              try {
                                await downloadSingleScanPdf(scan);
                                logAuditEvent("DOWNLOAD_SINGLE_SCAN_PDF", scanId);
                                toast.success("Scan PDF downloaded");
                              } catch {
                                toast.error("Failed to generate PDF");
                              }
                            }}
                            className={`shrink-0 h-8 px-3 rounded-lg border border-border/60 text-xs font-medium transition-all flex items-center gap-1.5 opacity-0 group-hover:opacity-100 ${isBasicPlan ? "text-muted-foreground" : "text-foreground hover:bg-accent"}`}
                          >
                            {isBasicPlan ? <Lock size={13} /> : <Download size={13} />}
                            <span className="hidden sm:inline">{isBasicPlan ? "Pro" : "PDF"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default Reports;